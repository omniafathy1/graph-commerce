"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="p-8 text-center">
      <h1 className="text-xl font-bold mb-2">حصل خطأ في تحميل الصفحة</h1>
      {process.env.NODE_ENV === "development" && (
        <p className="text-xs text-red-500 mb-4">{error.message}</p>
      )}
      <button
        onClick={reset}
        className="bg-black text-white px-6 py-2 rounded-lg"
      >
        حاول تاني
      </button>
    </main>
  );
}