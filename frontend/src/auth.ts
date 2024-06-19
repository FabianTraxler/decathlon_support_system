"use server"
import NextAuth, { AuthError }  from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { SessionUser, get_role_and_group } from './app/lib/user_auth';

async function getSession(password: string): Promise<SessionUser> {
    if (!password){
        throw new AuthError("Password not given")
    }
    let session_info = await get_role_and_group(password).catch(e => console.log(e))
    if (session_info){
        return new SessionUser(session_info.role, session_info.group);
    }else {
        throw new AuthError("Password not found")
    }
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
                    const session =  await getSession(password).catch( e => {
                        throw e
                    });
                    return session;
                }
                throw new Error("Password in incorrect format")

            },
        }),],
});