/**
 * Seat validation rules shared by every "create seat" path (single, couple,
 * bulk) in the admin UI and in the seat API hook.
 *
 * Every row of a hall holds exactly `SEATS_PER_ROW` seats and seat numbers
 * must be whole numbers from 1 to SEATS_PER_ROW — e.g. row A only has A1–A12,
 * so A0, A-1, A13, A14 or any number outside that range is rejected.
 */

export const SEATS_PER_ROW = 12;

// The couple endpoint creates a pair {row}{n} + {row}{n + 1}, so the first
// seat number is capped at SEATS_PER_ROW - 1 to keep both seats ≤ 12.
const COUPLE_MAX_FIRST = SEATS_PER_ROW - 1;

// Returns "" when the value is empty (browser "required" handles that) or
// valid; otherwise the exact inline error message to show to the admin.
export const getSeatNumberError = (value) => {
  const raw = String(value ?? "").trim();
  if (raw === "") return "";
  const num = Number(raw);
  if (!Number.isInteger(num)) {
    return "Seat number must be a whole number (like 1, 2 or 3).";
  }
  if (num < 1 || num > SEATS_PER_ROW) {
    return `Seat number must be between 1 and ${SEATS_PER_ROW}.`;
  }
  return "";
};

// Couple seat: both generated labels must stay inside 1–SEATS_PER_ROW.
export const getCoupleSeatNumberError = (value) => {
  const raw = String(value ?? "").trim();
  if (raw === "") return "";
  const num = Number(raw);
  if (!Number.isInteger(num)) {
    return "First seat number must be a whole number (like 1, 2 or 3).";
  }
  if (num < 1 || num > COUPLE_MAX_FIRST) {
    return `First seat number must be between 1 and ${COUPLE_MAX_FIRST} so the couple pair stays within seat numbers 1–${SEATS_PER_ROW}.`;
  }
  return "";
};

// Bulk rows: the start seat number of every row must be a whole number 1–12.
export const getBulkStartSeatNumberError = (value) => {
  const raw = String(value ?? "").trim();
  if (raw === "") return "";
  const num = Number(raw);
  if (!Number.isInteger(num)) {
    return "Start Seat Number must be a whole number (like 1, 2 or 3).";
  }
  if (num < 1 || num > SEATS_PER_ROW) {
    return `Start Seat Number must be between 1 and ${SEATS_PER_ROW}.`;
  }
  return "";
};

// Bulk rows: the seat count of every row must be a whole number of at least 1.
// The max is enforced implicitly through the range check (start + count − 1 ≤ 12).
export const getBulkSeatCountError = (value) => {
  const raw = String(value ?? "").trim();
  if (raw === "") return "";
  const num = Number(raw);
  if (!Number.isInteger(num) || num < 1) {
    return "Number of Seats must be a whole number of at least 1.";
  }
  return "";
};

// Builds the exact seat label the backend stores: row letter + number, e.g.
// buildSeatLabel("A", 5) → "A5". Returns "" when the input can't form a label.
// This is the single source of truth for label generation so every "create
// seat" path (normal, couple, bulk) produces identical labels and validates
// the SAME labels it would actually create.
export const buildSeatLabel = (rowLabel, seatNumber) => {
  const row = (rowLabel || "").trim().toUpperCase();
  const num = Number(seatNumber);
  if (!row || !Number.isInteger(num) || num < 1) return "";
  return `${row}${num}`;
};

// Every label a range generates: {row}{start} … {row}{start + count − 1}.
// e.g. generateSeatLabels("A", 5, 2) → ["A5", "A6"].
// Returns [] when either argument is missing/invalid, so a caller can never
// accidentally validate against an empty or default (e.g. "1") label.
export const generateSeatLabels = (rowLabel, startSeatNumber, count) => {
  const start = Number(startSeatNumber);
  const amount = Number(count);
  if (!Number.isInteger(start) || start < 1) return [];
  if (!Number.isInteger(amount) || amount < 1) return [];
  const labels = [];
  for (let i = 0; i < amount; i += 1) {
    const lbl = buildSeatLabel(rowLabel, start + i);
    if (lbl) labels.push(lbl);
  }
  return labels;
};

// Case-insensitive comparison target for seat labels ("A5" matches "a5").
export const normalizeSeatLabel = (label) => (label || "").trim().toLowerCase();

// Returns the labels from `proposedLabels` that already exist in `seatList`.
// A seat's label is derived with `toSeatLabel` (defaults to seatLabel or
// rowLabel + seatNumber). ONLY the proposed labels themselves are ever
// reported — a seat that is not part of the labels being created (e.g. a
// phantom "A1" while creating A5/A6) can never appear in the result.
export const findConflictingSeatLabels = (
  proposedLabels,
  seatList,
  toSeatLabel = (seat) =>
    seat?.seatLabel || `${seat?.rowLabel ?? ""}${seat?.seatNumber ?? ""}`.trim(),
) =>
  [
    ...new Set(
      (Array.isArray(proposedLabels) ? proposedLabels : []).filter((label) =>
        label &&
        (Array.isArray(seatList) ? seatList : []).some(
          (seat) =>
            normalizeSeatLabel(toSeatLabel(seat)) === normalizeSeatLabel(label),
        ),
      ),
    ),
  ];