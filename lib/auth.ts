import { cookies } from "next/headers";
import { getIronSession, type IronSession, type SessionOptions } from "iron-session";

export interface SessionData {
  isLoggedIn: boolean;
}

export const sessionOptions: SessionOptions = {
  cookieName: "studioforge_session",
  password: process.env.SESSION_SECRET ?? "",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  if (session.isLoggedIn === undefined) {
    session.isLoggedIn = false;
  }
  return session;
}

export async function login(password: string): Promise<boolean> {
  if (!process.env.ADMIN_PASSWORD) {
    throw new Error("ADMIN_PASSWORD is not configured");
  }
  if (password !== process.env.ADMIN_PASSWORD) {
    return false;
  }
  const session = await getSession();
  session.isLoggedIn = true;
  await session.save();
  return true;
}

export async function logout(): Promise<void> {
  const session = await getSession();
  session.destroy();
}
