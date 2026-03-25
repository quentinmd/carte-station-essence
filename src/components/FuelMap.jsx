import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  CircleMarker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";

const mapLinkForStation = (station) => {
  const query = encodeURIComponent(`${station.lat},${station.lng}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
};

const formatDate = (value) => {
  if (!value) return "Date indisponible";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsed);
};

const createPriceIcon = (station, isTopPick) =>
  L.divIcon({
    className: "station-icon-wrapper",
    html: `<div class="station-price-chip ${isTopPick ? "station-price-chip--best" : ""}">${station.price.toFixed(3)} EUR</div>`,
    iconSize: [98, 38],
    iconAnchor: [49, 38],
  });

function RecenterMap({ center }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, Math.max(map.getZoom(), 12), { animate: true });
  }, [center, map]);

  return null;
}

function MapViewportEvents({ onViewportChange, onBoundsChange }) {
  const map = useMapEvents({
    moveend: (event) => {
      const currentMap = event.target;
      const center = currentMap.getCenter();
      const bounds = currentMap.getBounds();
      onViewportChange([center.lat, center.lng]);
      onBoundsChange(bounds);
    },
    zoomend: (event) => {
      const bounds = event.target.getBounds();
      onBoundsChange(bounds);
    },
  });

  useEffect(() => {
    onBoundsChange(map.getBounds());
  }, [map, onBoundsChange]);

  return null;
}

export default function FuelMap({
  userPosition,
  mapCenter,
  stations,
  topStationIds,
  selectedFuel,
  onViewportChange,
  onBoundsChange,
  onOpenServices,
}) {
  const markerIcons = useMemo(() => {
    const icons = new Map();
    for (const station of stations) {
      icons.set(
        station.id,
        createPriceIcon(station, topStationIds.has(station.id)),
      );
    }
    return icons;
  }, [stations, topStationIds]);

  return (
    <MapContainer
      center={mapCenter}
      zoom={13}
      className="h-full w-full"
      zoomControl={false}
      preferCanvas
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      <RecenterMap center={mapCenter} />
      <MapViewportEvents
        onViewportChange={onViewportChange}
        onBoundsChange={onBoundsChange}
      />

      <CircleMarker
        center={userPosition}
        radius={9}
        pathOptions={{
          color: "#0b5ad7",
          fillColor: "#3486ff",
          fillOpacity: 0.95,
          weight: 2,
        }}
      >
        <Popup>Vous etes ici</Popup>
      </CircleMarker>

      {stations.map((station) => (
        <Marker
          key={`${station.id}-${selectedFuel}`}
          position={[station.lat, station.lng]}
          icon={markerIcons.get(station.id)}
          zIndexOffset={topStationIds.has(station.id) ? 1000 : 0}
        >
          <Popup className="station-popup">
            <div className="space-y-2 text-sm">
              <p className="text-base font-semibold text-ink">{station.name}</p>
              <p className="text-slate-600">
                {station.address || "Adresse non renseignee"}
              </p>
              <p className="font-medium text-slate-800">
                {station.price.toFixed(3)} EUR / L
              </p>
              <p className="text-slate-500">
                Maj: {formatDate(station.updatedAt)}
              </p>
              <a
                className="inline-flex w-full items-center justify-center rounded-xl bg-ink px-4 py-2 font-semibold text-white"
                href={mapLinkForStation(station)}
                target="_blank"
                rel="noreferrer"
              >
                Y aller
              </a>
              <button
                type="button"
                onClick={() => onOpenServices(station)}
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700"
              >
                Services disponibles
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
