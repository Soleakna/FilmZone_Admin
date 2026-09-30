import { toast } from "react-toastify";
import {
  useGetSeatsByHallQuery,
  useCreateSeatMutation,
  useCreateCoupleSeatMutation,
  useCreateBulkSeatsMutation,
} from "../../../services/api/seatApi";

const extractErrorMessage = (err) => {
  if (err?.status === 401 || err?.status === 403) {
    return "Unauthorized — please log in with a valid cinema admin token first.";
  }
  return (
    err?.data?.message ||
    err?.data?.error ||
    err?.error ||
    "Request failed. Check the Network tab for details."
  );
};

export function useSeatData(hallUuid) {
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

  const [createSeat, { isLoading: isCreating }] = useCreateSeatMutation();
  const [createCoupleSeat, { isLoading: isCreatingCouple }] =
    useCreateCoupleSeatMutation();
  const [createBulkSeats, { isLoading: isCreatingBulk }] =
    useCreateBulkSeatsMutation();

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

  return {
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
  };
}