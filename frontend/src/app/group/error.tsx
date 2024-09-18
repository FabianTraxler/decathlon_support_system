'use client' // Error boundaries must be Client Components

import { useEffect, useState } from 'react'
import { PopUp } from '../lib/achievement_edit/popup'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const [showError, setShowError] = useState(false)
    const [connection, setConnection] = useState(false)

    const try_connection = function () {
        fetch("/api/status")
            .then(res => {
                if (res.ok) {
                    setConnection(true)
                } else {
                    setConnection(false)
                }
            })
            .catch((e) => {
                setConnection(false)
            })
    }

    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error)

        const state_interval = setInterval(try_connection, 500)
        return () => clearInterval(state_interval);
    }, [error])

    return (
        <div className='h-screen w-screen flex items-center justify-center'>
            <div className='max-w-[80%] border rounded-md shadow-md p-3 bg-slate-300'>
                <div className='text-center text-red-600 font-bold text-xl'>Fehler!</div>

                <div className='font-bold text-center'>Letzten Wert und alle weiteren Werte auf Papier mitschreiben!</div>
                <div className='text-center m-2'>Bitte den Fehler notieren und im Büro melden. Wenn Verbindung wieder vorhanden ist, sollte die App wieder funktionieren.</div>

                <div className='flex flex-col items-center justify-center m-2'>
                    <button
                        className={'border rounded-md shadow-md shadow-black p-2  m-2 ' + (connection ? "bg-stw_green" : "bg-stw_orange") }
                        onClick={
                            // Attempt to recover by trying to re-render the segment
                            () => reset()
                        }
                    >
                        Zurück zur Startseite
                    </button>
                    <button
                        className='border rounded-md shadow-md shadow-black p-2 m-4'
                        onClick={
                            // Attempt to recover by trying to re-render the segment
                            () => setShowError(true)
                        }
                    >
                        Fehler anzeigen
                    </button>
                    {showError &&
                        <PopUp title='Fehlermeldung' onClose={() => setShowError(false)}>
                            <div className='p-2'>{error.message}</div>
                        </PopUp>
                    }

                    {connection ?
                        <div className='text-green-700'>
                            Verbindung wieder vorhanden
                        </div>
                        :
                        <div className='text-red-700'>
                            Verbindung weiterhin fehlend
                        </div>
                    }
                </div>
            </div>

        </div>
    )
}