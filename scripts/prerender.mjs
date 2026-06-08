/**
 * Full prerender for shescore.org.
 *
 * Every manifest route gets its own dist/<route>.html: the built SPA shell with
 * unique <title>/description/canonical/OG and a real content snapshot injected
 * into #root — so crawlers and firewall categorizers never see an empty shell,
 * and there are no SPA-shell fallbacks. A real dist/404.html is written too.
 *
 * React mounts with createRoot().render() (not hydrate), so it clears #root and
 * renders the live app for real users — the snapshot is crawler-only.
 *
 * Task 1 injects a unique title/description/h1 body per route; Task 3 enriches
 * the per-page snapshot bodies. Country profiles (/scores/{iso}) are prerendered
 * in Task 5.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = resolve(ROOT, "dist");
const BASE = "https://www.shescore.org";
const PUBLISHER = "The SHE Score Foundation";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* Parse the page manifest (TS) without importing it. Entries are flat objects. */
function readPages() {
  const src = readFileSync(resolve(ROOT, "src/config/manifest.ts"), "utf8");
  const arr = src.slice(src.indexOf("export const PAGES"));
  const blocks = arr.match(/\{[^{}]*\}/g) || [];
  const pages = [];
  for (const b of blocks) {
    const path = (b.match(/path:\s*"([^"]+)"/) || [])[1];
    if (!path) continue;
    pages.push({
      path,
      title: (b.match(/title:\s*"([^"]*)"/) || [])[1] || "",
      description: (b.match(/description:\s*"([^"]*)"/) || [])[1] || "",
      navLabel: (b.match(/navLabel:\s*"([^"]*)"/) || [])[1] || "",
      noindex: /noindex:\s*true/.test(b),
    });
  }
  return pages;
}

/* Shared crawler-only footer mirroring src/components/Layout.tsx. */
function footerHtml() {
  return (
    `<footer style="margin-top:48px;border-top:1px solid #ddd;padding-top:16px;font-size:13px;color:#555">` +
    `<p><strong>SHE Score</strong> — the index. <strong>${esc(PUBLISHER)}</strong> — the publisher.</p>` +
    `<p>The SHE Score is an independent project and is not affiliated with, endorsed by, or derived from the UNDP/UN Women Women's Empowerment Index, the SHE Index powered by EY, or any other index referenced on this site.</p>` +
    `<p>The SHE Score methodology is published and open source. Annual scores publish on the documented cycle.</p>` +
    `<p>© ${new Date().getFullYear()} ${esc(PUBLISHER)}.</p>` +
    `</footer>`
  );
}

function snapshotFor(page, navLinks) {
  return (
    `<div id="root"><div style="max-width:860px;margin:0 auto;padding:24px 16px;font-family:Georgia,serif;line-height:1.55;color:#1e1b1a">` +
    `<nav style="font-family:system-ui,sans-serif;font-size:14px;margin-bottom:24px"><a href="/">SHE Score</a> · ${navLinks}</nav>` +
    `<h1 style="color:#3d0f28">${esc(page.navLabel || page.title)}</h1>` +
    `<p style="font-size:18px">${esc(page.description)}</p>` +
    footerHtml() +
    `</div></div>`
  );
}

function render(template, page, navLinks) {
  const url = `${BASE}${page.path === "/" ? "/" : page.path}`;
  return template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(page.title)}</title>`)
    .replace(/(<meta name="description" content=")[\s\S]*?(">)/, `$1${esc(page.description)}$2`)
    .replace(/(<link rel="canonical" href=")[\s\S]*?(")/, `$1${url}$2`)
    .replace(/(<meta property="og:url" content=")[\s\S]*?(")/, `$1${url}$2`)
    .replace(/(<meta property="og:title" content=")[\s\S]*?(">)/, `$1${esc(page.title)}$2`)
    .replace(/(<meta name="twitter:title" content=")[\s\S]*?(">)/, `$1${esc(page.title)}$2`)
    .replace(/(<meta property="og:description" content=")[\s\S]*?(">)/, `$1${esc(page.description)}$2`)
    .replace(/(<meta name="twitter:description" content=")[\s\S]*?(">)/, `$1${esc(page.description)}$2`)
    .replace(/<div id="root"><\/div>/, snapshotFor(page, navLinks));
}

function fileFor(path) {
  if (path === "/") return "index.html";
  return `${path.replace(/^\//, "")}.html`;
}

function main() {
  const tmplPath = resolve(DIST, "index.html");
  if (!existsSync(tmplPath)) { console.warn("[prerender] no dist/index.html — skipping"); return; }
  const template = readFileSync(tmplPath, "utf8");

  // Build the nav-links string from manifest nav:true entries.
  const manifestSrc = readFileSync(resolve(ROOT, "src/config/manifest.ts"), "utf8");
  const navLinks = (manifestSrc.match(/\{[^{}]*\}/g) || [])
    .filter((b) => /nav:\s*true/.test(b))
    .map((b) => {
      const path = (b.match(/path:\s*"([^"]+)"/) || [])[1];
      const label = (b.match(/navLabel:\s*"([^"]*)"/) || [])[1] || (b.match(/title:\s*"([^"]*)"/) || [])[1] || "";
      return path ? `<a href="${path}">${esc(label)}</a>` : "";
    })
    .filter(Boolean)
    .join(" · ");

  const pages = readPages();
  let n = 0;
  for (const page of pages) {
    try {
      writeFileSync(resolve(DIST, fileFor(page.path)), render(template, page, navLinks), "utf8");
      n++;
    } catch (e) {
      console.warn(`[prerender] ${page.path} failed (${e})`);
    }
  }

  // Real 404 page.
  try {
    const notFound = { path: "/404", title: "Page not found (404) | SHE Score", description: "This page could not be found on shescore.org.", navLabel: "404 — Page not found" };
    writeFileSync(resolve(DIST, "404.html"), render(template, notFound, navLinks), "utf8");
  } catch (e) {
    console.warn(`[prerender] 404 failed (${e})`);
  }

  console.log(`[prerender] wrote ${n} route snapshots + 404.html → dist/`);
}

main();
