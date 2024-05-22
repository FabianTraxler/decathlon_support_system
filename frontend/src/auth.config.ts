import type { NextAuthConfig, User } from 'next-auth';
import { SessionUser } from './app/lib/user_auth';
 
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const user: SessionUser | undefined = auth?.user as SessionUser
      if (user) {
        if (user.name == nextUrl.pathname.replace("/", "")) {
          return true;
        } else {
          if(user.name == "group") {
            let url = `/group?group=${user.email}`
            return Response.redirect(new URL(url, nextUrl));
          } else if(user.name == "register") {
            return Response.redirect(new URL('/register', nextUrl));
          } else if(user.name == "admin") {
            return Response.redirect(new URL('/admin', nextUrl));
          } else if(user.name == "timing") {
            return Response.redirect(new URL('/timing', nextUrl));
          } else {
            return false
          }
        }
      } else {
        return false;
      }
    }
  },  
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;