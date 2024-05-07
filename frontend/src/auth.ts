"use server"
import NextAuth  from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { SessionUser } from './app/lib/user_auth';

function getSession(password: string): SessionUser | null {
    return new SessionUser(password);
}

export const { auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ password: z.string().min(2) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { password } = parsedCredentials.data;
                    const session =  getSession(password);
                    if (!session) return null;
                    return session;
                }
                return null;
            },
        }),],
});