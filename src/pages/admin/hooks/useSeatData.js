import { toast } from "react-toastify";
import {
  useGetSeatsByHallQuery,
  useGetSeatByUuidQuery,
  useCreateSeatMutation,
  useCreateCoupleSeatMutation,
  useCreateBulkSeatsMutation,
  useUpdateSeatStatusMutation,
} from "../../../services/api/seatApi";

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
    try {
      const created = await createSeat({ hallUuid, ...seatData }).unwrap();
      const seatLabel =
        created?.seatLabel ||
        `${seatData.rowLabel || ""}${seatData.seatNumber || ""}`.trim();
      toast.success(`Seat "${seatLabel || "New Seat"}" created!`);
      return true;
    } catch (err) {
      console.error("Create seat error:", err);
      toast.error(extractErrorMessage(err));
      return false;
    }
  };

  const handleCreateCoupleSeat = async (seatData) => {
    try {
      const created = await createCoupleSeat({ hallUuid, ...seatData }).unwrap();
      const groupLabel =
        created?.label ||
        created?.groupUuid ||
        `Couple ${seatData.rowLabel || ""}${seatData.firstSeatNumber || ""}`
          .trim();
      toast.success(`Couple seat "${groupLabel || "New Couple"}" created!`);
      return true;
    } catch (err) {
      console.error("Create couple seat error:", err);
      toast.error(extractErrorMessage(err));
      return false;
    }
  };

  const handleCreateBulkSeats = async (rows) => {
    try {
      const created = await createBulkSeats({ hallUuid, rows }).unwrap();
      const count = Array.isArray(created) ? created.length : rows.length;
      toast.success(`Created ${count} seat(s) in this hall!`);
      return true;
    } catch (err) {
      console.error("Bulk create seats error:", err);
      toast.error(extractErrorMessage(err));
      return false;
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