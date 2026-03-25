import { Fuel, LocateFixed, SlidersHorizontal, Trophy } from "lucide-react";
import { FUEL_OPTIONS, RADIUS_OPTIONS } from "../constants/fuels";

export default function BottomSheetFilters({
  selectedFuel,
  onFuelChange,
  selectedRadius,
  onRadiusChange,
  showCheapest,
  onShowCheapestChange,
  stationsCount,
  loading,
}) {
  const radiusIndex = RADIUS_OPTIONS.findIndex(
    (value) => value === selectedRadius,
  );

  return (
    <section className="pointer-events-auto absolute inset-x-0 bottom-0 z-[1100] mx-auto w-full max-w-2xl px-3 pb-4 sm:px-4">
      <div className="rounded-3xl border border-white/60 bg-white/95 p-4 shadow-float backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <SlidersHorizontal size={16} />
            Filtres
          </p>
          <p className="text-xs font-medium text-slate-500">
            {loading ? "Mise a jour..." : `${stationsCount} station(s)`}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Fuel size={14} /> Carburant
            </p>
            <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
              {FUEL_OPTIONS.map((fuel) => {
                const isActive = fuel.value === selectedFuel;
                return (
                  <button
                    key={fuel.value}
                    type="button"
                    onClick={() => onFuelChange(fuel.value)}
                    className={`min-h-11 min-w-[72px] rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "border-ink bg-ink text-white"
                        : "border-slate-200 bg-slate-100/70 text-slate-700"
                    }`}
                  >
                    {fuel.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span className="flex items-center gap-2">
                <LocateFixed size={14} /> Rayon
              </span>
              <span>{selectedRadius} km</span>
            </div>

            <input
              className="h-3 w-full accent-ink"
              type="range"
              min={0}
              max={RADIUS_OPTIONS.length - 1}
              step={1}
              value={Math.max(radiusIndex, 0)}
              onChange={(event) =>
                onRadiusChange(RADIUS_OPTIONS[Number(event.target.value)])
              }
            />

            <div className="mt-2 grid grid-cols-4 gap-2">
              {RADIUS_OPTIONS.map((radius) => (
                <button
                  key={radius}
                  type="button"
                  onClick={() => onRadiusChange(radius)}
                  className={`min-h-10 rounded-lg text-xs font-semibold ${
                    selectedRadius === radius
                      ? "bg-ink text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {radius} km
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onShowCheapestChange(!showCheapest)}
            className={`flex min-h-12 w-full items-center justify-between rounded-xl px-4 py-3 text-left transition ${
              showCheapest
                ? "bg-pine text-white"
                : "border border-slate-200 bg-white text-slate-700"
            }`}
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Trophy size={16} /> Afficher les moins chers
            </span>
            <span className="text-xs font-semibold">Top 3</span>
          </button>
        </div>
      </div>
    </section>
  );
}
