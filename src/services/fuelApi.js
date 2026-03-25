import { haversineDistance } from "../utils/geo";

const API_URL =
  "/api/prix-carburants/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records";

const PRICE_KEYS = {
  gazole: ["gazole_prix", "prix_gazole", "gazole"],
  sp95: ["sp95_prix", "prix_sp95", "sp95"],
  e10: ["e10_prix", "prix_e10", "e10"],
  e85: ["e85_prix", "prix_e85", "e85"],
  sp98: ["sp98_prix", "prix_sp98", "sp98"],
  gplc: ["gplc_prix", "prix_gplc", "gplc", "gplc_prix_maj"],
};

const UPDATE_KEYS = {
  gazole: ["gazole_maj", "maj"],
  sp95: ["sp95_maj", "maj"],
  e10: ["e10_maj", "maj"],
  e85: ["e85_maj", "maj"],
  sp98: ["sp98_maj", "maj"],
  gplc: ["gplc_maj", "maj"],
};

const pickValue = (fields, keys) => {
  for (const key of keys) {
    const candidate = fields[key];
    if (candidate !== undefined && candidate !== null && candidate !== "") {
      if (typeof candidate === "object") {
        if (candidate.valeur) return candidate.valeur;
        if (candidate.value) return candidate.value;
      }
      return candidate;
    }
  }
  return null;
};

const toNumber = (value) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const normalized = value.replace(",", ".").trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const parseMaybeJson = (value) => {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const flattenServices = (value) => {
  if (!value) return [];

  const parsed = parseMaybeJson(value);

  if (Array.isArray(parsed)) {
    return parsed.flatMap(flattenServices);
  }

  if (typeof parsed === "string") {
    return parsed
      .split(/;|,|\||\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof parsed === "object") {
    if (Array.isArray(parsed.service)) {
      return parsed.service.flatMap(flattenServices);
    }

    if (parsed.service) {
      return flattenServices(parsed.service);
    }

    return Object.values(parsed).flatMap(flattenServices);
  }

  return [];
};

const extractServices = (fields) => {
  const rawServices = [fields.services_service, fields.services];
  const merged = rawServices.flatMap(flattenServices);

  return [...new Set(merged.map((service) => service.trim()).filter(Boolean))];
};

const extractPaymentMethods = (fields, services) => {
  const serviceText = normalizeText(services.join(" "));
  const automateText = normalizeText(fields.horaires_automate_24_24 || "");

  const card =
    /\bcb\b|carte|visa|mastercard|paiement/.test(serviceText) ||
    automateText === "oui";
  const cash = /espec|liquide/.test(serviceText) ? true : null;

  return {
    card,
    cash,
  };
};

const normalizeStation = (record, selectedFuel, userPosition) => {
  const fields = record ?? {};

  const geoPoint = fields.geo_point_2d || fields.geom || fields.coordonnees;
  let latitude = null;
  let longitude = null;

  if (Array.isArray(geoPoint) && geoPoint.length >= 2) {
    latitude = Number(geoPoint[0]);
    longitude = Number(geoPoint[1]);
  } else if (
    Number.isFinite(Number(geoPoint?.lat)) &&
    Number.isFinite(Number(geoPoint?.lon))
  ) {
    latitude = Number(geoPoint.lat);
    longitude = Number(geoPoint.lon);
  } else if (geoPoint?.coordinates?.length >= 2) {
    longitude = Number(geoPoint.coordinates[0]);
    latitude = Number(geoPoint.coordinates[1]);
  } else {
    latitude = Number(fields.latitude);
    longitude = Number(fields.longitude);
  }

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const rawPrice = pickValue(fields, PRICE_KEYS[selectedFuel] ?? []);
  const price = toNumber(rawPrice);

  if (!Number.isFinite(price)) {
    return null;
  }

  const updatedAt = pickValue(fields, UPDATE_KEYS[selectedFuel] ?? ["maj"]);
  const zip = fields.cp || fields.code_postal || "";
  const city = fields.ville || fields.commune || "";
  const address = [fields.adresse, zip, city].filter(Boolean).join(" ");
  const services = extractServices(fields);
  const paymentMethods = extractPaymentMethods(fields, services);

  const apiName = pickValue(fields, [
    "enseigne",
    "enseigne_nom",
    "nom_station",
    "station",
    "marque",
    "nom",
  ]);

  const apiNameNormalized = normalizeText(apiName);
  const addressNormalized = normalizeText(fields.adresse || "");
  const isDuplicateAddressName =
    apiNameNormalized &&
    addressNormalized &&
    apiNameNormalized === addressNormalized;

  const fallbackName = ["Station", city || zip].filter(Boolean).join(" ");
  const displayName =
    apiName && !isDuplicateAddressName
      ? String(apiName)
      : fallbackName || "Station inconnue";

  return {
    id: record.recordid || fields.id || `${latitude}-${longitude}`,
    name: displayName,
    address,
    lat: latitude,
    lng: longitude,
    price,
    fuel: selectedFuel,
    updatedAt: updatedAt || null,
    services,
    paymentMethods,
    distanceKm: haversineDistance(userPosition, [latitude, longitude]),
  };
};

export const fetchStationsByRadius = async ({
  userPosition,
  fuel,
  radiusKm,
}) => {
  const [lat, lng] = userPosition;
  const radiusMeters = radiusKm * 1000;
  const pageSize = 100;
  const maxRows = 500;
  const pages = Math.ceil(maxRows / pageSize);

  const whereClause = `within_distance(geom, geom'POINT(${lng} ${lat})', ${radiusMeters}m)`;
  const allRecords = [];

  for (let page = 0; page < pages; page += 1) {
    const offset = page * pageSize;
    const params = new URLSearchParams({
      limit: String(pageSize),
      offset: String(offset),
      where: whereClause,
    });

    const response = await fetch(`${API_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Erreur API carburants (${response.status}).`);
    }

    const payload = await response.json();
    if (payload.error_code) {
      throw new Error(payload.message || "Erreur sur le service carburants.");
    }

    const chunk = payload.results ?? [];
    allRecords.push(...chunk);

    if (chunk.length < pageSize) {
      break;
    }
  }

  return allRecords
    .map((record) => normalizeStation(record, fuel, userPosition))
    .filter(Boolean)
    .sort((a, b) => a.price - b.price);
};
