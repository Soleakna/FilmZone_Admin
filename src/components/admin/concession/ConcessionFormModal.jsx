
import { useEffect, useState } from "react";

// Match these values to the category enum in your backend.
export const CONCESSION_CATEGORIES = ["FOOD", "DRINK", "SNACK", "COMBO"];

const EMPTY_FORM = {
  name: "",
  description: "",
  category: CONCESSION_CATEGORIES[0],
  price: "",
  imageUrl: "",
};

export default function ConcessionFormModal({
  isOpen,
  onClose,
  onSubmit,
  concession = null, // pass an item to edit, null to create
  isSubmitting = false,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const isEditing = Boolean(concession);

  // Fill the form when opening (edit) or reset it (create)
  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    setForm(
      concession
        ? {
            name: concession.name ?? "",
            description: concession.description ?? "",
            category: concession.category ?? CONCESSION_CATEGORIES[0],
            price: concession.price ?? "",
            imageUrl: concession.imageUrl ?? "",
          }
        : EMPTY_FORM
    );
  }, [isOpen, concession]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Name is required.";
    if (!form.category) next.category = "Choose a category.";
    if (form.price === "" || Number(form.price) < 0) {
      next.price = "Enter a price of 0 or more.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      ...(isEditing && { uuid: concession.uuid }),
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      price: Number(form.price),
      imageUrl: form.imageUrl.trim(),
    });
  };

  const inputClass = (field) =>
    `mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 ${
      errors[field] ? "border-red-500" : "border-gray-300"
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="concession-form-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl"
      >
        <form onSubmit={handleSubmit} noValidate>
          <div className="border-b border-gray-200 px-6 py-4">
            <h2
              id="concession-form-title"
              className="text-lg font-semibold text-gray-900"
            >
              {isEditing ? "Edit concession" : "Add concession"}
            </h2>
          </div>

          <div className="space-y-4 px-6 py-5">
            <div>
              <label htmlFor="name" className="text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                className={inputClass("name")}
                placeholder="Large popcorn"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="description"
                className="text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={form.description}
                onChange={handleChange}
                className={inputClass("description")}
                placeholder="Freshly popped, lightly salted"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="category"
                  className="text-sm font-medium text-gray-700"
                >
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className={inputClass("category")}
                >
                  {CONCESSION_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-xs text-red-600">{errors.category}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="price"
                  className="text-sm font-medium text-gray-700"
                >
                  Price (USD)
                </label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  className={inputClass("price")}
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="mt-1 text-xs text-red-600">{errors.price}</p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="imageUrl"
                className="text-sm font-medium text-gray-700"
              >
                Image URL
              </label>
              <input
                id="imageUrl"
                name="imageUrl"
                type="url"
                value={form.imageUrl}
                onChange={handleChange}
                className={inputClass("imageUrl")}
                placeholder="https://..."
              />
              {form.imageUrl && (
                <img
                  src={form.imageUrl}
                  alt="Preview"
                  className="mt-2 h-24 w-24 rounded-lg border border-gray-200 object-cover"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                  onLoad={(e) => (e.currentTarget.style.display = "block")}
                />
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting
                ? "Saving..."
                : isEditing
                ? "Save changes"
                : "Add concession"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}