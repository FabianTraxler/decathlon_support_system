import { useEffect, useState } from "react";
import { Discipline } from "@/app/lib/interfaces";
import Title_Footer_Layout from "../subpage_layout";
import { german_discipline_states } from "@/app/lib/config";
import TimeDiscipline from "./time_discipline";
import { convert_date } from "@/app/lib/parsing";
import DistanceDiscipline from "./distance_discipline";
import HeightDiscipline from "./height/height_discipline";
import { LoadingAnimation } from "@/app/lib/loading";

export default function Disciplines({ group_name }: { group_name: string }) {
    const [discipline, setDiscipline] = useState<Discipline>();

    useEffect(() => {
        let api_url = `/api/current_discipline?name=${group_name}`

        fetch(api_url)
            .then(res => {
                if (res.ok) {
                    return res.json()
                } else {
                    throw new Error(`Network response was not ok: ${res.status} - ${res.statusText}`);
                }
            })
            .then(res => {
                setDiscipline(res)
            })
            .catch((e) => {
                console.error(e)
                throw e
            })
    }, [group_name])


    if (!discipline) {
        return (
            <Title_Footer_Layout title="Aktuelle Disciplin">
                <div className="flex justify-center items-center h-full w-full"><LoadingAnimation></LoadingAnimation></div>
            </Title_Footer_Layout>
        )
    } else {
        return (
            <Title_Footer_Layout title={discipline.name}>
                {
                    (discipline.discipline_type == "Time" || discipline.discipline_type == "Track") &&
                    <TimeDiscipline discipline={discipline} group_name={group_name}></TimeDiscipline>
                }
                {
                    discipline.discipline_type == "Distance" &&
                    <DistanceDiscipline discipline={discipline} group_name={group_name}></DistanceDiscipline>
                }
                {
                    discipline.discipline_type == "Height" &&
                    <HeightDiscipline discipline={discipline} group_name={group_name}></HeightDiscipline>
                }
            </Title_Footer_Layout>
        )
    }
}


export function BeforeStartInfoBox({ discipline, start_discipline, ready, children }: { discipline: Discipline, start_discipline: () => void, ready: boolean, children?: React.ReactNode }) {
    return (
        <div className="w-full border rounded-md p-4 sm:p-8">
            <div className="font-bold text-center text-2xl sm:text-4xl">Info</div>
            <div className="grid grid-cols-2 text-lg sm:text-xl mt-4 sm:mt-12">
                <div className="w-fit mr-4">
                    <u>Ort:</u>
                </div>
                <div className="w-fit">
                    {discipline.location}
                </div>
            </div>
            <div className="grid grid-cols-2 text-lg sm:text-xl mt-4 sm:mt-12">
                <div className="w-fit mr-4">
                    <u>Geplante Startzeit:</u>
                </div>
                <div className="w-fit">
                    {convert_date(discipline.start_time)}
                </div>
            </div>
            <div className="grid grid-cols-2 text-lg sm:text-xl mt-4 sm:mt-12">
                <div className="w-fit mr-4">
                    <u>Status:</u>
                </div>
                <div className="w-fit">
                    {german_discipline_states.get(discipline.state)}
                </div>
            </div>

            <div className="text-2xl mt-8 sm:mt-14 justify-center flex ">
                <div
                    className={"border rounded-md  w-fit p-2 sm:p-4 hover:cursor-pointer active:bg-slate-500 active:shadow-none" +
                                (ready ? " bg-stw_green shadow-lg shadow-gray-800": " bg-slate-100 shadow-none")}
                    onClick={() => start_discipline()}
                >
                    Disiplin starten
                </div>
            </div>
            {children && children}
        </div>
    )
}


export function start_discipline(group_name: string, discipline: Discipline, callback_fn: (discipline: Discipline) => void) {
    let api_url = `/api/discipline_state?name=${group_name}`

    fetch(api_url, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            "name": discipline.name,
            "state": "Active"
        })
    })
        .then(res => {
            if (res.ok) {
                callback_fn({
                    ...discipline,
                    state: "Active"
                })
            } else {
                throw new Error(`Network response was not ok: ${res.status} - ${res.statusText}`);
            }
        })
        .catch((e) => {
            console.error(e)
            throw e
        })
}

export function finish_discipline(group_name: string, discipline: Discipline, callback_fn: (discipline: Discipline) => void) {
    let api_url = `/api/discipline_state?name=${group_name}`

    fetch(api_url, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            "name": discipline.name,
            "state": "Finished"
        })
    })
        .then(res => {
            if (res.ok) {
                callback_fn({
                    ...discipline,
                    state: "Finished"
                })
            } else {
                throw new Error(`Network response was not ok: ${res.status} - ${res.statusText}`);
            }
        })
        .catch((e) => {
            console.error(e)
            throw e
        })
}