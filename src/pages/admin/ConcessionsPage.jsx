import { useMemo, useState } from "react";
import ConcessionsHeader from "../../components/admin/concession/ConcessionsHeader";
import ConcessionsTable from "../../components/admin/concession/ConcessionsTable";
import ConcessionFormModal from "../../components/admin/concession/ConcessionFormModal";
import {
  useGetConcessionsQuery,
  useCreateConcessionMutation,
  useUpdateConcessionMutation,
  useToggleConcessionStatusMutation,
  useDeleteConcessionMutation,
} from "../../services/api/concessionApi";

export default function ConcessionsPage() {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetConcessionsQuery();

  const [createConcession, { isLoading: isCreating }] =
    useCreateConcessionMutation();
  const [updateConcession, { isLoading: isUpdating }] =
    useUpdateConcessionMutation();
  const [toggleConcessionStatus] = useToggleConcessionStatusMutation();
  const [deleteConcession] = useDeleteConcessionMutation();

  const items = data ?? [];
  const isSubmitting = isCreating || isUpdating;

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          i.name.toLowerCase().includes(search.toLowerCase()) &&
          (!category || i.category === category)
      ),
    [items, search, category]
  );

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setModalOpen(true);
  };

  const handleSubmit = async (payload) => {
    try {
      if (payload.uuid) {
        await updateConcession(payload).unwrap();
      } else {
        await createConcession(payload).unwrap();
      }
      setModalOpen(false);
    } catch (err) {
      window.alert(err?.data?.message || "Something went wrong. Please try again.");
    }
  };

  const handleDelete = async (item) => {
    if (
      !window.confirm(
        `Permanently delete "${item.name}"? This cannot be undone.`
      )
    )
      return;
    try {
      await deleteConcession(item.uuid).unwrap();
    } catch (err) {
      window.alert(err?.data?.message || "Delete failed. Please try again.");
    }
  };

  // Hides/shows an item instead of deleting it (calls toggle-status).
  const handleToggleStatus = async (item) => {
    try {
      await toggleConcessionStatus(item.uuid).unwrap();
    } catch (err) {
      window.alert(err?.data?.message || "Couldn't update status.");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <ConcessionsHeader
        total={filtered.length}
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        onAdd={openCreate}
      />

      {isError && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>
            {error?.status === 401
              ? "You need to be logged in to view concessions."
              : error?.data?.message || "Failed to load concessions."}
          </span>
          <button
            type="button"
            onClick={refetch}
            className="font-medium underline"
          >
            Try again
          </button>
        </div>
      )}

      <ConcessionsTable
        concessions={filtered}
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
      />

      <ConcessionFormModal
        isOpen={modalOpen}
        concession={editing}
        isSubmitting={isSubmitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}