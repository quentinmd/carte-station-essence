const DATASET_BASE_URL =
  "https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records";

export const SITE_URL = "https://essence.quentvisuals.dev";

const normalizeText = (value) => String(value || "").trim();

const slugify = (value) =>
  normalizeText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const stationSlug = (record) => {
  const name =
    record.enseigne ||
    record.nom_station ||
    record.nom ||
    record.adresse ||
    "station";
  const city = record.ville || record.commune || record.cp || "france";
  const id = String(record.id || "").trim();

  const base = `${slugify(name)}-${slugify(city)}`.replace(/(^-|-$)/g, "");
  return id ? `${base}-${id}` : base;
};

export const stationSeoUrl = (record) =>
  `${SITE_URL}/station/${stationSlug(record)}`;

export const extractStationSummary = (record) => {
  const city = record.ville || record.commune || "";
  const address = [record.adresse, record.cp, city].filter(Boolean).join(" ");

  return {
    id: record.id,
    slug: stationSlug(record),
    seoUrl: stationSeoUrl(record),
    name:
      record.enseigne ||
      record.nom_station ||
      record.nom ||
      `Station ${city || record.cp || ""}`.trim(),
    city,
    address,
    lat: Number(record.geom?.lat),
    lng: Number(record.geom?.lon),
    gazole: record.gazole_prix,
    e10: record.e10_prix,
    sp98: record.sp98_prix,
    sp95: record.sp95_prix,
    e85: record.e85_prix,
    gplc: record.gplc_prix,
    updatedAt:
      record.gazole_maj ||
      record.e10_maj ||
      record.sp98_maj ||
      record.sp95_maj ||
      record.e85_maj ||
      record.gplc_maj ||
      null,
  };
};

export const fetchStationsPage = async ({ limit = 100, offset = 0 }) => {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  const response = await fetch(`${DATASET_BASE_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Upstream API error ${response.status}`);
  }

  const payload = await response.json();
  if (payload.error_code) {
    throw new Error(payload.message || "Upstream API returned an error");
  }

  return payload.results || [];
};

export const findStationBySlug = async (slug) => {
  const pageSize = 100;
  const maxPages = 20;

  for (let page = 0; page < maxPages; page += 1) {
    const offset = page * pageSize;
    const records = await fetchStationsPage({ limit: pageSize, offset });

    for (const record of records) {
      if (stationSlug(record) === slug) {
        return record;
      }
    }

    if (records.length < pageSize) {
      break;
    }
  }

  return null;
};
