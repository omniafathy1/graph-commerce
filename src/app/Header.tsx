"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useCart } from "../hooks/useCart";
import { logoutAction } from "../app/actions/auth";

export default function Header({
  user,
}: {
  user: { customerId: string; email: string } | null;
}) {
  const queryClient = useQueryClient();
  const { data } = useCart();
  const cartCount = data?.count ?? 0;

  // لما اليوزر يتغير (دخول/خروج/حساب تاني) نجيب العربة من جديد
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["cart"] });
  }, [user?.customerId, queryClient]);

  return (
    <header className="flex justify-between items-center p-4 border-b">
      <Link href="/" className="font-bold text-lg">المتجر</Link>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link href="/orders" className="text-sm">طلباتي</Link>
            <span className="text-sm text-gray-600">{user.email}</span>
            <form action={logoutAction}>
              <button className="text-sm text-red-500">خروج</button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="text-sm">دخول</Link>
            <Link href="/signup" className="text-sm">حساب جديد</Link>
          </>
        )}
        <Link href="/cart" className="relative">
          🛒 العربة
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}