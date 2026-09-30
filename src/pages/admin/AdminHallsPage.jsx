import { useState } from "react";
import {
  Armchair,
  Building2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Link } from "react-router";
import { toast } from "react-toastify";
import { useHallData } from "./hooks/useHallData";

const inputClass =
  "w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-neutral-900 outline-none focus:border-[#b90101] focus:ring-2 focus:ring-[#b90101]/20 transition";

const labelClass =
  "block text-xs font-black uppercase tracking-wider text-neutral-600 mb-1.5";

// Seat capacity rules: an admin can create a hall with anywhere from 36 up
// to 200 seats. These are just the per-type starting values — the field is
// editable, and anything outside 36–200 is rejected with a range message.
const MIN_CAPACITY = 36;
const MAX_CAPACITY = 200;

const SEAT_DEFAULTS = {
  STANDARD: 96,
  VIP: 36,
  IMAX: 120,
};

const DEFAULT_FORM = {
  name: "",
  description: "",
  hallType: "STANDARD",
  capacity: String(SEAT_DEFAULTS.STANDARD),
};

export default function AdminHallsPage() {
  const {
    halls,
    isLoading,
    isFetching,
    isError,
    error,
    isCreating,
    isDeleting,
    isUpdating,
    refetch,
    handleCreate,
    handleUpdateCapacity,
    handleUpdateStatus,
    handleDelete,
  } = useHallData();

  const [form, setForm] = useState(DEFAULT_FORM);
  const [hallToDelete, setHallToDelete] = useState(null);
  const [hallToEdit, setHallToEdit] = useState(null);
  const [editCapacity, setEditCapacity] = useState("");
  const [statusChange, setStatusChange] = useState(null); // { hall, nextStatus }

  const setField = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();

    const capacity = Number(form.capacity);
    if (
      !Number.isInteger(capacity) ||
      capacity < MIN_CAPACITY ||
      capacity > MAX_CAPACITY
    ) {
      toast.error(
        `Invalid capacity: a hall can have ${MIN_CAPACITY} to ${MAX_CAPACITY} seats.`,
      );
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      capacity,
      hallType: form.hallType,
    };

    const created = await handleCreate(payload);
    if (created) setForm(DEFAULT_FORM);
  };

  // When the admin picks a different hall type, move the seat count to that
  // type's suggested default — but only if they haven't typed a custom value.
  const handleHallTypeChange = (event) => {
    const nextType = event.target.value;
    if (Number(form.capacity) === getAutoCapacity(form.hallType)) {
      setForm((prev) => ({
        ...prev,
        hallType: nextType,
        capacity: String(getAutoCapacity(nextType)),
      }));
    } else {
      setForm((prev) => ({ ...prev, hallType: nextType }));
    }
  };

  const openEditModal = (hall) => {
    setHallToEdit(hall);
    setEditCapacity(String(hall?.capacity ?? SEAT_DEFAULTS.STANDARD));
  };

  const handleSaveCapacity = async () => {
    const capacity = Number(editCapacity);
    if (
      !Number.isInteger(capacity) ||
      capacity < MIN_CAPACITY ||
      capacity > MAX_CAPACITY
    ) {
      toast.error(
        `Invalid capacity: a hall can have ${MIN_CAPACITY} to ${MAX_CAPACITY} seats.`,
      );
      return;
    }

    const updated = await handleUpdateCapacity(hallToEdit, capacity);
    if (updated) setHallToEdit(null);
  };

  const openStatusModal = (hall) => {
    const current = getStatus(hall);
    setStatusChange({
      hall,
      nextStatus: current === "ACTIVE" ? "INACTIVE" : "ACTIVE",
    });
  };

  const handleConfirmStatusChange = async () => {
    if (!statusChange) return;
    const { hall, nextStatus } = statusChange;
    const updated = await handleUpdateStatus(hall, nextStatus);
    if (updated) setStatusChange(null);
  };

  const getHallName = (h) => h?.name || `Hall #${h?.uuid ?? h?.id ?? "?"}`;
  const getHallType = (h) => h?.hallType || "—";
  const getCapacity = (h) => h?.capacity ?? "—";
  const getAutoCapacity = (hallType) =>
    SEAT_DEFAULTS[hallType] ?? SEAT_DEFAULTS.STANDARD;
  // Halls without a status field (older records) count as ACTIVE.
  const getStatus = (h) => {
    const status = (h?.status || "ACTIVE").toUpperCase();
    return status === "ACTIVE" ? "ACTIVE" : "INACTIVE";
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-(--color-primary) tracking-tight">
            Manage Halls
          </h1>
          <p className="text-sm font-semibold text-neutral-500 mt-1">
            Create and manage cinema halls.
          </p>
        </div>
        <button
          type="button"
          onClick={refetch}
          disabled={isFetching}
          className="inline-flex items-center gap-2 rounded-xl border border-(--color-primary) bg-white px-4 py-2.5 text-sm font-black text-neutral-700 hover:text-[#b90101] hover:border-[#b90101]/40 transition disabled:opacity-60 disabled:pointer-events-none"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Error banner */}
      {isError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-700">Failed to load halls</p>
            <p className="text-xs font-semibold text-red-600 mt-0.5">
              {error?.status === 401 || error?.status === 403
                ? "Unauthorized — connect a valid cinema admin account (access token) first, then press Refresh."
                : error?.data?.message ||
                  error?.data?.error ||
                  error?.error ||
                  error?.status ||
                  "Unknown error"}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Hall list */}
        <section className="lg:col-span-3 bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-black text-neutral-900">Hall List</h2>
            <span className="text-xs font-black text-neutral-500 bg-neutral-100 rounded-full px-3 py-1">
              {halls.length} hall(s)
            </span>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-neutral-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-bold">
                Fetching halls from the API…
              </span>
            </div>
          ) : halls.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="w-10 h-10 text-neutral-300 mx-auto" />
              <p className="mt-3 text-sm font-bold text-neutral-500">
                No halls found yet.
              </p>
              <p className="text-xs font-semibold text-neutral-400 mt-1">
                Use the form on the right to create your first hall.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {halls.map((hall, index) => (
                <li
                  key={hall?.uuid ?? hall?.id ?? hall?._id ?? hall?.hallId ?? index}
                  className="flex items-center justify-between gap-4 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-neutral-900 truncate">
                      {getHallName(hall)}
                    </p>
                    <p className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-neutral-500 mt-0.5">
                      <span>
                        {getHallType(hall)} · Capacity: {getCapacity(hall)}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          getStatus(hall) === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            getStatus(hall) === "ACTIVE"
                              ? "bg-emerald-500 animate-pulse"
                              : "bg-red-600"
                          }`}
                        />
                        {getStatus(hall)}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/admin/halls/${hall?.uuid ?? hall?.id ?? hall?._id ?? hall?.hallId}/seats`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 hover:bg-[#b90101]/10 text-neutral-700 hover:text-[#b90101] text-xs font-black px-3 py-1.5 border border-neutral-200 transition active:scale-95"
                    >
                      <Armchair className="w-3.5 h-3.5" />
                      Seats
                    </Link>
                    <button
                      type="button"
                      onClick={() => openEditModal(hall)}
                      disabled={isUpdating}
                      title="Update capacity"
                      className="w-8 h-8 shrink-0 rounded-full bg-neutral-100 hover:bg-[#b90101]/10 text-neutral-500 hover:text-[#b90101] flex items-center justify-center border border-neutral-200 transition active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openStatusModal(hall)}
                      disabled={isUpdating}
                      className={`inline-flex items-center justify-center min-w-[82px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        getStatus(hall) === "ACTIVE"
                          ? "bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-600/30"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isUpdating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : getStatus(hall) === "ACTIVE" ? (
                        "Deactivate"
                      ) : (
                        "Activate"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setHallToDelete(hall)}
                      disabled={isDeleting}
                      title="Delete hall"
                      className="w-8 h-8 shrink-0 rounded-full bg-neutral-100 hover:bg-red-50 text-neutral-500 hover:text-red-600 flex items-center justify-center border border-neutral-200 transition active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        {/* Create hall form */}
        <section className="lg:col-span-2 bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-6 h-fit">
          <h2 className="text-base font-black text-neutral-900 mb-1">
            Create New Hall
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>Hall Name</label>
              <input
                value={form.name}
                onChange={setField("name")}
                placeholder="e.g. Standard Hall 5"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea
                value={form.description}
                onChange={setField("description")}
                placeholder="Optional description of the hall"
                rows="3"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Hall Type</label>
              <select
                value={form.hallType}
                onChange={handleHallTypeChange}
                className={inputClass}
              >
                <option value="STANDARD">STANDARD</option>
                <option value="VIP">VIP</option>
                <option value="IMAX">IMAX</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Capacity (Seats)</label>
              <input
                type="number"
                min={MIN_CAPACITY}
                max={MAX_CAPACITY}
                step="1"
                inputMode="numeric"
                value={form.capacity}
                onChange={setField("capacity")}
                placeholder={`${MIN_CAPACITY} – ${MAX_CAPACITY} seats`}
                required
                className={inputClass}
              />
            </div>

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
              {isCreating ? "Creating…" : "Create Hall"}
            </button>
          </form>
        </section>
      </div>

      {/* Confirm status change dialog */}
      {statusChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center font-sans">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setStatusChange(null)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-status-title"
            className="relative z-10 w-full max-w-sm mx-4 rounded-2xl bg-white border border-neutral-200 shadow-2xl p-6 space-y-4"
          >
            <h3
              id="confirm-status-title"
              className="text-base font-black text-neutral-900"
            >
              {statusChange.nextStatus === "ACTIVE"
                ? "Activate Hall"
                : "Deactivate Hall"}
            </h3>
            <p className="text-sm font-semibold text-neutral-600 leading-relaxed">
              {statusChange.nextStatus === "ACTIVE" ? (
                <>
                  You are about to activate{" "}
                  <span className="font-black text-neutral-900">
                    &quot;{getHallName(statusChange.hall)}&quot;
                  </span>
                  . Users will be able to book it, and it can be used for movies
                  and showtimes again.
                </>
              ) : (
                <>
                  You are about to deactivate{" "}
                  <span className="font-black text-neutral-900">
                    &quot;{getHallName(statusChange.hall)}&quot;
                  </span>
                  . Users will not be able to book it, and it cannot be used for
                  movies or showtimes.
                </>
              )}
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setStatusChange(null)}
                disabled={isUpdating}
                className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-black text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                disabled={isUpdating}
                className={`inline-flex items-center justify-center min-w-[82px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusChange.nextStatus === "ACTIVE"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30"
                    : "bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-600/30"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isUpdating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : statusChange.nextStatus === "ACTIVE" ? (
                  "Activate"
                ) : (
                  "Deactivate"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update capacity dialog */}
      {hallToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center font-sans">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setHallToEdit(null)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-capacity-title"
            className="relative z-10 w-full max-w-sm mx-4 rounded-2xl bg-white border border-neutral-200 shadow-2xl p-6 space-y-4"
          >
            <h3
              id="edit-capacity-title"
              className="text-base font-black text-neutral-900"
            >
              Update Capacity
            </h3>
            <p className="text-sm font-semibold text-neutral-600 leading-relaxed">
              Set a new seat capacity for{" "}
              <span className="font-black text-neutral-900">
                &quot;{getHallName(hallToEdit)}&quot;
              </span>{" "}
              ({getHallType(hallToEdit)}).
            </p>

            <div>
              <label className={labelClass}>Capacity (Seats)</label>
              <input
                type="number"
                min={MIN_CAPACITY}
                max={MAX_CAPACITY}
                step="1"
                inputMode="numeric"
                value={editCapacity}
                onChange={(event) => setEditCapacity(event.target.value)}
                placeholder={`${MIN_CAPACITY} – ${MAX_CAPACITY} seats`}
                required
                className={inputClass}
              />
              <p className="text-[11px] font-semibold text-neutral-400 mt-1">
                Current: {getCapacity(hallToEdit)} seats · Between {MIN_CAPACITY}{" "}
                and {MAX_CAPACITY} allowed.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setHallToEdit(null)}
                disabled={isUpdating}
                className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-black text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCapacity}
                disabled={isUpdating}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#b90101] hover:brightness-110 text-white text-sm font-black px-4 py-2.5 transition active:scale-95 disabled:opacity-60 disabled:pointer-events-none"
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Pencil className="w-4 h-4" />
                )}
                {isUpdating ? "Saving…" : "Save Capacity"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {hallToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center font-sans">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setHallToDelete(null)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-title"
            className="relative z-10 w-full max-w-sm mx-4 rounded-2xl bg-white border border-neutral-200 shadow-2xl p-6 space-y-4"
          >
            <h3
              id="confirm-delete-title"
              className="text-base font-black text-neutral-900"
            >
              Delete Hall
            </h3>
            <p className="text-sm font-semibold text-neutral-600 leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="font-black text-neutral-900">
                &quot;{getHallName(hallToDelete)}&quot;
              </span>
              ?
            </p>
            <p className="text-xs font-medium text-neutral-500 leading-relaxed">
              This cannot be undone. If the hall still contains seats, they will
              be removed as well.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setHallToDelete(null)}
                disabled={isDeleting}
                className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-black text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const hall = hallToDelete;
                  setHallToDelete(null);
                  handleDelete(hall);
                }}
                disabled={isDeleting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#b90101] hover:brightness-110 text-white text-sm font-black px-4 py-2.5 transition active:scale-95 disabled:opacity-60 disabled:pointer-events-none"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}