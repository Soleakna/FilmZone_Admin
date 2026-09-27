import { useState } from "react";
import {
  AlertTriangle,
  Armchair,
  ArrowLeft,
  HeartHandshake,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";
import { Link, useParams } from "react-router";
import { useGetHallsQuery } from "../../services/api/hallApi";
import { useSeatData } from "./hooks/useSeatData";

const inputClass =
  "w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-neutral-900 outline-none focus:border-[#b90101] focus:ring-2 focus:ring-[#b90101]/20 transition";

const labelClass =
  "block text-xs font-black uppercase tracking-wider text-neutral-600 mb-1.5";

const DEFAULT_FORM = {
  rowLabel: "",
  seatNumber: 1,
  seatType: "STANDARD",
  xPosition: 0,
  yPosition: 0,
};

const DEFAULT_COUPLE_FORM = {
  rowLabel: "",
  firstSeatNumber: 1,
};

const DEFAULT_BULK_ROW = {
  rowLabel: "",
  startSeatNumber: 1,
  numberOfSeats: 12,
  seatType: "STANDARD",
};

export default function AdminSeatsPage() {
  const { hallUuid } = useParams();

  // Resolve the hall (name, type, capacity) from the cached halls query.
  const { data: halls = [] } = useGetHallsQuery();
  const hall = halls.find(
    (h) => (h?.uuid ?? h?.id ?? h?._id ?? h?.hallId) === hallUuid,
  );

  const {
    seats,
    isLoading,
    isFetching,
    isError,
    error,
    isCreating,
    isCreatingCouple,
    isCreatingBulk,
    refetch,
    handleCreateSeat,
    handleCreateCoupleSeat,
    handleCreateBulkSeats,
  } = useSeatData(hallUuid);

  const [form, setForm] = useState(DEFAULT_FORM);

  const setField = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      rowLabel: form.rowLabel.trim().toUpperCase(),
      seatNumber: Number(form.seatNumber) || 1,
      seatType: form.seatType,
      xPosition: Number(form.xPosition) || 0,
      yPosition: Number(form.yPosition) || 0,
    };

    const created = await handleCreateSeat(payload);
    if (created) setForm(DEFAULT_FORM);
  };

  const [coupleForm, setCoupleForm] = useState(DEFAULT_COUPLE_FORM);

  // Switcher for the Create Seat card: "NORMAL" | "COUPLE" | "BULK"
  const [activeSeatTab, setActiveSeatTab] = useState("NORMAL");

  // Bulk ("many seats at once") form — a dynamic list of row definitions.
  const [bulkRows, setBulkRows] = useState([{ ...DEFAULT_BULK_ROW }]);

  const setBulkRowField = (index, key, value) =>
    setBulkRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    );

  const addBulkRow = () =>
    setBulkRows((prev) => [...prev, { ...DEFAULT_BULK_ROW }]);

  const removeBulkRow = (index) =>
    setBulkRows((prev) => prev.filter((_, i) => i !== index));

  const totalBulkSeats = bulkRows.reduce(
    (sum, row) => sum + (Number(row.numberOfSeats) || 0),
    0,
  );

  const canSubmitBulk = bulkRows.some(
    (row) => row.rowLabel.trim() && (Number(row.numberOfSeats) || 0) >= 1,
  );

  const handleBulkSubmit = async () => {
    const rows = bulkRows
      .filter(
        (row) => row.rowLabel.trim() && (Number(row.numberOfSeats) || 0) >= 1,
      )
      .map((row) => ({
        rowLabel: row.rowLabel.trim().toUpperCase(),
        startSeatNumber: Number(row.startSeatNumber) || 1,
        numberOfSeats: Number(row.numberOfSeats) || 1,
        seatType: row.seatType,
      }));

    if (rows.length === 0) {
      toast.warn("Add at least one row with a Row Label and Number of Seats.");
      return;
    }

    const created = await handleCreateBulkSeats(rows);
    if (created) setBulkRows([{ ...DEFAULT_BULK_ROW }]);
  };

  const setCoupleField = (key) => (event) =>
    setCoupleForm((prev) => ({ ...prev, [key]: event.target.value }));

  const handleCoupleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      rowLabel: coupleForm.rowLabel.trim().toUpperCase(),
      firstSeatNumber: Number(coupleForm.firstSeatNumber) || 1,
    };

    const created = await handleCreateCoupleSeat(payload);
    if (created) setCoupleForm(DEFAULT_COUPLE_FORM);
  };

  const getHallName = (h) => h?.name || `Hall #${h?.uuid ?? h?.id ?? "?"}`;
  const getCapacity = (h) => h?.capacity ?? "—";
  const getSeatLabel = (s) =>
    s?.seatLabel || `${s?.rowLabel ?? ""}${s?.seatNumber ?? ""}`.trim();
  const getSeatPosition = (s) => {
    if (s?.xPosition === undefined && s?.yPosition === undefined) return null;
    return `(${s?.xPosition ?? 0}, ${s?.yPosition ?? 0})`;
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            to="/admin/halls"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-[#b90101] transition mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Manage Halls
          </Link>
          <h1 className="text-2xl font-black text-(--color-primary) tracking-tight">
            Manage Seats
          </h1>
          <p className="text-sm font-semibold text-neutral-500 mt-1">
            {getHallName(hall)} · Hall UUID: {hallUuid}
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
            <p className="text-sm font-bold text-red-700">Failed to load seats</p>
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
        {/* Seat list */}
        <section className="lg:col-span-3 bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-black text-neutral-900">Seat List</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-neutral-600 bg-neutral-100 rounded-full px-3 py-1">
                Capacity: {getCapacity(hall)}
              </span>
              <span className="text-xs font-black text-neutral-500 bg-[#b90101]/10 text-[#b90101] rounded-full px-3 py-1">
                {seats.length} seat(s)
              </span>
            </div>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-neutral-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-bold">
                Fetching seats from the API…
              </span>
            </div>
          ) : seats.length === 0 ? (
            <div className="text-center py-16">
              <Armchair className="w-10 h-10 text-neutral-300 mx-auto" />
              <p className="mt-3 text-sm font-bold text-neutral-500">
                No seats in this hall yet.
              </p>
              <p className="text-xs font-semibold text-neutral-400 mt-1">
                Use the form on the right to create your first seat.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {seats.map((seat, index) => (
                <li
                  key={
                    seat?.uuid ??
                    seat?.id ??
                    seat?._id ??
                    getSeatLabel(seat) ??
                    index
                  }
                  className="flex items-center justify-between gap-4 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-neutral-900 truncate">
                      {getSeatLabel(seat)}
                    </p>
                    <p className="text-xs font-semibold text-neutral-500 mt-0.5">
                      Row: {seat?.rowLabel ?? "—"} · Seat #:{" "}
                      {seat?.seatNumber ?? "—"}
                      {getSeatPosition(seat)
                        ? ` · Position ${getSeatPosition(seat)}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-black uppercase bg-[#b90101]/10 text-[#b90101] rounded-full px-2.5 py-1">
                      {seat?.seatType ?? "STANDARD"}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase rounded-full px-2.5 py-1 ${
                        seat?.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {seat?.status || "—"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Create seat card — Normal / Couple switcher (pill tabs like the
            Movie Library ALL / LIVE / UPCOMING switcher) */}
        <div className="lg:col-span-2">
          <section className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-6">
            <div className="space-y-3">
              <div>
                <h2 className="text-base font-black text-neutral-900">
                  Create Seat
                </h2>
                <p className="text-xs font-semibold text-neutral-500 mt-0.5">
                  {activeSeatTab === "COUPLE"
                    ? "Creates a couple seat pair starting at the given seat number."
                    : activeSeatTab === "BULK"
                      ? "Add many seats at once — one entry per row."
                      : "Add a single seat to this hall."}
                </p>
              </div>

              {/* Normal / Couple / Bulk switcher — 3 equal-width buttons with equal gaps
                  (a 3-column grid guarantees the third button always fits) */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSeatTab("NORMAL")}
                  className={`w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
                    activeSeatTab === "NORMAL"
                      ? "bg-[#b90101] text-white shadow-xs"
                      : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
                  }`}
                >
                  <Armchair className="w-3.5 h-3.5" />
                  <span>Normal Seat</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSeatTab("COUPLE")}
                  className={`w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
                    activeSeatTab === "COUPLE"
                      ? "bg-[#b90101] text-white shadow-xs"
                      : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
                  }`}
                >
                  <HeartHandshake className="w-3.5 h-3.5" />
                  <span>Couple Seat</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSeatTab("BULK")}
                  className={`w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
                    activeSeatTab === "BULK"
                      ? "bg-[#b90101] text-white shadow-xs"
                      : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Bulk Seats</span>
                </button>
              </div>
            </div>

            {/* Normal seat form (shown when the NORMAL tab is active) */}
            {activeSeatTab === "NORMAL" && (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Row Label — full width, same width as the Create Normal Seat button */}
            <div>
              <label className={labelClass}>Row Label</label>
              <input
                value={form.rowLabel}
                onChange={setField("rowLabel")}
                placeholder="e.g. A"
                required
                maxLength={4}
                className={inputClass}
              />
            </div>

            {/* Seat Number — full width, same width as Row Label & button */}
            <div>
              <label className={labelClass}>Seat Number</label>
              <input
                type="number"
                min="1"
                value={form.seatNumber}
                onChange={setField("seatNumber")}
                required
                className={inputClass}
              />
            </div>

            {/* <div>
              <label className={labelClass}>Seat Type</label>
              <select
                value={form.seatType}
                onChange={setField("seatType")}
                className={inputClass}
              >
                <option value="STANDARD">STANDARD</option>
              </select>
            </div> */}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>X Position</label>
                <input
                  type="number"
                  value={form.xPosition}
                  onChange={setField("xPosition")}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Y Position</label>
                <input
                  type="number"
                  value={form.yPosition}
                  onChange={setField("yPosition")}
                  className={inputClass}
                />
              </div>
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
              {isCreating ? "Creating…" : "Create Normal Seat"}
            </button>
          </form>
            )}

            {/* Couple seat form (shown when the COUPLE tab is active) */}
            {activeSeatTab === "COUPLE" && (
            <form onSubmit={handleCoupleSubmit} className="mt-5 space-y-4">
              {/* Row Label — full width, same as the Create Couple Seat button */}
              <div>
                <label className={labelClass}>Row Label</label>
                <input
                  value={coupleForm.rowLabel}
                  onChange={setCoupleField("rowLabel")}
                  placeholder="e.g. A"
                  required
                  maxLength={4}
                  className={inputClass}
                />
              </div>

              {/* First Seat Number — full width, on its own row */}
              <div>
                <label className={labelClass}>First Seat Number</label>
                <input
                  type="number"
                  min="1"
                  value={coupleForm.firstSeatNumber}
                  onChange={setCoupleField("firstSeatNumber")}
                  required
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={isCreatingCouple}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#b90101] hover:brightness-110 text-white text-sm font-black py-3 transition active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
              >
                {isCreatingCouple ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <HeartHandshake className="w-4 h-4" />
                )}
                {isCreatingCouple ? "Creating…" : "Create Couple Seat"}
              </button>
            </form>
            )}

            {/* Bulk seats form (shown when the BULK tab is active) */}
            {activeSeatTab === "BULK" && (
              <div className="mt-5 space-y-4">
                <div className="space-y-3">
                  {bulkRows.map((row, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                          Seat Row {index + 1}
                        </span>
                        {bulkRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeBulkRow(index)}
                            title="Remove this row"
                            className="p-1.5 text-neutral-400 hover:text-[#b90101] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                          <label className={labelClass}>Row Label</label>
                          <input
                            value={row.rowLabel}
                            onChange={(e) =>
                              setBulkRowField(index, "rowLabel", e.target.value)
                            }
                            placeholder="e.g. A"
                            maxLength={4}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Number of Seats</label>
                          <input
                            type="number"
                            min="1"
                            value={row.numberOfSeats}
                            onChange={(e) =>
                              setBulkRowField(
                                index,
                                "numberOfSeats",
                                e.target.value,
                              )
                            }
                            className={inputClass}
                          />
                        </div>
                        </div>

                        {/* Start Seat Number — full width, same as Add Another Row */}
                        <div>
                          <label className={labelClass}>Start Seat Number</label>
                          <input
                            type="number"
                            min="1"
                            value={row.startSeatNumber}
                            onChange={(e) =>
                              setBulkRowField(
                                index,
                                "startSeatNumber",
                                e.target.value,
                              )
                            }
                            className={inputClass}
                          />
                        </div>
 
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addBulkRow}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-sm font-black py-3 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Another Row
                </button>

                <button
                  type="button"
                  onClick={handleBulkSubmit}
                  disabled={isCreatingBulk || !canSubmitBulk}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#b90101] hover:brightness-110 text-white text-sm font-black py-3 transition active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
                >
                  {isCreatingBulk ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Layers className="w-4 h-4" />
                  )}
                  {isCreatingBulk
                    ? "Creating…"
                    : `Create ${totalBulkSeats} Seat${
                        totalBulkSeats === 1 ? "" : "s"
                      }`}
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}