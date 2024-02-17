import { useEffect, useState } from "react";
import Title from "../title";
import { Athlete, fetch_group_athletes } from "@/app/lib/athlete_fetching";
import Footer from "../footer";
import AchievementDisplay from "./achievement";

export default function Athletes({ group_name }: { group_name: string }) {
    const [athletes, setAthletes] = useState<Athlete[]>([])

    useEffect(() => {
        fetch_group_athletes(group_name, setAthletes)
    }, [group_name])

    return (
        <div className="grid grid-rows-10 h-[99%]">
            <div className="flex items-center">
                <Title title="Athleten:innen"></Title>
            </div>
            <div className="row-span-1 flex items-center justify-center">
                <input placeholder="Suche ..."
                    className="p-2 text-xl border rounded shadow-sm"
                ></input>
            </div>
            <div className="grid row-span-6 justify-between overflow-scroll overscroll-contain m-1 mt-3 border rounded-md">
                {
                    athletes.map(athlete => {
                        return (
                            <AthleteOverview key={athlete.starting_number} athlete={athlete}></AthleteOverview>
                        )
                    })
                }
            </div>
            <div className="flex items-center">
                <Footer></Footer>
            </div>
        </div>
    )
}

function AthleteOverview({ athlete }: { athlete: Athlete }) {
    const [showAchievements, setShowAchievements] = useState(false);

    const full_name = athlete.name + "_" + athlete.surname;

    return (
        <div className="odd:bg-slate-300 odd:bg-opacity-30">
            <div className="grid grid-cols-4 auto-cols-fr text-lg border-b-2 pb-2 pt-2" onClick={() => setShowAchievements(!showAchievements)}>
                <div className="text-center font-bold">{athlete.starting_number}</div>
                <div className="text-left pr-2">{athlete.name}</div>
                <div className="text-left pl-2 pr-2">{athlete.surname}</div>
                <div className="text-center">&gt;</div>
            </div>
            <div className={(showAchievements ? "p-2 bg-slate-100" : "")}>
                {showAchievements &&
                    Object.entries(athlete.achievements).map(([name, achievement]) => {
                        return (
                            <AchievementDisplay key={full_name} name={name} achievement={achievement} athlete_name={full_name}></AchievementDisplay>
                        )
                    })
                }
            </div>


        </div>
    )
}
