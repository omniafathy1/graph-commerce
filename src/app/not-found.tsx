import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-5xl font-bold mb-2">404</h1>
      <p className="text-gray-600 mb-4">الصفحة دي مش موجودة.</p>
      <Link href="/" className="text-blue-600 underline">
        الرئيسية
      </Link>
    </main>
  );
}