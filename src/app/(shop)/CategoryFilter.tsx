import Link from "next/link";

export default function CategoryFilter({
  categories,
  active,
}: {
  categories: string[];
  active: string | null;
}) {
  const base = "px-4 py-1.5 rounded-full border text-sm";
  const on = "bg-black text-white border-black";

  return (
    <nav className="flex flex-wrap gap-2 mb-6">
      <Link href="/" className={`${base} ${!active ? on : "hover:bg-gray-100"}`}>
        الكل
      </Link>
      {categories.map((name) => (
        <Link
          key={name}
          href={`/?category=${encodeURIComponent(name)}`}
          className={`${base} ${active === name ? on : "hover:bg-gray-100"}`}
        >
          {name}
        </Link>
      ))}
    </nav>
  );
}