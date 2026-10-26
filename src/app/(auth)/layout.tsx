import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Link href="/" className="font-bold text-xl mb-6">
        المتجر
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}