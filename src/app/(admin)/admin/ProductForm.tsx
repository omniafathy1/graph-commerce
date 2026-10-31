"use client";

import { useActionState } from "react";
import { ProductFormState } from "../../actions/product";

type Props = {
  categories: string[];
  action: (
    prev: ProductFormState,
    formData: FormData
  ) => Promise<ProductFormState>;
  initial?: {
    name: string;
    description: string;
    price: number;
    category: string;
  };
  submitLabel: string;
};

export default function ProductForm({
  categories,
  action,
  initial,
  submitLabel,
}: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const v = state?.values;

  return (
    <form action={formAction} className="space-y-4 max-w-md">
      <input
        name="name"
        defaultValue={v?.name ?? initial?.name}
        placeholder="اسم المنتج"
        maxLength={100}
        required
        className="w-full border rounded p-2"
      />
      <input
        name="price"
        type="number"
        min={1}
        step={1}
        defaultValue={v?.price ?? initial?.price}
        placeholder="السعر بالجنيه"
        required
        className="w-full border rounded p-2"
      />
      <textarea
        name="description"
        defaultValue={v?.description ?? initial?.description}
        placeholder="الوصف"
        rows={3}
        className="w-full border rounded p-2"
      />
      <select
        name="category"
        defaultValue={v?.category ?? initial?.category ?? ""}
        required
        className="w-full border rounded p-2"
      >
        <option value="" disabled>
          اختار التصنيف
        </option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {state?.error && <p className="text-red-500 text-sm">{state.error}</p>}

      <button
        disabled={pending}
        className="bg-black text-white px-6 py-2 rounded border disabled:opacity-50"
      >
        {pending ? "جاري الحفظ..." : submitLabel}
      </button>
    </form>
  );
}