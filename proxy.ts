import { NextResponse, type NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);

  const isLoggedIn = session.isLoggedIn === true;
  const isLoginPage = request.nextUrl.pathname.startsWith("/login");

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/explore", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/external|api/jobs/stream).*)"],
};
