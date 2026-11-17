import { Suspense } from "react";
import Header from "../Header";
import { getCurrentUser } from "../../lib/auth";
import { connection } from "next/server";

async function ShopShell({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  await connection();
  const user = await getCurrentUser();

  return (
    <>
      <Header user={user} />
      {children}
      {modal}
    </>
  );
}

export default function ShopLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <Suspense fallback={<p className="p-8 text-gray-500">جاري التحميل...</p>}>
      <ShopShell modal={modal}>{children}</ShopShell>
    </Suspense>
  );
}
