import type { NextAuthConfig } from "next-auth";
import { AUTH_ROUTES, PROTECTED_ROUTES } from "@/constants";

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;

      const isProtected = PROTECTED_ROUTES.some((route) =>
        pathname.startsWith(route)
      );
      const isAuthRoute = AUTH_ROUTES.some((route) =>
        pathname.startsWith(route)
      );

      if (isProtected && !isLoggedIn) {
        return false;
      }

      if (isAuthRoute && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }

      return true;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
