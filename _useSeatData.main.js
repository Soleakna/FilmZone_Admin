import { toast } from "react-toastify";
import {
  useGetSeatsByHallQuery,
  useGetSeatByUuidQuery,
  useCreateSeatMutation,
  useCreateCoupleSeatMutation,
  useCreateBulkSeatsMutation,
  useUpdateSeatStatusMutation,
} from "../../../services/api/seatApi";
import {
  getBulkSeatCountError,
  getBulkStartSeatNumberError,
  getCoupleSeatNumberError,
  getSeatNumberError,
  SEATS_PER_ROW,
} from "../../../utils/seatValidation";

const extractErrorMessage = (err) => {
  if (err?.status === 401 || err?.status === 403) {
    return "Unauthorized — please log in with a valid cinema admin token first.";
  }

  const data = err?.data;
  const message =
    typeof data === "string"
      ? data
      : data?.message ||
        data?.error ||
        data?.detail ||
        err?.error ||
        "Request failed. Check the Network tab for details.";

  // For 5xx responses, surface the raw backend body too — the server usually
  // says exactly what broke.
  const rawBody =
    err?.status >= 500 && data
      ? ` — ${typeof data === "string" ? data : JSON.stringify(data)}`
      : "";

  return err?.status
    ? `Request failed (HTTP ${err.status}): ${message}${rawBody}`
    : message;
};

// Recognises backend rejections caused by an existing seat label, so those
// can be shown inline in the form instead of a Toastify popup.
const isDuplicateSeatError = (err) => {
  const status = err?.status;
  const data = err?.data;
  const message = String(
    (typeof data === "string" ? data : "") ||
      data?.message ||
      data?.error ||
      data?.detail ||
      err?.error ||
      "",
  );
  return (
    status === 409 ||
    (status >= 400 &&
      /already\s+exist|duplicate|unique\s+constraint|already\s+taken|conflict/i.test(
        message,
      ))
  );
};

// Best-effort: pull the seat label(s) (e.g. "A1") out of a backend error
// message. Returns an empty array when no label can be found in the message.
const extractSeatLabels = (err) => {
  const data = err?.data;
  const message = String(
    (typeof data === "string" ? data : "") ||
      data?.message ||
      data?.error ||
      data?.detail ||
      err?.error ||
      "",
  );
  const matches = message.match(/[A-Za-z]{1,4}\s?\d{1,4}/g) || [];
  return [
    ...new Set(
      matches
        .map((m) => m.replace(/\s/g, "").toUpperCase())
        .filter((m) => /^[A-Z]{1,4}\d{1,4}$/.test(m)),
    ),
  ];
};

// --- Seat-number validation guards (defense-in-depth) ---
// Every row has exactly SEATS_PER_ROW (12) seats, so the only valid seat
// numbers for any row label are the whole numbers 1–12 (A1–A12, B1–B12, …).
// These guards run immediately before an API call so an invalid seat can
// never be created even when the form UI is bypassed. They return "" when the
// payload is valid, otherwise a user-facing error message.

const validateCreateSeatPayload = (seatData) => {
  const raw = String(seatData?.seatNumber ?? "").trim();
  if (raw === "") return "Seat number is required.";
  return getSeatNumberError(raw);
};

const validateCoupleSeatPayload = (seatData) => {
  const raw = String(seatData?.firstSeatNumber ?? "").trim();
  if (raw === "") return "First seat number is required.";
  return getCoupleSeatNumberError(raw);
};

const validateBulkRowsPayload = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return "At least one row is required.";
  }
  for (const row of rows) {
    const label = String(row?.rowLabel ?? "").trim().toUpperCase() || "?";
    const startRaw = String(row?.startSeatNumber ?? "").trim();
    if (startRaw === "") {
      return `Start seat number is required for row ${label}.`;
    }
    const startError = getBulkStartSeatNumberError(startRaw);
    if (startError) return `${startError} (row ${label})`;
    const countRaw = String(row?.numberOfSeats ?? "").trim();
    if (countRaw === "") {
      return `Number of seats is required for row ${label}.`;
    }
    const countError = getBulkSeatCountError(countRaw);
    if (countError) return `${countError} (row ${label})`;
    if (Number(startRaw) + Number(countRaw) - 1 > SEATS_PER_ROW) {
      return `The seat numbers cannot exceed ${SEATS_PER_ROW} (row ${label}).`;
    }
  }
  return "";
};

export function useSeatData(hallUuid, selectedSeatUuid = null) {
  const {
    data: seats = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetSeatsByHallQuery(hallUuid, {
    skip: !hallUuid,
  });

  // GET /seats/:uuid — details for the seat the admin clicks. Skipped until
  // a seat is actually selected so no request fires for an empty UUID.
  const {
    data: seatDetails,
    isLoading: isSeatDetailsLoading,
    isError: isSeatDetailsError,
    error: seatDetailsError,
    refetch: refetchSeatDetails,
  } = useGetSeatByUuidQuery(selectedSeatUuid, {
    skip: !selectedSeatUuid,
  });

  const [createSeat, { isLoading: isCreating }] = useCreateSeatMutation();
  const [createCoupleSeat, { isLoading: isCreatingCouple }] =
    useCreateCoupleSeatMutation();
  const [createBulkSeats, { isLoading: isCreatingBulk }] =
    useCreateBulkSeatsMutation();
  const [updateSeatStatus, { isLoading: isUpdatingStatus }] =
    useUpdateSeatStatusMutation();

  const getSeatLabel = (seat) =>
    seat?.seatLabel || `${seat?.rowLabel ?? ""}${seat?.seatNumber ?? ""}`.trim();

  const handleCreateSeat = async (seatData) => {
    // Never send an invalid seat number to the API — a seat in any row must
    // be a whole number between 1 and 12 (e.g. only A1–A12 for row A).
    const guardError = validateCreateSeatPayload(seatData);
    if (guardError) {
      toast.error(guardError);
      return { created: false, validationError: guardError };
    }
    try {
      const created = await createSeat({ hallUuid, ...seatData }).unwrap();
      const seatLabel =
        created?.seatLabel ||
        `${seatData.rowLabel || ""}${seatData.seatNumber || ""}`.trim();
      toast.success(`Seat "${seatLabel || "New Seat"}" created!`);
      return { created: true };
    } catch (err) {
      console.error("Create seat error:", err);

      // Duplicate-seat errors are surfaced inline in the form (not Toastify).
      if (isDuplicateSeatError(err)) {
        const fromMessage = extractSeatLabels(err);
        const attempted = `${seatData.rowLabel || ""}${seatData.seatNumber || ""}`.trim();
        return {
          created: false,
          duplicateSeatLabel: fromMessage[0] || attempted || "",
        };
      }

      toast.error(extractErrorMessage(err));
      return { created: false };
    }
  };

  const handleCreateCoupleSeat = async (seatData) => {
    // The couple pair occupies {row}{n} and {row}{n + 1}, so the first seat
    // number must be a whole number between 1 and 11 to keep both ≤ 12.
    const guardError = validateCoupleSeatPayload(seatData);
    if (guardError) {
      toast.error(guardError);
      return { created: false, validationError: guardError };
    }
    try {
      const created = await createCoupleSeat({ hallUuid, ...seatData }).unwrap();
      const groupLabel =
        created?.label ||
        created?.groupUuid ||
        `Couple ${seatData.rowLabel || ""}${seatData.firstSeatNumber || ""}`
          .trim();
      toast.success(`Couple seat "${groupLabel || "New Couple"}" created!`);
      return { created: true };
    } catch (err) {
      console.error("Create couple seat error:", err);

      // Duplicate-seat errors are surfaced inline in the form (not Toastify).
      if (isDuplicateSeatError(err)) {
        const first = Number(seatData.firstSeatNumber) || 1;
        const attempted = [
          `${seatData.rowLabel || ""}${first}`.trim(),
          `${seatData.rowLabel || ""}${first + 1}`.trim(),
        ].filter(Boolean);
        const fromMessage = extractSeatLabels(err);
        return {
          created: false,
          duplicateSeatLabels: fromMessage.length ? fromMessage : attempted,
        };
      }

      toast.error(extractErrorMessage(err));
      return { created: false };
    }
  };

  const handleCreateBulkSeats = async (rows) => {
    // Every generated label must stay inside each row's 1–12 seat numbers —
    // invalid ranges are rejected before any request reaches the API.
    const guardError = validateBulkRowsPayload(rows);
    if (guardError) {
      toast.error(guardError);
      return { created: false, validationError: guardError };
    }
    try {
      const created = await createBulkSeats({ hallUuid, rows }).unwrap();
      const count = Array.isArray(created) ? created.length : rows.length;
      toast.success(`Created ${count} seat(s) in this hall!`);
      return { created: true };
    } catch (err) {
      console.error("Bulk create seats error:", err);

      // Duplicate-seat errors are surfaced inline in the form (not Toastify).
      if (isDuplicateSeatError(err)) {
        const attempted = rows.flatMap((row) => {
          const start = Number(row.startSeatNumber) || 1;
          const count = Math.max(Number(row.numberOfSeats) || 1, 1);
          return Array.from({ length: count }, (_, i) =>
            `${row.rowLabel || ""}${start + i}`.trim(),
          ).filter(Boolean);
        });
        const fromMessage = extractSeatLabels(err);
        return {
          created: false,
          duplicateSeatLabels: fromMessage.length ? fromMessage : attempted,
        };
      }

      toast.error(extractErrorMessage(err));
      return { created: false };
    }
  };

  // PATCH /seats/{uuid}/status — dedicated status endpoint.
  // ACTIVE seats are bookable; INACTIVE seats are unavailable for booking.
  const handleUpdateSeatStatus = async (seat, status) => {
    const uuid = seat?.uuid ?? seat?.id ?? seat?._id ?? seat?.seatUuid;
    if (uuid === undefined || uuid === null) {
      toast.error("Cannot update: seat response has no id field.");
      return false;
    }

    const label = getSeatLabel(seat) || "Seat";

    try {
      await updateSeatStatus({ uuid, hallUuid, status }).unwrap();
      toast.success(
        `Seat "${label}" is now ${
          status === "ACTIVE"
            ? "ACTIVE — available for booking"
            : "INACTIVE — unavailable for booking"
        }.`,
      );
      return true;
    } catch (err) {
      console.error("Update seat status error:", err);

      // Seat no longer exists on the server — drop the stale row from the list.
      if (err?.status === 404) {
        toast.warn(
          `Seat "${label}" no longer exists on the server. Refreshing the list…`,
        );
        refetch();
      } else if (err?.status === 401 || err?.status === 403) {
        toast.error(
          "Unauthorized — your session token was rejected. Log out and log in again, then retry.",
        );
      } else {
        toast.error(extractErrorMessage(err));
      }
      return false;
    }
  };

  return {
    seats,
    isLoading,
    isFetching,
    isError,
    error,
    isCreating,
    isCreatingCouple,
    isCreatingBulk,
    isUpdatingStatus,
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
  };
}