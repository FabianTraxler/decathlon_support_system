import { useState } from "react";
import Footer from "./footer";
import Title from "./title";
import { discipline_mapping } from "../lib/config";
import { PopUp } from "../lib/achievement_edit/popup";
import {Notes} from "./notes";
import { useSearchParams } from "next/navigation";
import { HeightSkipPopupContent } from "./discipline/height/height_skip_popup";

export default function Title_Footer_Layout({ title, enableHeightSkip = false, children }: { title: string, enableHeightSkip?: boolean, children: React.ReactNode }) {
    var show_notes = title == "Notizen" ? false : true;
    const searchParams = useSearchParams();
    const groupName = searchParams.get("group") ?? "";

    const [showNotesPopup, setShowNotesPopup] = useState(false);
    const [showHeightSkipPopup, setShowHeightSkipPopup] = useState(false);

    return (
        <div className="grid grid-rows-10 h-[92%] w-full p-2 sm:p-8">
            <div className="flex items-center row-span-1">
                <Title title={title}></Title>
            </div>
            <div className="row-span-8 sm:row-span-9 flex flex-col items-top justify-top pb-4 smallPhone:overflow-scroll">
                {children}
            </div>
            <Footer show_notes={show_notes ? () => setShowNotesPopup(true): undefined} show_height_skip={enableHeightSkip ? () => setShowHeightSkipPopup(true) : undefined}></Footer>
            {showNotesPopup && 
                <PopUp onClose={() => setShowNotesPopup(false)} title="Notizen">
                    <Notes page={title} group_name={groupName}></Notes>
                </PopUp> 
            }
            {showHeightSkipPopup &&
                <PopUp onClose={() => setShowHeightSkipPopup(false)} title="Höhe überspringen">
                    <HeightSkipPopupContent group_name={groupName} discipline_name={title} close={() => setShowHeightSkipPopup(false)}></HeightSkipPopupContent>
                </PopUp>
            }
        </div>
    )
}