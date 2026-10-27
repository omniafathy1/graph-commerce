import { useQuery } from "@tanstack/react-query";

type CartItem = { id: string; name: string; price: number; quantity: number };
type CartData = { items: CartItem[]; count: number };

export function useCart() {
  return useQuery<CartData>({
    queryKey: ["cart"],
    queryFn: async () => {
      const res = await fetch("/api/cart");
      return res.json();
    },
  });
}