const STORAGE_KEY = "fuel-price-history-v1";
const MAX_POINTS_PER_STATION = 90;

const safeParse = (value) => {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const readHistory = () => {
  if (typeof window === "undefined") return {};
  return safeParse(window.localStorage.getItem(STORAGE_KEY) || "{}");
};

const writeHistory = (history) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
};

const stationHistoryKey = (fuel, stationId) => `${fuel}::${stationId}`;

export const recordStationsPriceSnapshot = ({
  stations,
  fuel,
  timestamp = Date.now(),
}) => {
  if (!Array.isArray(stations) || stations.length === 0 || !fuel) return;

  const history = readHistory();

  for (const station of stations) {
    if (!station?.id || !Number.isFinite(station?.price)) continue;

    const key = stationHistoryKey(fuel, station.id);
    const snapshots = Array.isArray(history[key]) ? history[key] : [];
    const last = snapshots[snapshots.length - 1];

    // Skip exact duplicates to avoid writing noise every minute.
    if (last && last.price === station.price) continue;

    snapshots.push({
      timestamp,
      price: station.price,
    });

    history[key] = snapshots.slice(-MAX_POINTS_PER_STATION);
  }

  writeHistory(history);
};

export const buildVariationRows = ({
  stations,
  fuel,
  days,
  nearestCount = 20,
}) => {
  if (!Array.isArray(stations) || stations.length === 0 || !fuel) return [];

  const history = readHistory();
  const windowStart = Date.now() - days * 24 * 60 * 60 * 1000;

  return [...stations]
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, nearestCount)
    .map((station) => {
      const key = stationHistoryKey(fuel, station.id);
      const snapshots = (Array.isArray(history[key]) ? history[key] : [])
        .filter(
          (point) =>
            Number.isFinite(point?.timestamp) && point.timestamp >= windowStart,
        )
        .sort((a, b) => a.timestamp - b.timestamp);

      if (snapshots.length < 2) {
        return {
          station,
          earliestPrice: null,
          latestPrice: null,
          delta: null,
          trend: "unknown",
          points: snapshots.length,
        };
      }

      const earliestPrice = snapshots[0].price;
      const latestPrice = snapshots[snapshots.length - 1].price;
      const delta = latestPrice - earliestPrice;

      return {
        station,
        earliestPrice,
        latestPrice,
        delta,
        trend: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
        points: snapshots.length,
      };
    });
};
