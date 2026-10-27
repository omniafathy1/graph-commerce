import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./useToast";

type CartData = { items: any[]; count: number };

export function useAddToCart() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (productId: string) => {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (res.status === 401) throw new Error("UNAUTHORIZED");
      if (!res.ok) throw new Error("فشلت الإضافة");
      return res.json();
    },

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });

      const previous = queryClient.getQueryData<CartData>(["cart"]);

      queryClient.setQueryData<CartData>(["cart"], (old) =>
        old ? { ...old, count: old.count + 1 } : old
      );

      return { previous };
    },
       onSuccess: () => {
      toast.success("تمت الإضافة للعربة ✓");
    },

    onError: (_err, _productId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["cart"], context.previous);
      }

      toast.error(
      _err.message === "UNAUTHORIZED" ? "سجّل دخول الأول" : _err.message
      );
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}