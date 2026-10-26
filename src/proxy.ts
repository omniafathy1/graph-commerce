import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED_PATHS = ["/cart", "/checkout", "/account", "/orders" , "/admin"];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isProtected = PROTECTED_PATHS.some((p) => path.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/cart/:path*", "/checkout/:path*", "/account/:path*" , "/orders/:path*" , "/admin/:path*"],
};