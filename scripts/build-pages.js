#!/usr/bin/env node
/* eslint-disable no-console */
"use strict";

/**
 * build-pages.js
 * Walks ./json recursively, reads each *.json file, and generates a matching
 * <dir parts + json filename w/o .json>/index.html using scripts/skeleton.html
 *
 * NEW 2025‑07‑25
 * ─────────────────
 * When generating links toward DS PDFs and their corrigés we now check that the
 * target file really exists inside the archive/. If the file is missing we:
 *   • Replace the link (<a>) with a simple <span> element.
 *   • Append the suffix “(fichier indisponnible)” to the visible label.
 *   • Keep the same structure / numbering so animations remain aligned.
 */

const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();
const jsonRoot = path.join(projectRoot, "json");
const skeletonPath = path.join(projectRoot, "scripts", "skeleton.html");

if (!fs.existsSync(jsonRoot)) {
  console.error(
    `❌  Directory ${jsonRoot} does not exist. Create a json/ folder.`
  );
  process.exit(1);
}

if (!fs.existsSync(skeletonPath)) {
  console.error(`❌  Skeleton template not found at ${skeletonPath}`);
  process.exit(1);
}

const skeleton = fs.readFileSync(skeletonPath, "utf8");

const pad = (n, l = 2) => String(n).padStart(l, "0");
const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

/**
 * Construit le titre à afficher.
 * - Si le JSON ne fournit pas de titre (ou vide), on renvoie "" pour laisser le HTML vide.
 * - Sinon, on préfixe automatiquement par "DS NN - ".
 * - On nettoie un éventuel "DS x - " déjà présent dans le JSON.
 */
function buildDisplayedTitle(entry) {
  const raw = (entry.titre || "").trim();
  const cleaned = raw.replace(/^DS\s*\d+\s*-\s*/i, "").trim();

  if (!cleaned) return ""; // titre vide dans le HTML si rien dans le JSON

  const id = Number(entry.id);
  const number = pad(id);
  return `DS ${number} - ${cleaned}`;
}

function findJsonFiles(dir) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch (e) {
      console.warn(`⚠️  Cannot read ${d}: ${e.message}`);
      continue;
    }
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.isFile() && path.extname(e.name).toLowerCase() === ".json") {
        out.push(full);
      }
    }
  }
  return out;
}

function buildBreadcrumb(parts) {
  return parts
    .map((segment, idx) => {
      const node =
        idx === parts.length - 1
          ? `<button type="button" class="breadcrumb-item breadcrumb-year">${segment}</button>`
          : `<span class="breadcrumb-item">${capitalize(segment)}</span>`;
      return idx === 0
        ? node
        : `<span class="breadcrumb-sep">/</span>\n        ${node}`;
    })
    .join("\n        ");
}

/**
 * Helper returning either a working <a> or an inactive <span> if the PDF is
 * missing.
 */
function buildFileLink({ exists, href, itemIndex, label, id }) {
  const indexStr = pad(itemIndex, 2);
  const prefix = `<span class="text-sm mr-3 mono opacity-50">${indexStr}</span>`;
  if (exists) {
    return `<a href="${href}" target="_blank" data-id="${id}">${prefix}<span>${label}</span></a>`;
  }
  return `<span class="file-missing" aria-disabled="true" data-id="${id}">${prefix}<span>${label} (fichier indisponnible)</span></span>`;
}

function buildFolderItem(entry, idx, relArchivePrefix, pathArray) {
  const id = Number(entry.id);
  const number = pad(id);
  const titre = buildDisplayedTitle(entry);
  const description = entry.description || "";
  const delay = idx * 40;

  // Absolute path to the folder containing the PDFs inside archive/
  const archiveAbsBase = path.join(projectRoot, "archive", ...pathArray);
  // Relative href (from HTML file) for the same folder
  const archiveHrefBase = `${relArchivePrefix}${pathArray.join("/")}/`;

  // Build the 2 file items (énoncé + corrigé) with availability check
  const files = [
    {
      filename: `ds${id}.pdf`,
      label: "Énoncé",
      order: 1,
    },
    {
      filename: `corrige${id}.pdf`,
      label: "Corrigé",
      order: 2,
    },
  ]
    .map((f) => {
      const abs = path.join(archiveAbsBase, f.filename);
      const exists = fs.existsSync(abs);
      const href = `${archiveHrefBase}${f.filename}`;
      return `              <div class="file-item">\n                ${buildFileLink(
        {
          exists,
          href,
          itemIndex: f.order,
          label: f.label,
          id,
        }
      )}\n              </div>`;
    })
    .join("\n");

  const esc = (s) => String(s).replace(/"/g, "&quot;");

  return `
        <!-- ===== FOLDER ${
          description ? "AVEC DESCRIPTION" : "SANS DESCRIPTION"
        } ===== -->
        <div
          class="folder-item fade-in"
          data-id="${id}"
          data-title="${esc(titre)}"
          data-description="${esc(description)}"
          style="opacity: 1; animation-delay: ${delay}ms"
        >
          <div class="folder-header flex justify-between items-center gap-2">
            <div class="flex-1 min-w-0">
              <div class="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-2 mb-1 md:mb-0">
                <div class="folder-number mono">DS.${number}</div>
                <div class="folder-title md:ml-4 truncate">${titre}</div>
              </div>

              <div class="meta-line mt-1 md:mt-2 flex flex-wrap gap-x-3 gap-y-1 items-center">
                <span class="folder-description text-xs text-gray-400 mono">${description}</span>
              </div>
            </div>

            <div class="flex items-center gap-2 md:gap-4 flex-shrink-0">
              <button class="fav-icon" data-id="${id}" aria-label="Ajouter aux favoris">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21 12 17.77 5.82 21 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              </button>
              <button class="toggle-icon" aria-label="Ouvrir / Fermer"></button>
            </div>
          </div>

          <div class="folder-content">
            <div class="px-3 py-2 md:px-4 md:py-3">
${files}
            </div>
          </div>
        </div>`;
}

function generateHtml(jsonFile) {
  // ex: json/1A/maths/2024-2025.json  →  pathParts = ['1A','maths','2024-2025']
  const relJsonPath = path.relative(jsonRoot, jsonFile);
  const dirParts = path.dirname(relJsonPath).split(path.sep).filter(Boolean);
  const filePart = path.basename(relJsonPath, ".json");
  const pathParts = [...dirParts, filePart];

  const depth = pathParts.length;

  let data;
  try {
    data = JSON.parse(fs.readFileSync(jsonFile, "utf8"));
  } catch (e) {
    console.error(`❌  Cannot parse ${jsonFile}: ${e.message}`);
    return;
  }

  const breadcrumb = buildBreadcrumb(pathParts);
  const relArchivePrefix = "../".repeat(depth) + "archive/";
  const folderBlocks = data
    .map((entry, idx) =>
      buildFolderItem(entry, idx, relArchivePrefix, pathParts)
    )
    .join("\n");

  // Adjust "../../../" assets in the skeleton to the correct depth
  const up = "../".repeat(depth);
  const html = skeleton
    .replace(/{{BREADCRUMB}}/g, breadcrumb)
    .replace(/{{CONTENT}}/g, folderBlocks)
    .replace(/\.\.\/\.\.\/\.\.\//g, up); // rewrite fixed triple-up paths

  const outDir = path.join(projectRoot, ...pathParts);
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "index.html");

  fs.writeFileSync(outFile, html, "utf8");
  console.log(`✅  Generated ${outFile}`);
}

// ---------------------------------------------------------------------------

console.log("🔍  Scanning json/ ...");
const jsonFiles = findJsonFiles(jsonRoot);

if (!jsonFiles.length) {
  console.warn(
    "⚠️  No JSON files found under json/. Make sure they end with .json"
  );
  process.exit(0);
}

console.log(`📄  Found ${jsonFiles.length} JSON file(s).`);
jsonFiles.forEach(generateHtml);
console.log("🏁  Done.");
