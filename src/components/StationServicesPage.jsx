import {
  ArrowLeft,
  CreditCard,
  Banknote,
  Fuel,
  Wrench,
  Car,
  ShoppingCart,
  Coffee,
  Droplets,
  Landmark,
  ShieldCheck,
  Clock3,
  Navigation,
} from "lucide-react";

const formatPaymentState = (value) => {
  if (value === true) return "Oui";
  if (value === false) return "Non";
  return "Inconnu";
};

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const serviceIconFor = (service) => {
  const normalized = normalizeText(service);

  if (/lavage|portique|aspirateur/.test(normalized)) return Car;
  if (/boutique|alimentaire|epicerie|shopping/.test(normalized)) {
    return ShoppingCart;
  }
  if (/restauration|cafe|boisson/.test(normalized)) return Coffee;
  if (/gonflage|eau/.test(normalized)) return Droplets;
  if (/dab|distributeur|billet/.test(normalized)) return Landmark;
  if (/additive|additive|premium/.test(normalized)) return ShieldCheck;
  if (/24\/24|automate|cb/.test(normalized)) return Clock3;

  return Wrench;
};

export default function StationServicesPage({ station, onBack }) {
  const services = station?.services ?? [];
  const paymentMethods = station?.paymentMethods ?? { card: null, cash: null };
  const navigationUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${station?.lat},${station?.lng}`,
  )}`;

  return (
    <section className="absolute inset-0 z-[1300] overflow-y-auto bg-slate-50 px-4 pb-8 pt-6">
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            <ArrowLeft size={16} /> Retour a la carte
          </button>
          <a
            href={navigationUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white"
          >
            <Navigation size={16} /> Y aller
          </a>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-lg font-bold text-ink">{station.name}</p>
          <p className="mt-1 text-sm text-slate-600">{station.address}</p>
          <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Fuel size={16} /> {station.price.toFixed(3)} EUR / L
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="mb-3 text-base font-bold text-ink">
            Moyens de paiement
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <CreditCard size={16} /> Carte bancaire
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {formatPaymentState(paymentMethods.card)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Banknote size={16} /> Especes
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {formatPaymentState(paymentMethods.cash)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="mb-3 text-base font-bold text-ink">
            Services disponibles
          </p>
          {services.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {services.map((service) => {
                const ServiceIcon = serviceIconFor(service);

                return (
                  <span
                    key={service}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                  >
                    <ServiceIcon size={12} /> {service}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Aucun service renseigne pour cette station.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
