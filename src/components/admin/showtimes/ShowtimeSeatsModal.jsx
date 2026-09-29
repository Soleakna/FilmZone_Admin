import { X, Loader2, AlertTriangle, RefreshCw, Grid3x3 } from "lucide-react";

const AVAILABILITY_META = {
  AVAILABLE: { label: "Available", chip: "bg-emerald-100 text-emerald-700 border-emerald-300", dot: "bg-emerald-500" },
  HELD: { label: "Held", chip: "bg-amber-100 text-amber-700 border-amber-300", dot: "bg-amber-500" },
  BOOKED: { label: "Booked", chip: "bg-red-100 text-red-700 border-red-300", dot: "bg-red-600" },
  UNAVAILABLE: { label: "Unavailable", chip: "bg-neutral-100 text-neutral-500 border-neutral-300", dot: "bg-neutral-500" },
};

const getMeta = (availability) =>
  AVAILABILITY_META[availability] ??
  AVAILABILITY_META.UNAVAILABLE;

export default function ShowtimeSeatsModal({
  open,
  showtimeTitle,
  seats,
  isLoading,
  isError,
  error,
  onRetry,
  onClose,
}) {
  if (!open) return null;

  const counts = {
    AVAILABLE: 0,
    HELD: 0,
    BOOKED: 0,
    UNAVAILABLE: 0,
  };
  seats.forEach((s) => {
    counts[s?.availability] = (counts[s?.availability] || 0) + 1;
  });

  const rows = new Map();
  seats.forEach((s) => {
    const key = s?.rowLabel || "?";
    const list = rows.get(key) || [];
    list.push(s);
    rows.set(key, list);
  });
  const orderedRows = Array.from(rows.entries()).sort((a, b) =>
    a[0].localeCompare(b[0], undefined, { numeric: true }),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-sans">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="showtime-seats-title"
        className="relative z-10 w-full max-w-2xl mx-4 rounded-2xl bg-white border border-neutral-200 shadow-2xl p-6 max-h-[85vh] overflow-y-auto space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3
            id="showtime-seats-title"
            className="flex items-center gap-2 text-base font-black text-neutral-900"
          >
            <span className="w-7 h-7 rounded-lg bg-[#b90101]/10 text-[#b90101] flex items-center justify-center">
              <Grid3x3 className="w-4 h-4" />
            </span>
            Showtime Seats
          </h3>
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-800 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {showtimeTitle && (
          <p className="text-xs font-semibold text-neutral-500">
            Seat availability for{" "}
            <span className="font-bold text-neutral-900">{showtimeTitle}</span>.
            Gaps mean the hall has no seat in that column.
          </p>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center gap-3 py-12 text-neutral-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-bold">Fetching seats…</span>
          </div>
        ) : isError ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="mt-3 text-sm font-bold text-red-700">
              Failed to load the seat availability.
            </p>
            <p className="text-xs font-semibold text-neutral-500 mt-1 break-all">
              {error?.data?.message ||
                error?.data?.error ||
                error?.error ||
                `Server returned HTTP ${error?.status}` ||
                "Unknown error"}
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#b90101] text-white rounded-xl text-xs font-black hover:brightness-110 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
          </div>
        ) : seats.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
            <p className="mt-3 text-sm font-bold text-neutral-600">
              No seats have been generated for this showtime yet.
            </p>
            <p className="text-xs font-semibold text-neutral-400 mt-1">
              Add seats to the hall first — the availability appears here once
              the backend publishes them.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Legend + summary */}
            <div className="flex flex-wrap items-center gap-2">
              {Object.entries(AVAILABILITY_META).map(([key, meta]) => (
                <span
                  key={key}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${meta.chip}`}
                >
                  <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                  {meta.label} · {counts[key] ?? 0}
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-neutral-100 text-neutral-700">
                Total · {seats.length}
              </span>
            </div>

            {/* Bus box (top) */}
            <div className="flex justify-center gap-2">
              {Array.from({ length: 8 }, (_, i) => (
                <span
                  key={i}
                  className="w-6 h-6 rounded-t-lg bg-neutral-200 border-b border-neutral-400"
                />
              ))}
            </div>

            {/* Seat grid grouped by row label */}
            <div className="space-y-2.5">
              {orderedRows.map(([label, rowSeats]) => (
                <div key={label} className="flex items-center gap-2 min-w-0">
                  <span className="w-6 shrink-0 text-center text-[11px] font-black text-neutral-500">
                    {label}
                  </span>
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {rowSeats.map((s) => {
                      const meta = getMeta(s?.availability);
                      return (
                        <span
                          key={s?.seatUuid ?? `${s?.rowLabel}${s?.seatNumber}`}
                          title={`${s?.seatLabel} — ${meta.label}`}
                          className={`w-7 h-7 rounded-md flex items-center justify-center text-[9px] font-black ${meta.chip}`}
                        >
                          {s?.seatNumber}
                        </span>
                      );
                    })}
                  </div>
                  <span className="w-6 shrink-0 text-center text-[11px] font-black text-neutral-500">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Aisle spacer */}
            <div className="flex justify-center gap-2">
              {Array.from({ length: 8 }, (_, i) => (
                <span
                  key={`b-${i}`}
                  className="w-6 h-6 rounded-b-lg bg-neutral-200 border-t border-neutral-400"
                />
              ))}
            </div>

            <p className="text-[11px] font-semibold text-neutral-400">
              GREEN = available · AMBER = held · RED = booked · GRAY = unavailable.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}