import { toast } from "react-toastify";
import {
  useGetHallsQuery,
  useCreateHallMutation,
  useDeleteHallMutation,
} from "../../../services/api/hallApi";
import { useDeleteAllSeatsMutation } from "../../../services/api/seatApi";
import { getHallId, hideSeededDemoHalls } from "../../../utils/hallVisibility";

const extractErrorMessage = (err) => {
  if (err?.status === 401 || err?.status === 403) {
    return "Unauthorized — your session token was rejected. Log out and log in again, then retry.";
  }
  const message =
    err?.data?.message ||
    err?.data?.error ||
    err?.error ||
    "Request failed. Check the Network tab for details.";
  return err?.status ? `Request failed (HTTP ${err.status}): ${message}` : message;
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

  // Show every real hall from the API, hiding only the backend demo seeds.
  // (No owner data is returned by this API, so older halls the admin created
  // before tracking existed must remain visible here — not filtered to the
  // "created by me" registry, otherwise they'd disappear from the list.)
  const halls = hideSeededDemoHalls(rawHalls);

  const [createHall, { isLoading: isCreating }] = useCreateHallMutation();
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

      // Hall no longer exists on the server (deleted from another login or by
      // someone else) — drop the stale row from the list.
      if (err?.status === 404) {
        toast.warn(`"${name}" no longer exists on the server. Refreshing the list…`);
        refetch();
        return;
      }

      // The hall belongs to a different login/account, so this session's token
      // is not allowed to delete it.
      if (err?.status === 401 || err?.status === 403) {
        toast.error(
          `"${name}" is tied to a different admin login and cannot be deleted from this session. Only halls you create while logged in with this account can be deleted here.`,
        );
        return;
      }

      // Internal server error. The most common cause: the hall still has seats
      // (and/or showtimes) that reference it, so the database refuses to delete
      // it. Remove the hall's seats first, then retry the deletion.
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

        // Re-fetch and confirm whether the hall is actually gone now.
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
    refetch,
    handleCreate,
    handleDelete,
  };
}