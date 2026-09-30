import { useState, useEffect } from "react";
import { X, Loader2, AlertTriangle, RefreshCw, Clock } from "lucide-react";

// Backend ShowtimeStatus enum — the only values the API accepts.
const SHOWTIME_STATUSES = ["DRAFT", "OPEN", "CLOSED", "CANCELLED", "COMPLETED"];

const formatDateTime = (iso) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
  } catch {
    return "—";
  }
};

const statusBadgeClass = (status) =>
  status === "DRAFT"
    ? "bg-neutral-200 text-neutral-600"
    : status === "OPEN"
      ? "bg-emerald-100 text-emerald-600"
      : status === "CLOSED"
        ? "bg-amber-100 text-amber-700"
        : status === "CANCELLED"
          ? "bg-red-100 text-red-600"
          : "bg-sky-100 text-sky-600";

const statusDotClass = (status) =>
  status === "DRAFT"
    ? "bg-neutral-500"
    : status === "OPEN"
      ? "bg-emerald-500 animate-pulse"
      : status === "CLOSED"
        ? "bg-amber-500"
        : status === "CANCELLED"
          ? "bg-red-600"
          : "bg-sky-500";

export default function ShowtimeDetailsModal({
  open,
  showtime,
  isLoading,
  isError,
  error,
  isUpdatingStatus,
  onUpdateStatus,
  onRetry,
  onClose,
}) {
  // Draft status being edited for this showtime (only applies on Save).
  const [draftStatus, setDraftStatus] = useState("DRAFT");
  useEffect(() => {
    if (open) {
      const current = showtime?.status;
      setDraftStatus(
        current && SHOWTIME_STATUSES.includes(current) ? current : "DRAFT",
      );
    }
  }, [open, showtime?.uuid, showtime?.status]);

  if (!open) return null;

  const entry = (label, value, kind) => (
    <div className="rounded-xl bg-neutral-50 border border-neutral-200/70 px-3.5 py-2.5 shadow-xs">
      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#b90101]/40" />
        {label}
      </p>
      <p
        className={`mt-0.5 text-sm font-bold ${
          kind === "mono"
            ? "font-mono text-xs font-semibold text-neutral-600 break-all"
            : "text-neutral-900"
        }`}
      >
        {value !== undefined && value !== null && value !== "" ? value : "—"}
      </p>
    </div>
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
        aria-labelledby="showtime-details-title"
        className="relative z-10 w-full max-w-md mx-4 rounded-2xl bg-white border border-neutral-200 shadow-2xl p-6 max-h-[85vh] overflow-y-auto space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3
            id="showtime-details-title"
            className="flex items-center gap-2 text-base font-black text-neutral-900"
          >
            <span className="w-7 h-7 rounded-lg bg-[#b90101]/10 text-[#b90101] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </span>
            Showtime Details
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

        {isLoading ? (
          <div className="flex items-center justify-center gap-3 py-12 text-neutral-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-bold">Fetching showtime details…</span>
          </div>
        ) : isError ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="mt-3 text-sm font-bold text-red-700">
              Failed to load showtime details.
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
        ) : !showtime ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
            <p className="mt-3 text-sm font-bold text-neutral-700">
              This showtime has no data to display.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl bg-gradient-to-br from-[#b90101] to-[#860101] p-5 text-white relative overflow-hidden shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-widest text-white/70">
                Showtime
              </p>
              <p className="text-xl font-black leading-tight mt-0.5">
                {showtime.movieTitle || "Untitled"}
              </p>
              <p className="text-xs font-semibold text-white/80 mt-1.5">
                {showtime.hallName || "Hall"} · {formatDateTime(showtime.startTime)}
              </p>
              <Clock className="w-9 h-9 text-white/90 absolute right-4 bottom-3" />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-neutral-200/70 px-3.5 py-2.5 bg-white">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                Status
              </span>
              <span
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${statusBadgeClass(showtime.status)}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${statusDotClass(showtime.status)}`}
                />
                {showtime.status || "—"}
              </span>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl border border-neutral-200/70 px-3.5 py-2.5 bg-white">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 whitespace-nowrap">
                Set Status
              </span>
              <select
                value={draftStatus}
                onChange={(event) => setDraftStatus(event.target.value)}
                className="flex-1 min-w-0 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-800 outline-none focus:border-[#b90101] cursor-pointer"
              >
                {SHOWTIME_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() =>
                  onUpdateStatus({ uuid: showtime.uuid, status: draftStatus })
                }
                disabled={
                  isUpdatingStatus ||
                  draftStatus === (showtime?.status || "DRAFT") ||
                  !showtime?.uuid
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#b90101] hover:brightness-110 text-white text-xs font-black whitespace-nowrap transition active:scale-95 disabled:opacity-60 disabled:pointer-events-none"
              >
                {isUpdatingStatus ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : null}
                {isUpdatingStatus ? "Saving…" : "Save"}
              </button>
            </div>
            <p className="text-[10px] font-semibold text-neutral-400">
              Status changes need the backend endpoint PATCH
              /showtimes/{"{uuid}"}/status — the same pattern as halls,
              movies and seats.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {entry("Movie", showtime.movieTitle)}
              {entry("Hall", showtime.hallName)}
              {entry("Starts", formatDateTime(showtime.startTime))}
              {entry("Ends", formatDateTime(showtime.endTime))}
              {entry("Base Price", `$${Number(showtime.basePrice || 0).toFixed(2)}`)}
              {entry("Status", showtime.status)}
            </div>

            <div className="grid grid-cols-1 gap-3">
              {entry("Showtime UUID", showtime.uuid, "mono")}
              {entry("Movie UUID", showtime.movieUuid, "mono")}
              {entry("Hall UUID", showtime.hallUuid, "mono")}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {entry("Created At", formatDateTime(showtime.createdAt))}
              {entry("Updated At", formatDateTime(showtime.updatedAt))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}