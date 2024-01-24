import Image from "next/image"
import Link from "next/link"
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="text-center">
        <div className="flex items-center justify-center w-full">
          <Image className="flex"
            src="./logo_stw.svg"
            width={200}
            height={200}
            alt="Logo-STW"
          ></Image>
        </div>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">Jedermannzehnkampf</h1>
        <p className="mt-6 text-base leading-7 text-gray-600">Bitte gehen Sie zu einer der drei verfügbaren Seiten.</p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link href="/group" className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
            Gruppeneingabe
          </Link>
          <Link href="/register" className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
            Anmeldung
          </Link>
          <Link href="/admin" className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
            Admin
          </Link>
        </div>
      </div>
    </main>
  )
}
