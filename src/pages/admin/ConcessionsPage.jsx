import { useMemo, useState } from "react";
import ConcessionsHeader from "../../components/admin/concession/ConcessionsHeader";
import ConcessionsTable from "../../components/admin/concession/ConcessionsTable";
import ConcessionFormModal from "../../components/admin/concession/ConcessionFormModal";

// Sample data — replace with your API call later
const INITIAL_ITEMS = [
  {
    uuid: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    name: "Large popcorn",
    description: "Freshly popped, lightly salted",
    category: "FOOD",
    price: 4.5,
    imageUrl: "",
  },
  {
    uuid: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    name: "Cola",
    description: "Ice-cold 500ml",
    category: "DRINK",
    price: 2,
    imageUrl: "",
  },
];

export default function ConcessionsPage() {
  const [items, setItems] = useState(INITIAL_ITEMS);
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

  const handleSubmit = (payload) => {
    if (payload.uuid) {
      // update
      setItems((prev) =>
        prev.map((i) => (i.uuid === payload.uuid ? payload : i))
      );
    } else {
      // create
      setItems((prev) => [...prev, { ...payload, uuid: crypto.randomUUID() }]);
    }
    setModalOpen(false);
  };

  const handleDelete = (item) => {
    if (window.confirm(`Delete "${item.name}"?`)) {
      setItems((prev) => prev.filter((i) => i.uuid !== item.uuid));
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
      <ConcessionsTable
        concessions={filtered}
        onEdit={openEdit}
        onDelete={handleDelete}
      />
      <ConcessionFormModal
        isOpen={modalOpen}
        concession={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}