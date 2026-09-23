import { toast } from "react-toastify";
import {
  useGetHallsQuery,
  useCreateHallMutation,
  useDeleteHallMutation,
} from "../../../services/api/hallApi";

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

export function useHallData() {
  const {
    data: halls = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetHallsQuery();

  const [createHall, { isLoading: isCreating }] = useCreateHallMutation();
  const [deleteHall, { isLoading: isDeleting }] = useDeleteHallMutation();

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
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;

    try {
      await deleteHall(id).unwrap();
      toast.success(`"${name}" deleted.`);
    } catch (err) {
      console.error("Delete hall error:", err);
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