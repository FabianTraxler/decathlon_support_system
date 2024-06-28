"use client";
import Image from "next/image";
import { useFormState, useFormStatus } from 'react-dom';
import { useRef, useState } from "react";

export default function LoginForm({authenticate_fn}: {authenticate_fn: (prevState: string | undefined, formData: FormData) => Promise<"Invalid credentials." | undefined>}) {
    const [pwdFilled, setPwdFilled] = useState(false)
    const formRef = useRef<HTMLFormElement>(null);

    const handleSubmit = function (
        prevState: string | undefined,
        formData: FormData,
    ) {
        if(formRef.current){
            formRef.current.reset()
        }
        setPwdFilled(false)
        return authenticate_fn(prevState, formData)
    }

    const [state, dispatch] = useFormState(handleSubmit, "");

    const checkPWDfilled = function (e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.value) {
            setPwdFilled(true)
        } else {
            setPwdFilled(false)
        }
    }


    return (
        <div className="flex flex-col items-center w-full h-full">
            <div className="h-1/2 flex items-center">
                <Image className="flex"
                    src="./logo_stw.svg"
                    width={200}
                    height={200}
                    alt="Logo-STW"
                ></Image>
            </div>

            <div className="h-1/2 flex items-start">
                <form ref={formRef} action={dispatch} className="flex flex-col items-center">
                    <input id="password" onChange={checkPWDfilled} name="password" type="password" className="text-2xl text-center bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Passwort" required></input>
                    {(state == "Invalid credentials." && !pwdFilled) ?
                        <button type="submit"
                            className={"mt-2 text-white hover:bg-stw_blue focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-xl w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800  bg-red-700"}>
                            Falsches Passwort</button>
                        :
                        <button type="submit"
                            className={"mt-2 text-white hover:bg-stw_blue focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-xl w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" +
                                (pwdFilled ? " bg-stw_green" : " bg-stw_orange")
                            }>Einloggen</button>
                    }

                </form>
            </div>



        </div>
    )
}