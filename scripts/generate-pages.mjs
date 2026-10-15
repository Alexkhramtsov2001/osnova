import { readFile, writeFile, mkdir } from "node:fs/promises";
import { pageMetadata } from "../src/features/company/pageMetadata.ts";
import { projects } from "../src/features/projects/catalog.ts";
const origin = "https://alexkhramtsov2001.github.io/osnova";
const template = await readFile("dist/index.html", "utf8");
const escape = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
const entries = {
  ...pageMetadata,
  ...Object.fromEntries(
    projects.map((project) => [
      `/projects/${project.number}`,
      { title: `Дом «${project.name}» — ОСНОВА`, description: project.description },
    ]),
  ),
};
for (const [route, data] of Object.entries(entries)) {
  const url = origin + (route === "/" ? "/" : route + "/");
  let html = template.replace(/<title>[^<]*<\/title>/, `<title>${escape(data.title)}</title>`);
  for (const [attribute, key, value] of [
    ["name", "description", data.description],
    ["property", "og:title", data.title],
    ["property", "og:description", data.description],
    ["property", "og:url", url],
    ["name", "twitter:title", data.title],
    ["name", "twitter:description", data.description],
  ]) {
    html = html.replace(
      new RegExp(`<meta\\s+${attribute}="${key}"\\s+content="[^"]*"\\s*\\/?>`),
      `<meta ${attribute}="${key}" content="${escape(value)}" />`,
    );
  }
  html = html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${url}" />`,
  );
  const directory = route === "/" ? "dist" : `dist${route}`;
  await mkdir(directory, { recursive: true });
  await writeFile(`${directory}/index.html`, html);
}
await writeFile(
  "dist/404.html",
  template.replace(/<title>[^<]*<\/title>/, "<title>Страница не найдена — ОСНОВА</title>"),
);
const urls = Object.keys(entries).filter(
  (route) => !["/account", "/compare", "/find-home"].includes(route),
);
await writeFile(
  "dist/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((route) => `<url><loc>${origin}${route === "/" ? "/" : route + "/"}</loc></url>`).join("")}</urlset>`,
);
await writeFile("dist/robots.txt", `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
console.log(`Static HTML and metadata: ${Object.keys(entries).length} routes`);
