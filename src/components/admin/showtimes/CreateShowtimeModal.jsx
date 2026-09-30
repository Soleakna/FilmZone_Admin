import { useState, useEffect } from "react";
import { X, Plus, Loader2, Film, Building2 } from "lucide-react";

const inputClass =
  "w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-neutral-900 outline-none focus:border-[#b90101] focus:ring-2 focus:ring-[#b90101]/20 transition";

const labelClass =
  "block text-xs font-black uppercase tracking-wider text-neutral-600 mb-1.5";

// Backend ShowtimeStatus enum — the only values the API accepts.
const SHOWTIME_STATUSES = ["DRAFT", "OPEN", "CLOSED", "CANCELLED", "COMPLETED"];

export default function CreateShowtimeModal({
  open,
  onClose,
  movies,
  halls,
  isCreating,
  onCreate,
}) {
  const [form, setForm] = useState({
    movieUuid: "",
    hallUuid: "",
    showDate: "",
    showTime: "",
    basePrice: "",
    status: "DRAFT",
  });

  useEffect(() => {
    if (open) {
      setForm({ movieUuid: "", hallUuid: "", showDate: "", showTime: "", basePrice: "", status: "DRAFT" });
    }
  }, [open]);

  if (!open) return null;

  const setField = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const activeHalls = (halls ?? []).filter(
    (h) => (h?.status || "ACTIVE").toUpperCase() === "ACTIVE",
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    const ok = await onCreate({
      movieUuid: form.movieUuid,
      hallUuid: form.hallUuid,
      showDate: form.showDate,
      showTime: form.showTime,
      basePrice: Number(form.basePrice),
      status: form.status,
    });
    if (ok) onClose();
  };

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
        aria-labelledby="create-showtime-title"
        className="relative z-10 w-full max-w-lg mx-4 rounded-2xl bg-white border border-neutral-200 shadow-2xl p-6 max-h-[85vh] overflow-y-auto space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3
            id="create-showtime-title"
            className="flex items-center gap-2 text-base font-black text-neutral-900"
          >
            <span className="w-7 h-7 rounded-lg bg-[#b90101]/10 text-[#b90101] flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </span>
            Create Showtime
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

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Movie */}
          <div>
            <label className={labelClass}>Movie</label>
            <div className="relative">
              <select
                value={form.movieUuid}
                onChange={setField("movieUuid")}
                required
                className={`${inputClass} appearance-none pr-9 cursor-pointer`}
              >
                <option value="" disabled>Select a movie…</option>
                {(movies ?? []).map((m) => (
                  <option key={m.uuid} value={m.uuid}>
                    {m.title || "Untitled"}
                    {m.releaseDate ? ` (${m.releaseDate.slice(0, 4)})` : ""}
                  </option>
                ))}
              </select>
              <Film className="w-4 h-4 text-neutral-400 pointer-events-none absolute right-9 top-1/2 -translate-y-1/2" />
            </div>
            {(!movies || movies.length === 0) && (
              <p className="text-[11px] font-semibold text-amber-600 mt-1">
                No movies yet — import one in Cinema Movies first.
              </p>
            )}
          </div>

          {/* Hall */}
          <div>
            <label className={labelClass}>Hall</label>
            <div className="relative">
              <select
                value={form.hallUuid}
                onChange={setField("hallUuid")}
                required
                className={`${inputClass} appearance-none pr-9 cursor-pointer`}
              >
                <option value="" disabled>Select a hall…</option>
                {activeHalls.map((h) => (
                  <option key={h.uuid} value={h.uuid}>
                    {h.name} — {h.hallType || "STANDARD"} ({h.capacity || "?"} seats)
                  </option>
                ))}
              </select>
              <Building2 className="w-4 h-4 text-neutral-400 pointer-events-none absolute right-9 top-1/2 -translate-y-1/2" />
            </div>
            {activeHalls.length === 0 && (
              <p className="text-[11px] font-semibold text-amber-600 mt-1">
                No active halls available — activate one in Manage Halls.
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className={labelClass}>Status</label>
            <div className="relative">
              <select
                value={form.status}
                onChange={setField("status")}
                className={`${inputClass} appearance-none pr-9 cursor-pointer`}
              >
                {SHOWTIME_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <span className="w-2 h-2 rounded-full bg-neutral-300 pointer-events-none absolute right-9 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Date + Time + Price */}
          {/* Date + Time + Price */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Show Date</label>
              <input
                type="date"
                value={form.showDate}
                onChange={setField("showDate")}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Show Time</label>
              <input
                type="time"
                value={form.showTime}
                onChange={setField("showTime")}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Base Price</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.01"
                value={form.basePrice}
                onChange={setField("basePrice")}
                required
                className={inputClass}
              />
            </div>
          </div>

          <p className="text-[11px] font-semibold text-neutral-400">
            The backend computes start/end times from the date + time and the
            movie&apos;s runtime. Minimum base price is 0.01. New showtimes
            default to DRAFT until you publish them.
          </p>

          <button
            type="submit"
            disabled={isCreating}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#b90101] hover:brightness-110 text-white text-sm font-black py-3 transition active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
          >
            {isCreating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {isCreating ? "Creating…" : "Create Showtime"}
          </button>
        </form>
      </div>
    </div>
  );
}