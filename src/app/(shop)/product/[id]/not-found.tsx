import Link from "next/link";

export default function ProductNotFound() {
  return (
    <main className="p-8 text-center">
      <h1 className="text-2xl font-bold mb-2">المنتج ده مش موجود</h1>
      <p className="text-gray-600 mb-4">ممكن يكون اتمسح أو الرابط غلط.</p>
      <Link href="/" className="text-blue-600 underline">
        رجوع للمتجر
      </Link>
    </main>
  );
}