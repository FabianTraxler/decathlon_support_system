import { useEffect, useState } from "react";
import { Discipline, StartingOrder } from "../lib/interfaces";
import { convert_date_to_time } from "../lib/parsing";
import { DisciplineEditButton } from "../admin/group_overview/disciplines/discipline_edit";
import Title_Footer_Layout from "./subpage_layout";
import { LoadingAnimation } from "../lib/loading";

export default function Timetable({ group_name }: { group_name: string }) {
    const [disciplines, setDisciplines] = useState<Map<string, Discipline[]>>(new Map());
    const [selectedDay, setSelectedDay] = useState("");

    const days = [
        ["day 1", "Samstag"],
        ["day 2", "Sonntag"]
    ]

    useEffect(() => {
        let api_url = `/api/disciplines?name=${group_name}`

        fetch(api_url)
            .then(res => {
                if (res.ok) {
                    return res.json()
                } else {
                    throw new Error(`Network response was not ok: ${res.status} - ${res.statusText}`);
                }
            })
            .then(res => {
                let disciplines = res as Discipline[]
                let day1: Discipline[] = []
                let day2: Discipline[] = []

                let first_day = new Date(process.env.START_DATE || "").getUTCDay();

                disciplines.forEach(discipline => {
                    let discipline_start_day = new Date(discipline.start_time).getUTCDay();
                    if (discipline_start_day == first_day) {
                        day1.push(discipline)
                    } else {
                        day2.push(discipline)
                    }
                });
                let all_disciplines = new Map();
                all_disciplines.set("day 1", day1);
                all_disciplines.set("day 2", day2)
                setDisciplines(all_disciplines)
            })
            .catch((e) => {
                console.error(e)
                setDisciplines(new Map())
            })
    }, [group_name])

    const update_discipline = function (day_id: string, discipline_index: number, new_discipline: Discipline) {

        let day_disciplines = disciplines.get(day_id);
        if (day_disciplines) {
            day_disciplines[discipline_index] = new_discipline
            let new_disciplines = new Map(disciplines);
            new_disciplines.set(day_id, day_disciplines);
            setDisciplines(new_disciplines)
        } else {
            console.error("Error updating discipline starting order")
        }

    }

    const change_selected_date = function(day_id: string) {
        if (day_id == selectedDay) {
            setSelectedDay("")
        } else {
            setSelectedDay(day_id)
        }
    }


    if (disciplines.size == 0) {
        return (
            <Title_Footer_Layout title="Aktuelle Disciplin">
                <div className="flex justify-center items-center h-full w-full"><LoadingAnimation></LoadingAnimation></div>
            </Title_Footer_Layout>
        )
    } else {
        return (
            <Title_Footer_Layout title="Zeitplan">
                <div>
                    {
                        days.map(([day_id, name]) => {
                            if (disciplines.get(day_id)?.length == 0) {
                                return null
                            }

                            return (
                                <div key={day_id} className="border p-1 mt-4 sm:mt-8 shadow-md rounded-md" >
                                    <div className={"flex justify-between text-2xl items-center m-2 hover:cursor-pointer" + (selectedDay == day_id && " font-bold")}
                                        onClick={() => change_selected_date(day_id)}
                                    >
                                        <span>{name}</span>
                                        {
                                            (disciplines.has(day_id) && selectedDay == day_id) &&
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
                                                stroke="currentColor"
                                                className="h-6 w-6">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        }
                                        {
                                            (disciplines.has(day_id) && selectedDay != day_id) &&
                                            <div className="text-center">&gt;</div>
                                        }

                                    </div>
                                    {(disciplines.has(day_id) && selectedDay == day_id) &&
                                        <div className=" max-w-[100vw]">
                                            <table className="table-auto border-collapse w-full">
                                                <thead>
                                                    <tr>
                                                        <th className="border border-slate-600 p-1 pl-2 pr-2">#</th>
                                                        <th className="border border-slate-600 p-1 pl-2 pr-2">Name</th>
                                                        <th className="border border-slate-600 p-1 pl-2 pr-2">Ort</th>
                                                        <th className="border border-slate-600 p-1 pl-2 pr-2">Zeit</th>
                                                        <th className="border border-slate-600 p-1 pl-2 pr-2"></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {disciplines.get(day_id)?.map((discipline, i) => {
                                                        return <tr key={discipline.name} className={"" + (discipline.state == "Finished" && "bg-slate-400")}>
                                                            <td className='border border-slate-800 p-1 sm:p-3 pt-4 sm:pt-6 pb-4 sm:pb-6 pl-2 pr-2 text-center'>{i + 1}.</td>
                                                            <td className='border border-slate-800 p-1 sm:p-3 pt-4 sm:pt-6 pb-4 sm:pb-6 pl-2 pr-2 text-center font-bold'>{discipline.name.replace("Stabhochsprung", "Stabhoch")}</td>
                                                            <td className='border border-slate-800 p-1 sm:p-3 pt-4 sm:pt-6 pb-4 sm:pb-6 pl-2 pr-2 text-center'>{discipline.location}</td>
                                                            <td className='border border-slate-800 p-1 sm:p-3 pt-4 sm:pt-6 pb-4 sm:pb-6 pl-2 pr-2 text-center'>{convert_date_to_time(discipline.start_time)}</td>
                                                            <DisciplineEditButton group_name={group_name} discipline={discipline} group_view={true} update_discipline={(discipline) => update_discipline(day_id, i, discipline)}>
                                                                <span className='bg-transparent w-full text-center'>&#9998;</span>
                                                            </DisciplineEditButton>
                                                        </tr>
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    }
                                </div>
                            )
                        })
                    }
                </div>
            </Title_Footer_Layout>
        )
    }
}