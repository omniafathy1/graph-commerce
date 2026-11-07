"use client";

import { useRouter } from "next/navigation";
import { useCheckout } from "../../../hooks/useCheckout";
import { useRef } from "react";

export default function CheckoutButton() {
  const router = useRouter();
  const { mutate, isPending, error } = useCheckout();

    const keyRef = useRef<string | null>(null);

  function handleCheckout() {
    if (!keyRef.current) keyRef.current = crypto.randomUUID();

    mutate(keyRef.current, {
      onSuccess: (data) => {
        keyRef.current = null;
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