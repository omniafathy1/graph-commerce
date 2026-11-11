import { NextResponse } from "next/server";
import { runQuery } from "../../../../lib/db";
import { getCurrentUser } from "../../../../lib/auth";

export async function DELETE(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "لازم تسجل دخول الأول" },
      { status: 401 }
    );
  }

  let productId: unknown;
  try {
    ({ productId } = await request.json());
  } catch {
    return NextResponse.json(
      { success: false, error: "طلب غير صالح" },
      { status: 400 }
    );
  }

  if (typeof productId !== "string" || !productId) {
    return NextResponse.json(
      { success: false, error: "طلب غير صالح" },
      { status: 400 }
    );
  }

  try {
    // الحذف idempotent: لو العنصر مش موجود، النتيجة نفسها (مش خطأ)
    await runQuery(
      `MATCH (c:Customer)-[r:HAS_IN_CART]->(p:Product)
       WHERE elementId(c) = $customerId AND elementId(p) = $productId
       DELETE r`,
      { customerId: user.customerId, productId }
    );
  } catch (error) {
    console.error("Cart delete error:", error);
    return NextResponse.json(
      { success: false, error: "حصل خطأ، حاول تاني" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}