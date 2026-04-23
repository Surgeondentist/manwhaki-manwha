/**
 * Sube un manhwa desde una carpeta local a Supabase Storage + tablas comics / chapters / chapter_pages.
 *
 * Uso (desde la raíz del repo, con Node 18+):
 *   node scripts/upload-local-manga.mjs --dir "C:\ruta\a\tu\carpeta"
 *
 * Variables en .env.local (o en el entorno):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   ← Project Settings → API → service_role (solo en servidor/scripts, nunca en el cliente)
 *
 * Bucket (crear en Supabase → Storage, idealmente público para lectura):
 *   COMIC_STORAGE_BUCKET=comic-pages   (opcional, por defecto comic-pages)
 *
 * Cache en CDN: las subidas usan cacheControl largo (1 año) para PageSpeed /
 * visitas repetidas. Si sustituyes un archivo en la misma ruta, los navegadores
 * pueden seguir viendo la versión en caché hasta que expire.
 *
 * Estructura esperada de la carpeta (--dir):
 *   comic.json          metadatos del cómic
 *   portada.webp        (opcional) imagen de portada si la declaras en comic.json → cover
 *   01/   (o 1/)        imágenes del capítulo 1  → 001.webp, 002.webp, … o 1.jpg, 2.jpg
 *   02/                 capítulo 2
 *
 * comic.json ejemplo:
 *   {
 *     "title": "Mi obra",
 *     "author_name": "Tu nombre",
 *     "description": "Opcional",
 *     "status": "ongoing",
 *     "cover": { "file": "portada.webp" },
 *     "banner": { "file": "banner-destacado.webp" },
 *     "comic_id": "opcional-uuid-para-actualizar-en-lugar-de-crear"
 *   }
 *
 * Portada catálogo (opcional): objeto "cover" con "file" (o "path") = ruta relativa al manhwa.
 * Se sube a comics/<id-comic>/cover.<ext> → cover_url (vertical / tarjetas).
 *
 * Banner destacado inicio (opcional): "banner" con la misma forma → comics/<id>/banner.<ext>
 * → banner_url (imagen ancha). Si no hay banner, el hero usa cover_url con recorte tipo banner.
 * Si no hay "cover", en cómics nuevos cover_url = primera página del primer capítulo subido.
 *
 * ── Actualizar un cómic ya publicado ──
 * En comic.json incluye "comic_id": "<uuid-del-cómic>" o pasa:
 *   node scripts/upload-local-manga.mjs --dir "..." --comic-id "<uuid>"
 * (--comic-id tiene prioridad sobre comic.json.)
 *
 * Con comic_id el script:
 *   - Actualiza título, descripción, autor y estado desde comic.json.
 *   - Cada carpeta 01/, 02/, …: si ese chapter_number ya existe, reemplaza TODO el
 *     capítulo (borra viñetas en BD, vacía la carpeta en Storage y vuelve a subir
 *     las imágenes del disco en orden). Sirve para corregir una sola imagen: deja
 *     la carpeta del capítulo con todas las páginas en orden (solo cambia el archivo).
 *   - Si el número de capítulo no existía, crea el capítulo como en un alta nueva.
 *   - No cambia cover_url ni banner_url salvo que pongas "cover" / "banner" en comic.json.
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function parseArgs() {
  const argv = process.argv.slice(2);
  let dir = null;
  let comicId = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dir" && argv[i + 1]) {
      dir = path.resolve(argv[++i]);
    } else if (argv[i] === "--comic-id" && argv[i + 1]) {
      comicId = String(argv[++i]).trim();
    }
  }
  return { dir, comicId };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(s) {
  return typeof s === "string" && UUID_RE.test(s);
}

function naturalCompare(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

const IMAGE_EXT = new Set([".webp", ".jpg", ".jpeg", ".png", ".gif"]);

/** Segundos — alineado con recomendaciones de caché para recursos estáticos (Lighthouse / PageSpeed). */
const STORAGE_CACHE_CONTROL_MAX_AGE = "31536000";

function isImageFile(name) {
  const ext = path.extname(name).toLowerCase();
  return IMAGE_EXT.has(ext);
}

function mimeForExt(ext) {
  const map = {
    ".webp": "image/webp",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
  };
  return map[ext.toLowerCase()] ?? "application/octet-stream";
}

/** Carpetas de capítulo: solo nombre numérico (01, 1, 02…) */
function parseChapterNumber(dirName) {
  const m = dirName.match(/^(\d+)$/);
  return m ? parseInt(m[1], 10) : null;
}

function listChapterDirs(rootDir) {
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  const dirs = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const n = parseChapterNumber(e.name);
    if (n === null) continue;
    dirs.push({ name: e.name, number: n, fullPath: path.join(rootDir, e.name) });
  }
  dirs.sort((a, b) => a.number - b.number);
  return dirs;
}

function listImagesInDir(dirPath) {
  const files = fs
    .readdirSync(dirPath)
    .filter((f) => isImageFile(f))
    .sort(naturalCompare);
  return files.map((f) => path.join(dirPath, f));
}

/**
 * @param {unknown} metaValue valor de comic.json para "cover" o "banner"
 * @param {string} rootDir
 * @param {"cover" | "banner"} jsonKey
 * @returns {{ ok: true, diskPath: string | null } | { ok: false, message: string }}
 */
function resolveJsonImageFile(metaValue, rootDir, jsonKey) {
  if (metaValue === undefined || metaValue === null) {
    return { ok: true, diskPath: null };
  }
  if (typeof metaValue !== "object" || Array.isArray(metaValue)) {
    return {
      ok: false,
      message: `comic.json: "${jsonKey}" debe ser un objeto, p. ej. { "file": "archivo.webp" }`,
    };
  }
  const rel = metaValue.file ?? metaValue.path;
  if (!rel || typeof rel !== "string") {
    return {
      ok: false,
      message: `comic.json: en "${jsonKey}" indica "file" (ruta relativa al manhwa).`,
    };
  }
  const root = path.resolve(rootDir);
  const abs = path.resolve(root, rel);
  const relFromRoot = path.relative(root, abs);
  if (relFromRoot.startsWith("..") || path.isAbsolute(relFromRoot)) {
    return {
      ok: false,
      message: `La ruta de "${jsonKey}" debe estar dentro de la carpeta del manhwa.`,
    };
  }
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
    return {
      ok: false,
      message: `No existe el archivo (${jsonKey}): ${rel}`,
    };
  }
  if (!isImageFile(path.basename(abs))) {
    return {
      ok: false,
      message: `Debe ser imagen .webp/.jpg/.png/.gif (${jsonKey}): ${rel}`,
    };
  }
  return { ok: true, diskPath: abs };
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 */
async function uploadDiskImageToPath(supabase, bucket, storagePath, diskPath) {
  const ext = path.extname(diskPath).toLowerCase();
  const body = fs.readFileSync(diskPath);
  const { error: upErr } = await supabase.storage
    .from(bucket)
    .upload(storagePath, body, {
      contentType: mimeForExt(ext),
      upsert: true,
      cacheControl: STORAGE_CACHE_CONTROL_MAX_AGE,
    });
  if (upErr) return { error: upErr };
  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return { publicUrl: pub.publicUrl };
}

/**
 * Borra todos los objetos bajo comics/{comicId}/{chapterId}/ (no falla si la carpeta está vacía).
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 */
async function emptyChapterStorageFolder(supabase, bucket, comicId, chapterId) {
  const folderPrefix = `comics/${comicId}/${chapterId}`;
  const { data: items, error: listErr } = await supabase.storage
    .from(bucket)
    .list(folderPrefix);
  if (listErr) return { error: listErr };
  if (!items?.length) return {};
  const paths = items.map((o) => `${folderPrefix}/${o.name}`);
  const { error: rmErr } = await supabase.storage.from(bucket).remove(paths);
  if (rmErr) return { error: rmErr };
  return {};
}

async function main() {
  loadEnvLocal();

  const { dir, comicId: comicIdArg } = parseArgs();
  if (!dir || !fs.existsSync(dir)) {
    console.error(
      'Indica la carpeta del manhwa, por ejemplo:\n  node scripts/upload-local-manga.mjs --dir "C:\\MisProyectos\\MiManhwa"'
    );
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const bucket =
    process.env.COMIC_STORAGE_BUCKET?.trim() || "comic-pages";

  if (!url || !serviceKey) {
    console.error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local"
    );
    process.exit(1);
  }

  const metaPath = path.join(dir, "comic.json");
  if (!fs.existsSync(metaPath)) {
    console.error(
      `No existe comic.json en:\n  ${dir}\nCopia scripts/local-manga-ejemplo/comic.json y edítalo.`
    );
    process.exit(1);
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  if (!meta.title) {
    console.error("comic.json debe incluir al menos \"title\".");
    process.exit(1);
  }

  const coverResolved = resolveJsonImageFile(meta.cover, dir, "cover");
  if (!coverResolved.ok) {
    console.error(coverResolved.message);
    process.exit(1);
  }

  const bannerResolved = resolveJsonImageFile(meta.banner, dir, "banner");
  if (!bannerResolved.ok) {
    console.error(bannerResolved.message);
    process.exit(1);
  }

  const chapterDirs = listChapterDirs(dir);

  const comicIdFromMeta =
    typeof meta.comic_id === "string" ? meta.comic_id.trim() : "";
  const comicIdFromCli =
    typeof comicIdArg === "string" && comicIdArg.length > 0
      ? comicIdArg.trim()
      : "";
  const existingComicIdRaw = comicIdFromCli || comicIdFromMeta;
  const isUpdate = Boolean(existingComicIdRaw);

  if (chapterDirs.length === 0 && !isUpdate) {
    console.error(
      "No se encontraron carpetas de capítulo. Usa nombres solo numéricos: 01, 02, 1, 2…"
    );
    process.exit(1);
  }

  if (isUpdate && !isUuid(existingComicIdRaw)) {
    console.error(
      "comic_id debe ser un UUID válido (en comic.json o con --comic-id)."
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let comicId;

  if (isUpdate) {
    comicId = existingComicIdRaw;
    const { data: existing, error: exErr } = await supabase
      .from("comics")
      .select("id")
      .eq("id", comicId)
      .maybeSingle();

    if (exErr || !existing) {
      console.error(
        exErr?.message ?? `No existe un cómic con id ${comicId} (revisa comic_id o --comic-id).`
      );
      process.exit(1);
    }

    const { error: upMetaErr } = await supabase
      .from("comics")
      .update({
        title: meta.title,
        description: meta.description ?? null,
        author_name: meta.author_name ?? null,
        status: meta.status === "completed" ? "completed" : "ongoing",
      })
      .eq("id", comicId);

    if (upMetaErr) {
      console.error("Error actualizando metadatos del cómic:", upMetaErr.message);
      process.exit(1);
    }

    console.log("Modo actualización · cómic:", comicId);
  } else {
    const { data: comic, error: comicErr } = await supabase
      .from("comics")
      .insert({
        title: meta.title,
        description: meta.description ?? null,
        author_name: meta.author_name ?? null,
        status: meta.status === "completed" ? "completed" : "ongoing",
        cover_url: null,
      })
      .select("id")
      .single();

    if (comicErr || !comic) {
      console.error("Error creando cómic:", comicErr?.message);
      process.exit(1);
    }

    comicId = comic.id;
    console.log("Cómic creado:", comicId);
  }

  let explicitCoverUrl = null;
  if (coverResolved.diskPath) {
    const ext = path.extname(coverResolved.diskPath).toLowerCase();
    const coverStoragePath = `comics/${comicId}/cover${ext}`;
    const upCover = await uploadDiskImageToPath(
      supabase,
      bucket,
      coverStoragePath,
      coverResolved.diskPath
    );
    if (upCover.error) {
      console.error(`Error subiendo portada (${coverStoragePath}):`, upCover.error.message);
      process.exit(1);
    }
    explicitCoverUrl = upCover.publicUrl;
    console.log(`  Portada (catálogo) → ${coverStoragePath}`);
  }

  let explicitBannerUrl = null;
  if (bannerResolved.diskPath) {
    const ext = path.extname(bannerResolved.diskPath).toLowerCase();
    const bannerStoragePath = `comics/${comicId}/banner${ext}`;
    const upBanner = await uploadDiskImageToPath(
      supabase,
      bucket,
      bannerStoragePath,
      bannerResolved.diskPath
    );
    if (upBanner.error) {
      console.error(`Error subiendo banner (${bannerStoragePath}):`, upBanner.error.message);
      process.exit(1);
    }
    explicitBannerUrl = upBanner.publicUrl;
    console.log(`  Banner (destacado inicio) → ${bannerStoragePath}`);
  }

  let firstPublicUrl = null;

  for (const ch of chapterDirs) {
    const images = listImagesInDir(ch.fullPath);
    if (images.length === 0) {
      console.warn(`Capítulo ${ch.number} (${ch.name}): sin imágenes, se omite.`);
      continue;
    }

    const chapterTitle =
      meta.chapterTitles?.[String(ch.number)] ?? `Capítulo ${ch.number}`;

    const { data: existingCh, error: findChErr } = await supabase
      .from("chapters")
      .select("id")
      .eq("comic_id", comicId)
      .eq("chapter_number", ch.number)
      .maybeSingle();

    if (findChErr) {
      console.error(`Error buscando capítulo ${ch.number}:`, findChErr.message);
      process.exit(1);
    }

    let chapterId;
    let replaced = false;

    if (existingCh?.id) {
      chapterId = existingCh.id;
      replaced = true;
      console.log(
        `  Capítulo ${ch.number} (existente) → ${chapterId} · reemplazo completo (${images.length} páginas)`
      );

      const { error: delPgErr } = await supabase
        .from("chapter_pages")
        .delete()
        .eq("chapter_id", chapterId);

      if (delPgErr) {
        console.error(`Error borrando páginas del capítulo ${ch.number}:`, delPgErr.message);
        process.exit(1);
      }

      const emptyRes = await emptyChapterStorageFolder(
        supabase,
        bucket,
        comicId,
        chapterId
      );
      if (emptyRes.error) {
        console.error(
          `Error vaciando Storage del capítulo ${ch.number}:`,
          emptyRes.error.message
        );
        process.exit(1);
      }

      const { error: titleErr } = await supabase
        .from("chapters")
        .update({ title: chapterTitle })
        .eq("id", chapterId);

      if (titleErr) {
        console.error(`Error actualizando título del capítulo ${ch.number}:`, titleErr.message);
        process.exit(1);
      }
    } else {
      const { data: chapter, error: chErr } = await supabase
        .from("chapters")
        .insert({
          comic_id: comicId,
          chapter_number: ch.number,
          title: chapterTitle,
        })
        .select("id")
        .single();

      if (chErr || !chapter) {
        console.error(`Error creando capítulo ${ch.number}:`, chErr?.message);
        process.exit(1);
      }

      chapterId = chapter.id;
      console.log(`  Capítulo ${ch.number} (nuevo) → ${chapterId} (${images.length} páginas)`);
    }

    let pageNumber = 0;
    for (const filePath of images) {
      pageNumber += 1;
      const ext = path.extname(filePath).toLowerCase();
      const storagePath = `comics/${comicId}/${chapterId}/${String(pageNumber).padStart(3, "0")}${ext}`;

      const up = await uploadDiskImageToPath(supabase, bucket, storagePath, filePath);
      if (up.error) {
        console.error(`Error subiendo ${storagePath}:`, up.error.message);
        process.exit(1);
      }
      const publicUrl = up.publicUrl;

      if (firstPublicUrl === null) firstPublicUrl = publicUrl;

      const { error: pgErr } = await supabase.from("chapter_pages").insert({
        chapter_id: chapterId,
        page_number: pageNumber,
        image_url: publicUrl,
      });

      if (pgErr) {
        console.error(`Error insertando página ${pageNumber}:`, pgErr.message);
        process.exit(1);
      }
    }

    if (replaced) {
      console.log(`    ✓ Capítulo ${ch.number} sincronizado en Storage y BD.`);
    }
  }

  const comicImageUpdates = {};
  if (explicitCoverUrl) {
    comicImageUpdates.cover_url = explicitCoverUrl;
  } else if (!isUpdate && firstPublicUrl) {
    comicImageUpdates.cover_url = firstPublicUrl;
  }
  if (explicitBannerUrl) {
    comicImageUpdates.banner_url = explicitBannerUrl;
  }
  if (Object.keys(comicImageUpdates).length > 0) {
    const { error: imgErr } = await supabase
      .from("comics")
      .update(comicImageUpdates)
      .eq("id", comicId);
    if (imgErr) {
      console.error("Error actualizando portada/banner:", imgErr.message);
      process.exit(1);
    }
  }

  console.log("\nListo.");
  console.log(`En local: http://localhost:3000/comic/${comicId}`);
  console.log(`Bucket "${bucket}" → comics/${comicId}/<id-capítulo>/###.webp`);
  if (isUpdate && chapterDirs.length === 0) {
    console.log("(Solo metadatos y/o portada; ninguna carpeta de capítulo procesada.)");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
