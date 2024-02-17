import Image from "next/image";
import Title from "./title";

export default function Field() {
    return (
        <div>
            <Title title="Platzübersicht"></Title>
            <Image
                src="/images/Platz_klein.jpg"
                width={200}
                height={800}
                alt="Sportplatz Übersicht"
            ></Image>
        </div>
    ) 
}