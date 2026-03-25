import { useEffect, useMemo, useState } from "react";
import { TriangleAlert, LoaderCircle } from "lucide-react";
import FuelMap from "./components/FuelMap";
import BottomSheetFilters from "./components/BottomSheetFilters";
import { fetchStationsByRadius } from "./services/fuelApi";

const FALLBACK_POSITION = [48.8566, 2.3522];

function App() {
  const [userPosition, setUserPosition] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [mapBounds, setMapBounds] = useState(null);
  const [selectedFuel, setSelectedFuel] = useState("gazole");
  const [selectedRadius, setSelectedRadius] = useState(5);
  const [stations, setStations] = useState([]);
  const [showCheapest, setShowCheapest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!navigator.geolocation) {
      setErrorMessage(
        "La geolocalisation nest pas disponible sur votre appareil.",
      );
      setUserPosition(FALLBACK_POSITION);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setErrorMessage("");
        const nextPosition = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        setUserPosition(nextPosition);
        setMapCenter(nextPosition);
      },
      () => {
        setErrorMessage("Position refusee. Affichage centre sur Paris.");
        setUserPosition(FALLBACK_POSITION);
        setMapCenter(FALLBACK_POSITION);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 },
    );
  }, []);

  useEffect(() => {
    if (!mapCenter) return;

    let cancelled = false;

    const loadStations = async () => {
      setLoading(true);
      try {
        const data = await fetchStationsByRadius({
          userPosition: mapCenter,
          fuel: selectedFuel,
          radiusKm: selectedRadius,
        });

        if (!cancelled) {
          setStations(data);
          setErrorMessage((prev) =>
            prev.includes("Position refusee") ? prev : "",
          );
        }
      } catch (error) {
        if (!cancelled) {
          setStations([]);
          const reason =
            error instanceof Error
              ? error.message
              : "Reessayez dans quelques instants.";
          setErrorMessage(`Service indisponible. ${reason}`);
          console.error("Erreur chargement stations:", error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadStations();
    const intervalId = setInterval(loadStations, 60000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [mapCenter, selectedFuel, selectedRadius]);

  const handleViewportChange = (nextCenter) => {
    setMapCenter((prev) => {
      if (!prev) return nextCenter;

      const hasMeaningfulChange =
        Math.abs(prev[0] - nextCenter[0]) > 0.0001 ||
        Math.abs(prev[1] - nextCenter[1]) > 0.0001;

      return hasMeaningfulChange ? nextCenter : prev;
    });
  };

  const handleBoundsChange = (bounds) => {
    const nextBounds = {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    };

    setMapBounds((prev) => {
      if (!prev) return nextBounds;

      const hasMeaningfulChange =
        Math.abs(prev.north - nextBounds.north) > 0.0001 ||
        Math.abs(prev.south - nextBounds.south) > 0.0001 ||
        Math.abs(prev.east - nextBounds.east) > 0.0001 ||
        Math.abs(prev.west - nextBounds.west) > 0.0001;

      return hasMeaningfulChange ? nextBounds : prev;
    });
  };

  const visibleStations = useMemo(() => {
    if (!mapBounds) return stations;

    return stations.filter((station) => {
      const inLatRange =
        station.lat <= mapBounds.north && station.lat >= mapBounds.south;
      const inLngRange =
        station.lng <= mapBounds.east && station.lng >= mapBounds.west;

      return inLatRange && inLngRange;
    });
  }, [stations, mapBounds]);

  const topStationIds = useMemo(() => {
    if (!showCheapest) return new Set();
    return new Set(
      [...visibleStations]
        .sort((a, b) => a.price - b.price)
        .slice(0, 3)
        .map((station) => station.id),
    );
  }, [showCheapest, visibleStations]);

  return (
    <main className="relative h-svh w-full overflow-hidden bg-mist">
      {userPosition ? (
        <FuelMap
          userPosition={userPosition}
          mapCenter={mapCenter || userPosition}
          stations={stations}
          topStationIds={topStationIds}
          selectedFuel={selectedFuel}
          onViewportChange={handleViewportChange}
          onBoundsChange={handleBoundsChange}
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-gradient-to-b from-[#d8eff4] to-[#f8fafc]">
          <LoaderCircle className="h-8 w-8 animate-spin text-ink" />
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] bg-gradient-to-b from-[#051628]/75 via-[#051628]/30 to-transparent px-4 pb-10 pt-4 text-white">
        <div className="mx-auto flex max-w-2xl items-start justify-between">
          <div>
            <p className="font-heading text-xl tracking-tight">
              Carburants autour de vous
            </p>
            <p className="text-sm text-white/80">Prix en direct - France</p>
          </div>
          {loading && (
            <div className="rounded-full bg-white/20 p-2">
              <LoaderCircle className="h-4 w-4 animate-spin" />
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="mx-auto mt-3 flex max-w-2xl items-center gap-2 rounded-xl border border-amber-200/70 bg-amber-50/95 px-3 py-2 text-sm font-medium text-amber-800">
            <TriangleAlert size={16} />
            {errorMessage}
          </div>
        )}
      </div>

      <BottomSheetFilters
        selectedFuel={selectedFuel}
        onFuelChange={setSelectedFuel}
        selectedRadius={selectedRadius}
        onRadiusChange={setSelectedRadius}
        showCheapest={showCheapest}
        onShowCheapestChange={setShowCheapest}
        stationsCount={stations.length}
        loading={loading}
      />
    </main>
  );
}

export default App;
