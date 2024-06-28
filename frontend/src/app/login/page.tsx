"use client";
import { authenticate } from '@/app/lib/user_auth';
import LoginForm from "./login_form";

export default function Login() {
    async function authenticate_fn(formData: FormData): Promise<string | undefined>{
        return authenticate(formData);
    }

    return (
        <LoginForm authenticate_fn={authenticate_fn}></LoginForm>
    )
}