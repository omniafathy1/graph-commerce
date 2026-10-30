"use client";

import { useRouter } from "next/navigation";
import { useCheckout } from "../../../hooks/useCheckout";

export default function CheckoutButton() {
  const router = useRouter();
  const { mutate, isPending, error } = useCheckout();

  function handleCheckout() {
    mutate(undefined, {
      onSuccess: (data) => {
        router.push(`/order-confirmation?orderId=${data.orderId}`);
      },
    });
  }

  return (
    <div>
      {error && (
        <p className="text-red-500 text-sm mb-2">{(error as Error).message}</p>
      )}
      <button
        onClick={handleCheckout}
        disabled={isPending}
        className="w-full bg-black text-white py-3 rounded-lg mt-4 disabled:opacity-50"
      >
        {isPending ? "جاري التنفيذ..." : "إتمام الطلب"}
      </button>
    </div>
  );
}