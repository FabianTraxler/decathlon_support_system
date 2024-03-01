import Image from "next/image";
import Title from "./title";

export default function Field() {
    return (
        <div className="h-full">
            <Title title="Platzübersicht"></Title>
            <div className="flex mt-12 w-screen items-center justify-center">
                <Image
                    src="/images/Platz_klein.jpg"
                    width={200}
                    height={800}
                    alt="Sportplatz Übersicht"
                    objectFit="contain"
                    className="w-full h-fit"
                ></Image>
            </div>

        </div>
    )
}