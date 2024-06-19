"use client";
import { authenticate } from '@/app/lib/user_auth';
import LoginForm from "./login_form";

export default function Login() {
    async function authenticate_fn(prevState: string | undefined, formData: FormData): Promise<"Invalid credentials." | undefined>{
        return authenticate(prevState, formData)
    }

    return (
        <LoginForm authenticate_fn={authenticate_fn}></LoginForm>
    )
}