import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const path = req.nextUrl.pathname;
    const isAuth = !!req.nextauth.token;

    // Allow access to home page for both authenticated and unauthenticated users
    if (path === "/") {
      return NextResponse.next();
    }

    // Redirect unauthenticated users to home page for protected routes
    if ((path.startsWith("/dashboard") || path.startsWith("/expenses") || path.startsWith("/reports")) && !isAuth) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        if (path === "/") return true; // Always allow access to home page
        return !!token; // Require auth for other routes
      },
    },
  }
);

export const config = {
  matcher: ["/", "/dashboard/:path*", "/expenses/:path*", "/reports/:path*"],
};