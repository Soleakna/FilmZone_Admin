
const CATEGORY_STYLES = {
  FOOD: "bg-amber-100 text-amber-800",
  DRINK: "bg-sky-100 text-sky-800",
  SNACK: "bg-emerald-100 text-emerald-800",
  COMBO: "bg-violet-100 text-violet-800",
};

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function ConcessionsTable({
  concessions = [],
  isLoading = false,
  onEdit,
  onDelete,
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-gray-600">
          <tr>
            <th className="px-4 py-3 font-medium">Item</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 text-right font-medium">Price</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {isLoading &&
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="px-4 py-4" colSpan={4}>
                  <div className="h-10 rounded bg-gray-100" />
                </td>
              </tr>
            ))}

          {!isLoading && concessions.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-12 text-center text-gray-500">
                No concessions found. Add one to get started.
              </td>
            </tr>
          )}

          {!isLoading &&
            concessions.map((item) => (
              <tr key={item.uuid} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-12 w-12 shrink-0 rounded-lg border border-gray-200 object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 shrink-0 rounded-lg bg-gray-100" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="max-w-xs truncate text-gray-500">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      CATEGORY_STYLES[item.category] ??
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {item.category}
                  </span>
                </td>

                <td className="px-4 py-3 text-right tabular-nums text-gray-900">
                  {priceFormatter.format(item.price ?? 0)}
                </td>

                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit?.(item)}
                      className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete?.(item)}
                      className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}