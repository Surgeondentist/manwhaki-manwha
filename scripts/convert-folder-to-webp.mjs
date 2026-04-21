/**
 * Convierte recursivamente JPG, JPEG, PNG y GIF a WebP con sharp.
 *
 * Uso (desde la raíz del repo):
 *   npm run convert:webp -- --dir "C:\ruta\MiManhwa"
 *
 * Opcional:
 *   --out "C:\ruta\Salida"     carpeta destino (por defecto: <dir>-webp al lado de --dir)
 *   --quality 82               calidad WebP 1-100 (por defecto 82)
 *   --skip-existing            no sobrescribe .webp ya presentes en destino
 *
 * Conserva la estructura de subcarpetas (p. ej. 01/001.png → salida/01/001.webp).
 * No borra los originales.
 */

import fs from "fs";
import path from "path";
import sharp from "sharp";

const INPUT_EXT = /\.(jpe?g|png|gif)$/i;

function parseArgs() {
  const argv = process.argv.slice(2);
  let dir = null;
  let out = null;
  let quality = 82;
  let skipExisting = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dir" && argv[i + 1]) dir = path.resolve(argv[++i]);
    else if (a === "--out" && argv[i + 1]) out = path.resolve(argv[++i]);
    else if (a === "--quality" && argv[i + 1]) quality = Number(argv[++i]);
    else if (a === "--skip-existing") skipExisting = true;
  }

  if (!Number.isFinite(quality) || quality < 1 || quality > 100) {
    quality = 82;
  }

  return { dir, out, quality, skipExisting };
}

/** @param {string} dir @param {string[]} acc */
function collectRasterFiles(dir, acc) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }

  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      collectRasterFiles(full, acc);
    } else if (e.isFile() && INPUT_EXT.test(e.name)) {
      acc.push(full);
    }
  }
  return acc;
}

async function main() {
  const { dir, out: outArg, quality, skipExisting } = parseArgs();

  if (!dir || !fs.existsSync(dir)) {
    console.error(
      'Indica una carpeta existente, por ejemplo:\n  npm run convert:webp -- --dir "C:\\MisProyectos\\MiManhwa"'
    );
    process.exit(1);
  }

  const stat = fs.statSync(dir);
  if (!stat.isDirectory()) {
    console.error("--dir debe ser una carpeta, no un archivo.");
    process.exit(1);
  }

  const inputRoot = dir;
  const outputRoot = outArg ?? `${inputRoot}-webp`;

  const files = collectRasterFiles(inputRoot, []);
  if (files.length === 0) {
    console.log(
      "No se encontraron .jpg, .jpeg, .png ni .gif bajo esa carpeta (búsqueda recursiva)."
    );
    process.exit(0);
  }

  fs.mkdirSync(outputRoot, { recursive: true });

  const metaSrc = path.join(inputRoot, "comic.json");
  const metaDest = path.join(outputRoot, "comic.json");
  if (fs.existsSync(metaSrc)) {
    fs.copyFileSync(metaSrc, metaDest);
    console.log("Copiado comic.json → carpeta de salida.\n");
  }

  let ok = 0;
  let skipped = 0;
  let failed = 0;

  for (const src of files) {
    const rel = path.relative(inputRoot, src);
    const dest = path.join(
      outputRoot,
      rel.replace(INPUT_EXT, ".webp")
    );

    fs.mkdirSync(path.dirname(dest), { recursive: true });

    if (skipExisting && fs.existsSync(dest)) {
      skipped += 1;
      continue;
    }

    try {
      await sharp(src)
        .rotate()
        .webp({ quality, effort: 6 })
        .toFile(dest);
      ok += 1;
      console.log(rel, "→", path.relative(outputRoot, dest));
    } catch (err) {
      failed += 1;
      console.error("Error:", rel, err.message ?? err);
    }
  }

  console.log(
    `\nHecho. Convertidos: ${ok}, omitidos: ${skipped}, errores: ${failed}\nSalida: ${outputRoot}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
