"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="p-8 text-center">
      <h1 className="text-2xl font-bold mb-2">حصل خطأ غير متوقع</h1>
      <p className="text-gray-600 mb-4">
        جرب تاني، ولو المشكلة مستمرة ارجع بعد شوية.
      </p>
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