import { toast } from "react-toastify";
import {
  useGetHallsQuery,
  useCreateHallMutation,
  useUpdateHallMutation,
  useUpdateHallStatusMutation,
  useDeleteHallMutation,
} from "../../../services/api/hallApi";
import { useDeleteAllSeatsMutation } from "../../../services/api/seatApi";
import { getHallId, hideSeededDemoHalls } from "../../../utils/hallVisibility";

const extractErrorMessage = (err) => {
  if (err?.status === 401 || err?.status === 403) {
    return "Unauthorized — your session token was rejected. Log out and log in again, then retry.";
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

  const rawBody =
    err?.status >= 500 && data
      ? ` — ${typeof data === "string" ? data : JSON.stringify(data)}`
      : "";

  return err?.status
    ? `Request failed (HTTP ${err.status}): ${message}${rawBody}`
    : message;
};

export function useHallData() {
  const {
    data: rawHalls = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetHallsQuery();

  const halls = hideSeededDemoHalls(rawHalls);

  const [createHall, { isLoading: isCreating }] = useCreateHallMutation();
  const [updateHall, { isLoading: isUpdatingCapacity }] =
    useUpdateHallMutation();
  const [updateHallStatus, { isLoading: isUpdatingStatus }] =
    useUpdateHallStatusMutation();
  const [deleteHall, { isLoading: isDeleting }] = useDeleteHallMutation();
  const [deleteAllSeats] = useDeleteAllSeatsMutation();

  const handleCreate = async (hallData) => {
    try {
      await createHall(hallData).unwrap();
      toast.success(`Hall "${hallData.name || "New Hall"}" created!`);
      return true;
    } catch (err) {
      console.error("Create hall error:", err);
      toast.error(extractErrorMessage(err));
      return false;
    }
  };

  const handleUpdateCapacity = async (hall, capacity) => {
    const id = hall?.uuid ?? hall?.id ?? hall?._id ?? hall?.hallId;
    if (id === undefined || id === null) {
      toast.error("Cannot update: hall response has no id field.");
      return false;
    }

    const name = hall?.name || `Hall #${id}`;

    try {
      await updateHall({ id, capacity }).unwrap();
      toast.success(`Capacity of "${name}" updated to ${capacity} seats.`);
      return true;
    } catch (err) {
      console.error("Update hall capacity error:", err);

      // Hall no longer exists on the server — drop the stale row from the list.
      if (err?.status === 404) {
        toast.warn(`"${name}" no longer exists on the server. Refreshing the list…`);
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

  const handleUpdateStatus = async (hall, status) => {
    const id = hall?.uuid ?? hall?.id ?? hall?._id ?? hall?.hallId;
    if (id === undefined || id === null) {
      toast.error("Cannot update: hall response has no id field.");
      return false;
    }

    const name = hall?.name || `Hall #${id}`;

    try {
      await updateHallStatus({ id, status }).unwrap();
      toast.success(
        `"${name}" is now ${
          status === "ACTIVE" ? "ACTIVE — users can book it" : "INACTIVE — bookings & showtimes blocked"
        }.`,
      );
      return true;
    } catch (err) {
      console.error("Update hall status error:", err);

      // Hall no longer exists on the server — drop the stale row from the list.
      if (err?.status === 404) {
        toast.warn(`"${name}" no longer exists on the server. Refreshing the list…`);
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

  const handleDelete = async (hall) => {
    const id = hall?.uuid ?? hall?.id ?? hall?._id ?? hall?.hallId;
    if (id === undefined || id === null) {
      toast.error("Cannot delete: hall response has no id field.");
      return;
    }

    const name = hall?.name || `Hall #${id}`;

    try {
      await deleteHall(id).unwrap();
      toast.success(`"${name}" deleted.`);
    } catch (err) {
      console.error("Delete hall error:", err);

      if (err?.status === 404) {
        toast.warn(`"${name}" no longer exists on the server. Refreshing the list…`);
        refetch();
        return;
      }

      if (err?.status === 401 || err?.status === 403) {
        toast.error(
          `"${name}" is tied to a different admin login and cannot be deleted from this session. Only halls you create while logged in with this account can be deleted here.`,
        );
        return;
      }
      if (err?.status === 500) {
        try {
          await deleteAllSeats(id).unwrap();
        } catch (seatErr) {
          console.error("Delete hall seats error:", seatErr);
        }

        try {
          await deleteHall(id).unwrap();
        } catch (retryErr) {
          console.error("Retry delete hall error:", retryErr);
        }

        const refetched = await refetch().catch(() => ({ data: undefined }));
        const freshHalls = Array.isArray(refetched?.data) ? refetched.data : null;
        const stillThere = freshHalls
          ? freshHalls.some((h) => getHallId(h) === id)
          : true;

        if (stillThere) {
          toast.error(
            `Could not delete "${name}": the server returned an internal error. It may still have showtimes or bookings attached, or it belongs to a different admin account.`,
          );
        } else {
          toast.success(`"${name}" deleted (its seats were removed first).`);
        }
        return;
      }

      toast.error(extractErrorMessage(err));
    }
  };

  return {
    halls,
    isLoading,
    isFetching,
    isError,
    error,
    isCreating,
    isDeleting,
    isUpdating: isUpdatingCapacity || isUpdatingStatus,
    refetch,
    handleCreate,
    handleUpdateCapacity,
    handleUpdateStatus,
    handleDelete,
  };
}