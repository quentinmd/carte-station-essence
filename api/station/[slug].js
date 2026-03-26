import {
  extractStationSummary,
  findStationBySlug,
  SITE_URL,
} from "../_lib/stations.js";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatPrice = (value) =>
  typeof value === "number" ? `${value.toFixed(3)} EUR / L` : "Non renseigne";

export default async function handler(req, res) {
  const slug = req.query.slug;

  if (!slug || Array.isArray(slug)) {
    res.status(400).send("Invalid station slug");
    return;
  }

  const record = await findStationBySlug(slug);

  if (!record) {
    res.status(404).send("Station not found");
    return;
  }

  const station = extractStationSummary(record);
  const title = `${station.name} - prix carburants a ${station.city}`;
  const description = `Consultez les prix carburants de ${station.name} (${station.address}) : Gazole ${formatPrice(station.gazole)}, E10 ${formatPrice(station.e10)}, SP98 ${formatPrice(station.sp98)}.`;
  const canonical = `${SITE_URL}/station/${station.slug}`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "GasStation",
    name: station.name,
    address: station.address,
    url: canonical,
    geo:
      Number.isFinite(station.lat) && Number.isFinite(station.lng)
        ? {
            "@type": "GeoCoordinates",
            latitude: station.lat,
            longitude: station.lng,
          }
        : undefined,
  };

  const html = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta name="robots" content="index,follow" />
    <style>
      body { font-family: Arial, sans-serif; margin: 0; background: #f7fafc; color: #0f172a; }
      main { max-width: 760px; margin: 0 auto; padding: 24px 16px 48px; }
      .card { background: #fff; border-radius: 14px; padding: 16px; box-shadow: 0 8px 20px rgba(15,23,42,.08); }
      h1 { margin: 0 0 8px; font-size: 1.4rem; }
      p { margin: 0 0 8px; }
      ul { padding-left: 20px; }
      .back { display: inline-block; margin-top: 16px; color: #0c8ea8; text-decoration: none; font-weight: 700; }
    </style>
    <script type="application/ld+json">${JSON.stringify(schema)}</script>
  </head>
  <body>
    <main>
      <article class="card">
        <h1>${escapeHtml(station.name)}</h1>
        <p>${escapeHtml(station.address)}</p>
        <p>Derniere mise a jour: ${escapeHtml(station.updatedAt || "Non renseignee")}</p>
        <h2>Prix disponibles</h2>
        <ul>
          <li>Gazole: ${escapeHtml(formatPrice(station.gazole))}</li>
          <li>SP95: ${escapeHtml(formatPrice(station.sp95))}</li>
          <li>E10: ${escapeHtml(formatPrice(station.e10))}</li>
          <li>SP98: ${escapeHtml(formatPrice(station.sp98))}</li>
          <li>E85: ${escapeHtml(formatPrice(station.e85))}</li>
          <li>GPLc: ${escapeHtml(formatPrice(station.gplc))}</li>
        </ul>
        <a class="back" href="/">Retour a la carte essence</a>
      </article>
    </main>
  </body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=86400");
  res.status(200).send(html);
}
