import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (idempotencyKey: string) => {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}