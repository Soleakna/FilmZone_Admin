
import { CONCESSION_CATEGORIES } from "./ConcessionFormModal";

export default function ConcessionsHeader({
  total = 0,
  search = "",
  onSearchChange,
  category = "",
  onCategoryChange,
  onAdd,
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Concessions</h1>
        <p className="mt-1 text-sm text-gray-500">
          {total} {total === 1 ? "item" : "items"}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder="Search by name"
          aria-label="Search concessions"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 sm:w-60"
        />

        <select
          value={category}
          onChange={(e) => onCategoryChange?.(e.target.value)}
          aria-label="Filter by category"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All categories</option>
          {CONCESSION_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onAdd}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Add concession
        </button>
      </div>
    </div>
  );
}