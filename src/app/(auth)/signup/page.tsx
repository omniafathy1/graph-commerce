"use client";

import { useActionState } from "react";
import { signupAction } from "../../actions/auth";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signupAction, undefined);

  return (
    <main className="p-8 max-w-sm mx-auto">
      <h1 className="text-2xl font-bold mb-6">إنشاء حساب</h1>
      <form action={formAction} className="space-y-4">
        <input
          name="name"
          type="text"
          placeholder="الاسم"
          className="w-full border rounded p-2"
          required
        />
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
          placeholder="الباسورد (6 حروف على الأقل)"
          className="w-full border rounded p-2"
          required
        />
        {state?.error && <p className="text-red-500 text-sm">{state.error}</p>}
        <button
          disabled={pending}
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 disabled:opacity-50"
        >
          {pending ? "جاري الإنشاء..." : "إنشاء حساب"}
        </button>
      </form>
    </main>
  );
}