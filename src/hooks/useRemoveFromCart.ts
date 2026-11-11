// src/hooks/useRemoveFromCart.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./useToast";

type CartData = {
  items: { id: string; price: number; quantity: number }[];
  count: number;
};

export function useRemoveFromCart() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (productId: string) => {
      const res = await fetch("/api/cart/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) throw new Error("فشل الحذف");
      return res.json();
    },

    // شيل العنصر من الشاشة فورًا
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previous = queryClient.getQueryData<CartData>(["cart"]);

      queryClient.setQueryData<CartData>(["cart"], (old) => {
        if (!old) return old;
        const removed = old.items.find((i) => i.id === productId);
        return {
          items: old.items.filter((i) => i.id !== productId),
          count: old.count - (removed?.quantity ?? 0),
        };
      });

      return { previous };
    },

    onError: (_err, _productId, context) => {
      if (context?.previous) queryClient.setQueryData(["cart"], context.previous);
      toast.error("مقدرناش نحذف المنتج، حاول تاني");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}