import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data;
    },

    onSuccess: () => {
      // العربة اتفضّت في الداتابيز، يبقى نمسح النسخة المخزنة عندنا كمان
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}