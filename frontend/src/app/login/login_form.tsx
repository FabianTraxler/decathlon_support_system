"use client";
import Image from "next/image";
import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useRef, useState } from "react";
import { LoadingAnimation } from "../lib/loading";

export default function LoginForm({ authenticate_fn }: { authenticate_fn: (formData: FormData) => Promise<string | undefined> }) {
    const [state, setState] = useState<{
        login_state: string;
        pdfFilled: boolean;
        payload: undefined | FormData;
    }>({ login_state: "", pdfFilled: false, payload: undefined })
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state.payload) {
            authenticate_fn(state.payload)
                .then((res) => {
                    if (!res) {
                        res = "logging_in"
                    }
                    setState({ login_state: res, pdfFilled: false, payload: undefined })
                }
                )
        }

    })

    const handleSubmit = function (payload: FormData) {
        if (formRef.current) {
            formRef.current.reset()
        }
        setState({ ...state, login_state: "loading", payload: payload })

    }

    const checkPWDfilled = function (e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.value) {
            setState({ ...state, pdfFilled: true })
        } else {
            setState({ ...state, pdfFilled: false })
        }
    }


    return (
        <div className="flex flex-col items-center w-full h-full">
            <div className="h-1/2 flex items-center">
                {(state.login_state == "loading" || state.login_state == "logging_in") ?
                    <div className="flex w-72 h-72 justify-center items-center">
                        <LoadingAnimation></LoadingAnimation>
                    </div>
                    :
                    <Image className="flex"
                        src="./logo_stw.svg"
                        width={200}
                        height={200}
                        alt="Logo-STW"
                    ></Image>
                }


            </div>

            <div className="h-1/2 flex items-start">
                <form ref={formRef} action={handleSubmit} className="flex flex-col items-center">
                    <input id="password" onChange={checkPWDfilled} name="password" type="password" className="text-2xl text-center bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Passwort" required></input>
                    {(state.login_state == "Invalid credentials." && !state.pdfFilled) ?
                        <button type="submit"
                            className={"mt-2 text-white hover:bg-stw_blue focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-xl w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800  bg-red-700"}>
                            Falsches Passwort</button>
                        :
                        <button type="submit"
                            className={"mt-2 text-white hover:bg-stw_blue focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-xl w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" +
                                (state.pdfFilled ? " bg-stw_green" : " bg-stw_orange")
                            }>Einloggen</button>
                    }

                </form>
            </div>

        </div>
    )
}