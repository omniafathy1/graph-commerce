"use client";

import { useActionState } from "react";
import { loginAction } from "../../actions/auth";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <main className="p-8 max-w-sm mx-auto">
      <h1 className="text-2xl font-bold mb-6">تسجيل الدخول</h1>
      <form action={formAction} className="space-y-4">
        <input
          name="email"
          type="email"
          placeholder="الإيميل"
          className="w-full border rounded p-2"
          required
        />
        <input
          name="password"
          type="password"
          placeholder="الباسورد"
          className="w-full border rounded p-2"
          required
        />
        {state?.error && <p className="text-red-500 text-sm">{state.error}</p>}
        <button
          disabled={pending}
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 disabled:opacity-50"
        >
          {pending ? "جاري الدخول..." : "دخول"}
        </button>
      </form>
    </main>
  );
}