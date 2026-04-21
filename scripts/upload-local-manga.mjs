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
 * Estructura esperada de la carpeta (--dir):
 *   comic.json          metadatos del cómic
 *   01/   (o 1/)        imágenes del capítulo 1  → 001.webp, 002.webp, … o 1.jpg, 2.jpg
 *   02/                 capítulo 2
 *
 * comic.json ejemplo:
 *   { "title": "Mi obra", "author_name": "Tu nombre", "description": "Opcional", "status": "ongoing" }
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
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dir" && argv[i + 1]) {
      dir = path.resolve(argv[++i]);
    }
  }
  return { dir };
}

function naturalCompare(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

const IMAGE_EXT = new Set([".webp", ".jpg", ".jpeg", ".png", ".gif"]);

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

async function main() {
  loadEnvLocal();

  const { dir } = parseArgs();
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

  const chapterDirs = listChapterDirs(dir);
  if (chapterDirs.length === 0) {
    console.error(
      "No se encontraron carpetas de capítulo. Usa nombres solo numéricos: 01, 02, 1, 2…"
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

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

  const comicId = comic.id;
  console.log("Cómic creado:", comicId);

  let firstPublicUrl = null;

  for (const ch of chapterDirs) {
    const images = listImagesInDir(ch.fullPath);
    if (images.length === 0) {
      console.warn(`Capítulo ${ch.number} (${ch.name}): sin imágenes, se omite.`);
      continue;
    }

    const { data: chapter, error: chErr } = await supabase
      .from("chapters")
      .insert({
        comic_id: comicId,
        chapter_number: ch.number,
        title: meta.chapterTitles?.[String(ch.number)] ?? `Capítulo ${ch.number}`,
      })
      .select("id")
      .single();

    if (chErr || !chapter) {
      console.error(`Error creando capítulo ${ch.number}:`, chErr?.message);
      process.exit(1);
    }

    const chapterId = chapter.id;
    console.log(`  Capítulo ${ch.number} → ${chapterId} (${images.length} páginas)`);

    let pageNumber = 0;
    for (const filePath of images) {
      pageNumber += 1;
      const ext = path.extname(filePath).toLowerCase();
      const storagePath = `comics/${comicId}/${chapterId}/${String(pageNumber).padStart(3, "0")}${ext}`;
      const body = fs.readFileSync(filePath);

      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(storagePath, body, {
          contentType: mimeForExt(ext),
          upsert: true,
        });

      if (upErr) {
        console.error(`Error subiendo ${storagePath}:`, upErr.message);
        process.exit(1);
      }

      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(storagePath);
      const publicUrl = pub.publicUrl;

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
  }

  if (firstPublicUrl) {
    await supabase.from("comics").update({ cover_url: firstPublicUrl }).eq("id", comicId);
  }

  console.log("\nListo.");
  console.log(`En local: http://localhost:3000/comic/${comicId}`);
  console.log(`Bucket "${bucket}" → comics/${comicId}/<id-capítulo>/###.webp`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
