import { redirect } from "next/navigation";
import { getCurrentUser, listSessions, readToken } from "../../../lib/auth";
import { describeUserAgent } from "../../../lib/userAgent";
import { logoutOthersAction, revokeSessionAction } from "../../actions/account";
import { logoutAllAction } from "../../actions/auth";
import { connection } from "next/server";
import { Suspense } from "react";

// المكون الفرعي لجلب وعرض الأجهزة
async function AccountContent() {
  await connection();
  const user = await getCurrentUser();
  const token = await readToken();
  if (!user || !token) redirect("/login");

  const sessions = await listSessions(user.customerId);

  return (
    <>
      <p className="mb-8 text-gray-700">{user.email}</p>

      <h2 className="mb-3 font-bold">الأجهزة المسجّلة ({sessions.length})</h2>

      <ul className="divide-y rounded-lg border">
        {sessions.map((s) => {
          const isCurrent = s.id === token.sid;
          return (
            <li key={s.id} className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="font-medium">
                  {describeUserAgent(s.userAgent)}
                  {isCurrent && (
                    <span className="mr-2 rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">
                      الجهاز الحالي
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-700">
                  بدأت: {new Date(s.createdAt).toLocaleString("ar-EG")}
                </p>
              </div>

              {!isCurrent && (
                <form action={revokeSessionAction}>
                  <input type="hidden" name="sessionId" value={s.id} />
                  <button className="text-sm text-red-700 underline">إنهاء</button>
                </form>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex flex-wrap gap-3">
        {sessions.length > 1 && (
          <form action={logoutOthersAction}>
            <button className="rounded border px-4 py-2 text-sm">
              تسجيل الخروج من الأجهزة الأخرى
            </button>
          </form>
        )}
        <form action={logoutAllAction}>
          <button className="rounded bg-black px-4 py-2 text-sm text-white">
            تسجيل الخروج من كل الأجهزة
          </button>
        </form>
      </div>
    </>
  );
}

// المكون الرئيسي للصفحة
export default function AccountPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <h1 className="mb-1 text-2xl font-bold">حسابي</h1>

      <Suspense fallback={<p className="mb-8 text-gray-700">جاري التحميل...</p>}>
        <AccountContent />
      </Suspense>
    </main>
  );
}