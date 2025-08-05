import { useState } from "react";
import Footer from "./footer";
import Title from "./title";
import { discipline_mapping } from "../lib/config";
import { PopUp } from "../lib/achievement_edit/popup";
import {Notes} from "./notes";
import { useSearchParams } from "next/navigation";

export default function Title_Footer_Layout({ title, children }: { title: string, children: React.ReactNode }) {
    var show_notes = title == "Notizen" ? false : true;
    const searchParams = useSearchParams();
    const groupName = searchParams.get("group") ?? "";

    const [showNotesPopup, setShowNotesPopup] = useState(false);

    return (
        <div className="grid grid-rows-10 h-[92%] w-full p-2 sm:p-8">
            <div className="flex items-center row-span-1">
                <Title title={title}></Title>
            </div>
            <div className="row-span-8 sm:row-span-9 flex flex-col items-top justify-top pb-4 smallPhone:overflow-scroll">
                {children}
            </div>
            <Footer show_notes={show_notes ? () => setShowNotesPopup(true): undefined}></Footer>
            {showNotesPopup && 
                <PopUp onClose={() => setShowNotesPopup(false)} title="Notizen">
                    <Notes page={title} group_name={groupName}></Notes>
                </PopUp> 
            }
        </div>
    )
}