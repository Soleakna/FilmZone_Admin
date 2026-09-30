import { useState } from "react";
import {
  AlertTriangle,
  Armchair,
  ArrowLeft,
  CircleAlert,
  Eye,
  HeartHandshake,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { Link, useParams } from "react-router";
import { useGetHallsQuery } from "../../services/api/hallApi";
import { useSeatData } from "./hooks/useSeatData";
import {
  buildSeatLabel,
  findConflictingSeatLabels,
  generateSeatLabels,
  getBulkSeatCountError,
  getBulkStartSeatNumberError,
  getCoupleSeatNumberError,
  getSeatNumberError,
  normalizeSeatLabel,
  SEATS_PER_ROW,
} from "../../utils/seatValidation";

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

// Each row contains SEATS_PER_ROW seats (imported from seatValidation); the
// allowed row letters depend on the hall's capacity (e.g. 36 seats → A–C,
// 48 → A–D, 60 → A–E, 200 → A–Q).

// Converts an uppercase label to its 1-based row index (A=1, B=2, … Z=26,
// AA=27, …). Input must already pass the /^[A-Z]+$/ check.
const rowLabelToIndex = (label) => {
  let index = 0;
  for (const ch of label) {
    index = index * 26 + (ch.charCodeAt(0) - 64);
  }
  return index;
};

// Inverse of rowLabelToIndex: 1 → "A", 26 → "Z", 27 → "AA", …
const rowIndexToLabel = (index) => {
  let n = index;
  let label = "";
  while (n > 0) {
    n -= 1;
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26);
  }
  return label;
};

// Live inline validation for a Row Label. Returns "" when the label is empty
// or valid, otherwise the exact inline error message.
const getRowLabelError = (value, capacity) => {
  const label = (value || "").trim();
  if (label === "") return "";
  // Uppercase letters only — no numbers, lowercase, spaces or stray chars.
  if (!/^[A-Z]+$/.test(label)) {
    return "Row label must be an uppercase letter (A-Z).";
  }
  // The maximum allowed row letter derives from the hall capacity.
  const maxRows = Math.ceil(Number(capacity) / SEATS_PER_ROW);
  if (!Number.isFinite(maxRows) || maxRows < 1) return "";
  if (rowLabelToIndex(label) > maxRows) {
    return `Please enter a row label from A-${rowIndexToLabel(maxRows)}.`;
  }
  return "";
};

export default function AdminSeatsPage() {
  const { hallUuid } = useParams();

  // Resolve the hall (name, type, capacity) from the cached halls query.
  const { data: halls = [] } = useGetHallsQuery();
  const hall = halls.find(
    (h) => (h?.uuid ?? h?.id ?? h?._id ?? h?.hallId) === hallUuid,
  );

  const [form, setForm] = useState(DEFAULT_FORM);
  // Seat currently having its status toggled — shows a spinner on its button.
  const [busySeatUuid, setBusySeatUuid] = useState(null);
  // Seat details modal (GET /seats/:uuid).
  const [seatDetailsOpen, setSeatDetailsOpen] = useState(false);
  const [selectedSeatUuid, setSelectedSeatUuid] = useState(null);

  // Inline duplicate-seat errors (replaces the old Toastify duplicate alerts).
  // Live duplicates are derived from the already-loaded `seats` list; these
  // states only hold labels reported back by the API when the local list is
  // momentarily stale.
  const [normalSeatErrors, setNormalSeatErrors] = useState([]);
  const [coupleSeatErrors, setCoupleSeatErrors] = useState([]);
  const [bulkSeatErrors, setBulkSeatErrors] = useState([]);

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
    handleUpdateSeatStatus,
    seatDetails,
    isSeatDetailsLoading,
    isSeatDetailsError,
    seatDetailsError,
    refetchSeatDetails,
  } = useSeatData(hallUuid, selectedSeatUuid);

  const setField = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
    // Editing the label fields clears any stale API-reported duplicate so the
    // live check (from the loaded seats list) takes over immediately.
    if (key === "rowLabel" || key === "seatNumber") setNormalSeatErrors([]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Seat Number must be a whole number between 1 and 12 — the inline error
    // under the Seat Number field explains the exact problem.
    if (normalSeatNumberError) {
      return;
    }

    // Row Label is already validated live (uppercase A–Z within the hall's
    // capacity range) — this guard just stops the submission itself.
    if (normalRowLabelError) {
      return;
    }

    // A seat label that already exists in this hall is blocked up front — the
    // matching inline error under the Seat Number field names the conflict.
    const label = buildSeatLabel(form.rowLabel, form.seatNumber);
    const freshSeats = await refetchSeatsForCheck();
    if (label && isTakenInList(label, freshSeats)) {
      setNormalSeatErrors([label]);
      return;
    }

    const payload = {
      rowLabel: form.rowLabel.trim().toUpperCase(),
      seatNumber: Number(form.seatNumber),
      seatType: form.seatType,
      xPosition: Number(form.xPosition) || 0,
      yPosition: Number(form.yPosition) || 0,
    };

    const result = await handleCreateSeat(payload);
    if (result?.created) {
      setForm(DEFAULT_FORM);
      setNormalSeatErrors([]);
    } else if (result?.duplicateSeatLabel) {
      setNormalSeatErrors([result.duplicateSeatLabel]);
      // Refresh the list so the already-existing seat becomes visible.
      refetch();
    }
  };

  const [coupleForm, setCoupleForm] = useState(DEFAULT_COUPLE_FORM);

  // Switcher for the Create Seat card: "NORMAL" | "COUPLE" | "BULK"
  const [activeSeatTab, setActiveSeatTab] = useState("NORMAL");

  // Bulk ("many seats at once") form — a dynamic list of row definitions.
  const [bulkRows, setBulkRows] = useState([{ ...DEFAULT_BULK_ROW }]);

  const setBulkRowField = (index, key, value) => {
    setBulkRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    );
    setBulkSeatErrors([]);
  };

  const addBulkRow = () => {
    setBulkRows((prev) => [...prev, { ...DEFAULT_BULK_ROW }]);
    setBulkSeatErrors([]);
  };

  const removeBulkRow = (index) => {
    setBulkRows((prev) => prev.filter((_, i) => i !== index));
    setBulkSeatErrors([]);
  };

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

    // Block when a row's seat-number range would exceed 12 (the per-row
    // inline error under Start Seat Number explains the exact problem).
    if (bulkSeatRangeErrors.some((err) => err)) {
      return;
    }

    // Block when any generated label already exists — the inline errors name
    // exactly which of the generated labels conflict.
    if (bulkDuplicateByRow.some((labels) => labels.length > 0)) {
      setBulkSeatErrors([
        ...new Set(bulkDuplicateByRow.flatMap((labels) => labels)),
      ]);
      return;
    }

    // Block when any row's label is invalid (uppercase A–Z within the hall's
    // capacity range) — the per-row inline errors show the exact problem.
    if (bulkRowLabelErrors.some((err) => err)) {
      return;
    }

    // Re-sync the seats list so the duplicate check below is authoritative -
    // a stale cached list can otherwise allow/block creates incorrectly.
    const freshSeats = await refetchSeatsForCheck();
    const freshDuplicates = getTakenLabels(bulkRows, freshSeats);
    if (freshDuplicates.some((labels) => labels.length > 0)) {
      setBulkSeatErrors([
        ...new Set(freshDuplicates.flatMap((labels) => labels)),
      ]);
      return;
    }

    const result = await handleCreateBulkSeats(rows);
    if (result?.created) {
      setBulkRows([{ ...DEFAULT_BULK_ROW }]);
      setBulkSeatErrors([]);
    } else if (result?.duplicateSeatLabels?.length) {
      setBulkSeatErrors(result.duplicateSeatLabels);
      // Refresh the list so the already-existing seats become visible.
      refetch();
    }
  };

  const setCoupleField = (key) => (event) => {
    setCoupleForm((prev) => ({ ...prev, [key]: event.target.value }));
    // Editing either couple label field clears any stale API-reported
    // duplicate so the live check (from the loaded seats list) takes over.
    if (key === "rowLabel" || key === "firstSeatNumber") {
      setCoupleSeatErrors([]);
    }
  };

  const handleCoupleSubmit = async (event) => {
    event.preventDefault();

    // First Seat Number must be a whole number between 1 and 11 so the pair
    // (n and n + 1) stays inside seat numbers 1–12 — the inline error under
    // First Seat Number explains the exact problem.
    if (coupleSeatNumberError) {
      return;
    }

    // Block when either generated label already exists — the inline errors
    // under First Seat Number name exactly which label(s) conflict:
    // e.g. creating A5 + A6 checks A5 and A6, never any other seat.
    const freshSeats = await refetchSeatsForCheck();
    const takenCoupleLabels = [coupleFirstLabel, coupleSecondLabel].filter(
      (lbl) => lbl && isTakenInList(lbl, freshSeats),
    );
    if (takenCoupleLabels.length > 0) {
      setCoupleSeatErrors(takenCoupleLabels);
      return;
    }

    // Row Label is already validated live (uppercase A–Z within the hall's
    // capacity range) — this guard just stops the submission itself.
    if (coupleRowLabelError) {
      return;
    }

    const payload = {
      rowLabel: coupleForm.rowLabel.trim().toUpperCase(),
      firstSeatNumber: Number(coupleForm.firstSeatNumber),
    };

    const result = await handleCreateCoupleSeat(payload);
    if (result?.created) {
      setCoupleForm(DEFAULT_COUPLE_FORM);
      setCoupleSeatErrors([]);
    } else if (result?.duplicateSeatLabels?.length) {
      setCoupleSeatErrors(result.duplicateSeatLabels);
      // Refresh the list so the already-existing seats become visible.
      refetch();
    }
  };

  const getHallName = (h) => h?.name || `Hall #${h?.uuid ?? h?.id ?? "?"}`;
  const getCapacity = (h) => h?.capacity ?? "—";
  const getSeatLabel = (s) =>
    s?.seatLabel || `${s?.rowLabel ?? ""}${s?.seatNumber ?? ""}`.trim();
  const getSeatPosition = (s) => {
    if (s?.xPosition === undefined && s?.yPosition === undefined) return null;
    return `(${s?.xPosition ?? 0}, ${s?.yPosition ?? 0})`;
  };
  // Seats without a status field (older records) count as ACTIVE.
  const getSeatStatus = (s) => {
    const status = (s?.status || "ACTIVE").toUpperCase();
    return status === "ACTIVE" ? "ACTIVE" : "INACTIVE";
  };

  // --- Inline duplicate-seat detection (reuses the already-loaded seats list) ---
  // buildSeatLabel / normalizeSeatLabel are imported from utils/seatValidation
  // so every create path builds and compares labels identically.
  const isTakenInList = (label, seatList) =>
    label &&
    (seatList || []).some(
      (s) =>
        normalizeSeatLabel(getSeatLabel(s)) === normalizeSeatLabel(label),
    );
  const isLabelTaken = (label) => isTakenInList(label, seats);

  // Re-syncs the seats list right before a duplicate check so the decision is
  // made against the freshest backend data (a stale cached list can otherwise
  // cause confusing create failures).
  const refetchSeatsForCheck = async () => {
    const fresh = await refetch().catch(() => null);
    return Array.isArray(fresh?.data) ? fresh.data : seats;
  };

  // Checks every label a set of bulk rows would generate against a seat list.
  const getTakenLabels = (rowsData, seatList) =>
    rowsData.map((row) =>
      findConflictingSeatLabels(
        generateSeatLabels(row.rowLabel, row.startSeatNumber, row.numberOfSeats),
        seatList,
        getSeatLabel,
      ),
    );

  // Normal seat — the exact label the form would create (e.g. "A1").
  const normalSeatLabel = buildSeatLabel(form.rowLabel, form.seatNumber);
  const normalDuplicateLabel =
    normalSeatLabel && isLabelTaken(normalSeatLabel) ? normalSeatLabel : null;
  const normalErrorLabels = [
    ...new Set([normalDuplicateLabel, ...normalSeatErrors].filter(Boolean)),
  ];

  // Couple seat — it generates two labels: {row}{first} and {row}{first + 1}.
  const coupleFirstLabel = buildSeatLabel(
    coupleForm.rowLabel,
    coupleForm.firstSeatNumber,
  );
  const coupleSecondLabel = buildSeatLabel(
    coupleForm.rowLabel,
    // Only build the second label when the first one is already valid —
    // an empty/cleared number field must not create a phantom "A1" error.
    coupleFirstLabel ? Number(coupleForm.firstSeatNumber) + 1 : 0,
  );
  const coupleLiveLabels = findConflictingSeatLabels(
    [coupleFirstLabel, coupleSecondLabel],
    seats,
    getSeatLabel,
  );
  const coupleErrorLabels = [
    ...new Set([...coupleLiveLabels, ...coupleSeatErrors].filter(Boolean)),
  ];

  // Bulk seats — every label each row will generate, flagged per row.
  const bulkDuplicateByRow = getTakenLabels(bulkRows, seats);

  // Seat-number range validation for bulk rows — every seat number created by
  // a row must stay 1–12, i.e. Start and Start + NumberOfSeats − 1 must both
  // be whole numbers inside that range. Inline errors show under the fields.
  const bulkSeatRangeErrors = bulkRows.map((row) => {
    const startError = getBulkStartSeatNumberError(row.startSeatNumber);
    if (startError) return startError;
    if (String(row.numberOfSeats ?? "").trim() === "") return "";
    const countError = getBulkSeatCountError(row.numberOfSeats);
    if (countError) return countError;
    const startSeat = Number(row.startSeatNumber);
    const count = Number(row.numberOfSeats);
    if (startSeat + count - 1 > SEATS_PER_ROW) {
      return "The seat numbers cannot exceed 12.";
    }
    return "";
  });

  // Switching tabs clears stale API-reported duplicate errors so they never
  // resurface on a different form.
  const switchSeatTab = (tab) => {
    setActiveSeatTab(tab);
    setNormalSeatErrors([]);
    setCoupleSeatErrors([]);
    setBulkSeatErrors([]);
  };

  // Row Label validation — allowed range derives from the hall's capacity.
  const hallCapacity = hall?.capacity;
  const normalRowLabelError = getRowLabelError(form.rowLabel, hallCapacity);
  const coupleRowLabelError = getRowLabelError(
    coupleForm.rowLabel,
    hallCapacity,
  );
  const bulkRowLabelErrors = bulkRows.map((row) =>
    getRowLabelError(row.rowLabel, hallCapacity),
  );

  // Seat Number validation — every row has exactly SEATS_PER_ROW (12) seats,
  // so the only valid numbers for any row label are the whole numbers 1–12.
  const normalSeatNumberError = getSeatNumberError(form.seatNumber);
  const coupleSeatNumberError = getCoupleSeatNumberError(
    coupleForm.firstSeatNumber,
  );

  const handleToggleSeatStatus = async (seat) => {
    const uuid = seat?.uuid ?? seat?.id ?? seat?._id ?? seat?.seatUuid;
    setBusySeatUuid(uuid);
    try {
      const nextStatus =
        getSeatStatus(seat) === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await handleUpdateSeatStatus(seat, nextStatus);
    } finally {
      setBusySeatUuid(null);
    }
  };

  // --- Seat details (GET /seats/:uuid) ---
  const openSeatDetails = (seat) => {
    const uuid = seat?.uuid ?? seat?.id ?? seat?._id ?? seat?.seatUuid;
    setSelectedSeatUuid(uuid);
    setSeatDetailsOpen(true);
  };

  const closeSeatDetails = () => {
    setSeatDetailsOpen(false);
    setSelectedSeatUuid(null);
  };

  const getSeatDetailsErrorText = () =>
    seatDetailsError?.data?.message ||
    seatDetailsError?.data?.error ||
    seatDetailsError?.data?.detail ||
    seatDetailsError?.error ||
    (seatDetailsError?.status
      ? `Server returned HTTP ${seatDetailsError.status}`
      : "Unknown error");

  const formatDateTime = (iso) => {
    if (!iso) return "—";
    try {
      const date = new Date(iso);
      return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
    } catch {
      return "—";
    }
  };

  // One labeled value row inside the Seat Details dialog.
  const renderDetail = (label, value, kind) => (
    <div className="rounded-xl bg-neutral-50 border border-neutral-200/70 px-3.5 py-2.5 shadow-xs">
      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#b90101]/40" />
        {label}
      </p>
      {kind === "badge" ? (
        <span
          className={`mt-1 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
            getSeatStatus(seatDetails) === "ACTIVE"
              ? "bg-emerald-100 text-emerald-600"
              : "bg-red-100 text-red-600"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              getSeatStatus(seatDetails) === "ACTIVE"
                ? "bg-emerald-500 animate-pulse"
                : "bg-red-600"
            }`}
          />
          {value ?? "—"}
        </span>
      ) : (
        <p
          className={`mt-0.5 text-sm font-bold ${
            kind === "mono"
              ? "font-mono text-xs font-semibold text-neutral-600 break-all"
              : "text-neutral-900"
          }`}
        >
          {value !== undefined && value !== null && value !== "" ? value : "—"}
        </p>
      )}
    </div>
  );

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
                  <div
                    className="min-w-0 flex-1 cursor-pointer group"
                    onClick={() => openSeatDetails(seat)}
                    title="View seat details"
                  >
                    <p className="text-sm font-extrabold text-neutral-900 truncate group-hover:text-[#b90101] group-hover:underline">
                      {getSeatLabel(seat)}
                    </p>
                    <p className="text-xs font-semibold text-neutral-500 mt-0.5">
                      Row: {seat?.rowLabel ?? "—"} · Seat #:{" "}
                      {seat?.seatNumber ?? "—"}
                      {getSeatPosition(seat)
                        ? ` · Position ${getSeatPosition(seat)}`
                        : ""}
                    </p>
                    <p className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-400 mt-1 group-hover:text-[#b90101]">
                      <Eye className="w-3.5 h-3.5" />
                      View details
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        getSeatStatus(seat) === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          getSeatStatus(seat) === "ACTIVE"
                            ? "bg-emerald-500 animate-pulse"
                            : "bg-red-600"
                        }`}
                      />
                      {getSeatStatus(seat)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleSeatStatus(seat)}
                      disabled={busySeatUuid === (seat?.uuid ?? seat?.id ?? seat?._id)}
                      className={`inline-flex items-center justify-center min-w-[82px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        getSeatStatus(seat) === "ACTIVE"
                          ? "bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-600/30"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {busySeatUuid === (seat?.uuid ?? seat?.id ?? seat?._id) ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : getSeatStatus(seat) === "ACTIVE" ? (
                        "Deactivate"
                      ) : (
                        "Activate"
                      )}
                    </button>
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
                  onClick={() => switchSeatTab("NORMAL")}
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
                  onClick={() => switchSeatTab("COUPLE")}
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
                  onClick={() => switchSeatTab("BULK")}
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
                className={`${inputClass} ${normalErrorLabels.length || normalRowLabelError ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""}`}
              />
              {normalRowLabelError && (
                <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-red-600">
                  <CircleAlert className="w-4 h-4 shrink-0" />
                  <span>{normalRowLabelError}</span>
                </p>
              )}
            </div>

            {/* Seat Number — full width, same width as Row Label & button */}
            <div>
              <label className={labelClass}>Seat Number</label>
              <input
                type="number"
                min="1"
                max={SEATS_PER_ROW}
                value={form.seatNumber}
                onChange={setField("seatNumber")}
                required
                className={`${inputClass} ${normalErrorLabels.length || normalSeatNumberError ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""}`}
              />
              {normalSeatNumberError && (
                <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-red-600">
                  <CircleAlert className="w-4 h-4 shrink-0" />
                  <span>{normalSeatNumberError}</span>
                </p>
              )}
              {!normalSeatNumberError && normalErrorLabels.length > 0 && (
                <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-red-600">
                  <CircleAlert className="w-4 h-4 shrink-0" />
                  <span>
                    Seat already exists with SeatLabel{" "}
                    {normalErrorLabels.join(" ")}
                  </span>
                </p>
              )}
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
                  className={`${inputClass} ${coupleErrorLabels.length || coupleRowLabelError ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                />
                {coupleRowLabelError && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-red-600">
                    <CircleAlert className="w-4 h-4 shrink-0" />
                    <span>{coupleRowLabelError}</span>
                  </p>
                )}
              </div>

              {/* First Seat Number — full width, on its own row */}
              <div>
                <label className={labelClass}>First Seat Number</label>
                <input
                  type="number"
                  min="1"
                  max={SEATS_PER_ROW - 1}
                  value={coupleForm.firstSeatNumber}
                  onChange={setCoupleField("firstSeatNumber")}
                  required
                  className={`${inputClass} ${coupleErrorLabels.length || coupleSeatNumberError ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                />
                {coupleSeatNumberError && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-red-600">
                    <CircleAlert className="w-4 h-4 shrink-0" />
                    <span>{coupleSeatNumberError}</span>
                  </p>
                )}
                {!coupleSeatNumberError && coupleErrorLabels.length > 0 && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-red-600">
                    <CircleAlert className="w-4 h-4 shrink-0" />
                    <span>
                      Seat already exists with SeatLabel{" "}
                      {coupleErrorLabels.join(" ")}
                    </span>
                  </p>
                )}
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
                {/* API-reported duplicates (fallback when the local seats list
                    is momentarily stale) */}
                {bulkSeatErrors.length > 0 && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-red-600">
                      <CircleAlert className="w-4 h-4 shrink-0" />
                      <span>
                        Seat already exists with SeatLabel{" "}
                        {bulkSeatErrors.join(" ")}
                      </span>
                    </p>
                  </div>
                )}
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
                            className={`${inputClass} ${bulkDuplicateByRow[index]?.length || bulkRowLabelErrors[index] ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                          />
                          {bulkRowLabelErrors[index] && (
                            <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-red-600">
                              <CircleAlert className="w-4 h-4 shrink-0" />
                              <span>{bulkRowLabelErrors[index]}</span>
                            </p>
                          )}
                        </div>
                        <div>
                          <label className={labelClass}>Number of Seats</label>
                          <input
                            type="number"
                            min="1"
                            max={SEATS_PER_ROW}
                            value={row.numberOfSeats}
                            onChange={(e) =>
                              setBulkRowField(
                                index,
                                "numberOfSeats",
                                e.target.value,
                              )
                            }
                            className={`${inputClass} ${bulkDuplicateByRow[index]?.length || bulkSeatRangeErrors[index] ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                          />
                        </div>
                        </div>

                        {/* Start Seat Number — seat numbers must stay 1–12 */}
                        <div>
                          <label className={labelClass}>Start Seat Number</label>
                          <input
                            type="number"
                            min="1"
                            max={SEATS_PER_ROW}
                            value={row.startSeatNumber}
                            onChange={(e) =>
                              setBulkRowField(
                                index,
                                "startSeatNumber",
                                e.target.value,
                              )
                            }
                            className={`${inputClass} ${bulkSeatRangeErrors[index] ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                          />
                          {bulkSeatRangeErrors[index] && (
                            <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-red-600">
                              <CircleAlert className="w-4 h-4 shrink-0" />
                              <span>{bulkSeatRangeErrors[index]}</span>
                            </p>
                          )}
                        </div>

                        {bulkDuplicateByRow[index]?.length > 0 && (
                          <p className="flex items-center gap-1.5 text-sm font-semibold text-red-600">
                            <CircleAlert className="w-4 h-4 shrink-0" />
                            <span>
                              Seat already exists with SeatLabel{" "}
                              {bulkDuplicateByRow[index].join(" ")}
                            </span>
                          </p>
                        )}
 
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

      {/* Seat details dialog — GET /seats/:uuid */}
      {seatDetailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center font-sans">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeSeatDetails}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="seat-details-title"
            className="relative z-10 w-full max-w-md mx-4 rounded-2xl bg-white border border-neutral-200 shadow-2xl p-6 max-h-[85vh] overflow-y-auto space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3
                id="seat-details-title"
                className="flex items-center gap-2 text-base font-black text-neutral-900"
              >
                <span className="w-7 h-7 rounded-lg bg-[#b90101]/10 text-[#b90101] flex items-center justify-center">
                  <Armchair className="w-4 h-4" />
                </span>
                Seat Details
              </h3>
              <button
                type="button"
                onClick={closeSeatDetails}
                title="Close"
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-800 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!selectedSeatUuid ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="mt-3 text-sm font-bold text-neutral-700">
                  This seat has no UUID, so its details cannot be loaded.
                </p>
              </div>
            ) : isSeatDetailsLoading ? (
              <div className="flex items-center justify-center gap-3 py-12 text-neutral-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-bold">Fetching seat details…</span>
              </div>
            ) : isSeatDetailsError ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
                <p className="mt-3 text-sm font-bold text-red-700">
                  Failed to load seat details.
                </p>
                <p className="text-xs font-semibold text-neutral-500 mt-1 break-all">
                  {getSeatDetailsErrorText()}
                </p>
                <button
                  type="button"
                  onClick={refetchSeatDetails}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#b90101] text-white rounded-xl text-xs font-black hover:brightness-110 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Try Again
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Hero header with the seat label */}
                <div className="rounded-2xl bg-gradient-to-br from-[#b90101] to-[#860101] p-5 text-white relative overflow-hidden shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-widest text-white/70">
                    Seat
                  </p>
                  <p className="text-3xl font-black leading-tight mt-0.5">
                    {getSeatLabel(seatDetails) || "—"}
                  </p>
                  <p className="text-xs font-semibold text-white/80 mt-1.5">
                    {getHallName(hall)} · Row {seatDetails?.rowLabel ?? "—"} ·{" "}
                    Seat #{seatDetails?.seatNumber ?? "—"}
                  </p>
                  <Armchair className="w-11 h-11 text-white/90 absolute bottom-3.5 right-4" />
                </div>

                {/* Attributes */}
                <p className="text-[11px] font-black uppercase tracking-widest text-neutral-400">
                  Attributes
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {renderDetail("Row Label", seatDetails?.rowLabel)}
                  {renderDetail("Seat Number", seatDetails?.seatNumber)}
                  {renderDetail("Seat Type", seatDetails?.seatType)}
                  {renderDetail("Status", seatDetails?.status, "badge")}
                </div>

                {/* Identifiers */}
                <p className="text-[11px] font-black uppercase tracking-widest text-neutral-400">
                  Identifiers
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {renderDetail("Seat UUID", seatDetails?.uuid, "mono")}
                  {renderDetail("Hall UUID", seatDetails?.hallUuid, "mono")}
                </div>

                {/* Audit */}
                <p className="text-[11px] font-black uppercase tracking-widest text-neutral-400">
                  Audit
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {renderDetail("Created At", formatDateTime(seatDetails?.createdAt))}
                  {renderDetail("Updated At", formatDateTime(seatDetails?.updatedAt))}
                </div>

                <button
                  type="button"
                  onClick={closeSeatDetails}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#b90101] hover:brightness-110 text-white text-sm font-black py-3 transition active:scale-[0.98]"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}