"use client";

import { useActionState ,useState} from "react";
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
    stock?: number | null;
    version?: number;
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
const [idempotencyKey] = useState(() => crypto.randomUUID());

  return (
    <form action={formAction} className="space-y-4 max-w-md">
      {initial?.version !== undefined && (
      <input type="hidden" name="version" value={initial.version} />
    )}
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
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
      <input
        name="stock"
        type="number"
        min={0}
        step={1}
        defaultValue={v?.stock ?? initial?.stock ?? ""}
        placeholder="المخزون (اتركه فاضي لو غير محدود)"
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