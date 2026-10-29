"use client";

import { useRouter } from "next/navigation";
import { useAddToCart } from "../../../../hooks/useAddToCart";

export default function AddToCartButton({ id }: { id: string }) {
  const router = useRouter();
  const { mutate, isPending } = useAddToCart();

  function handleAdd() {
    mutate(id, {
      onError: (err: any) => {
        if (err.message === "UNAUTHORIZED") {
          router.push("/login");
        }
      },
    });
  }

  return (
    <button
      onClick={handleAdd}
      disabled={isPending}
      className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50"
    >
      {isPending ? "..." : "أضف للسلة"}
    </button>
  );
}