import { useMemo, useState } from "react";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Activity,
  CircleHelp,
  Fuel,
  MapPin,
  Clock3,
} from "lucide-react";
import { buildVariationRows } from "../utils/priceHistory";

const DAY_OPTIONS = [3, 7, 14];

const trendMeta = {
  up: {
    label: "Hausse",
    className: "bg-rose-50 text-rose-700 border border-rose-200",
    Icon: TrendingUp,
  },
  down: {
    label: "Baisse",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Icon: TrendingDown,
  },
  flat: {
    label: "Stable",
    className: "bg-slate-100 text-slate-700 border border-slate-200",
    Icon: Activity,
  },
  unknown: {
    label: "Pas assez de donnees",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
    Icon: CircleHelp,
  },
};

const formatDelta = (value) => {
  if (!Number.isFinite(value)) return "-";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(3)} EUR/L`;
};

export default function PriceVariationsPage({
  stations,
  selectedFuel,
  selectedRadius,
  onBack,
}) {
  const [selectedDays, setSelectedDays] = useState(7);

  const rows = useMemo(
    () =>
      buildVariationRows({
        stations,
        fuel: selectedFuel,
        days: selectedDays,
      }),
    [stations, selectedFuel, selectedDays],
  );

  const rankedRows = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const aDelta = Number.isFinite(a.delta) ? Math.abs(a.delta) : -1;
        const bDelta = Number.isFinite(b.delta) ? Math.abs(b.delta) : -1;
        return bDelta - aDelta;
      }),
    [rows],
  );

  return (
    <section className="absolute inset-0 z-[1350] overflow-y-auto bg-slate-50 px-4 pb-8 pt-6">
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            <ArrowLeft size={16} /> Retour a la carte
          </button>

          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Rayon actif: {selectedRadius} km
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="font-heading text-xl text-ink">Variations de prix</p>
          <p className="mt-1 text-sm text-slate-600">
            Analyse des stations les plus proches pour le carburant{" "}
            {selectedFuel.toUpperCase()}.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Les variations sont calculees depuis l historique enregistre
            localement sur cet appareil.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {DAY_OPTIONS.map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setSelectedDays(days)}
                className={`min-h-10 rounded-lg px-3 text-xs font-semibold ${
                  selectedDays === days
                    ? "bg-ink text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {days} jours
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {rankedRows.length === 0 && (
            <div className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">
              Aucune station disponible pour le moment.
            </div>
          )}

          {rankedRows.map((row) => {
            const meta = trendMeta[row.trend] || trendMeta.unknown;
            const TrendIcon = meta.Icon;

            return (
              <article
                key={row.station.id}
                className="rounded-2xl bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-bold text-ink">
                      {row.station.name}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin size={12} /> {row.station.distanceKm.toFixed(1)}{" "}
                      km
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}
                  >
                    <TrendIcon size={12} /> {meta.label}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-xs text-slate-500">Prix actuel</p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {row.station.price.toFixed(3)} EUR/L
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-xs text-slate-500">Variation</p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {formatDelta(row.delta)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-xs text-slate-500">Premiere mesure</p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {Number.isFinite(row.earliestPrice)
                        ? `${row.earliestPrice.toFixed(3)} EUR/L`
                        : "-"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-xs text-slate-500">Echantillons</p>
                    <p className="mt-1 flex items-center gap-1 font-semibold text-slate-800">
                      <Clock3 size={13} /> {row.points}
                    </p>
                  </div>
                </div>

                <p className="mt-3 flex items-center gap-1 text-xs text-slate-500">
                  <Fuel size={12} />
                  {row.station.address || "Adresse non disponible"}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
