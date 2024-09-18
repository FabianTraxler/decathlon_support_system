import { useState, useEffect } from "react";
import Title_Footer_Layout from "./subpage_layout";
import { discipline_rules, general_rules } from "../lib/discipline_rules";
import Image from "next/image";
import { Discipline } from "../lib/interfaces";
import { LoadingAnimation } from "../lib/loading";
import { PopUp } from "../lib/achievement_edit/popup";
import { useAsyncError } from "../lib/asyncError";

const general_info: Discipline = {
    name: "general",
    location: "",
    start_time: "",
    state: "",
    starting_order: "",
    discipline_type: ""
}

export default function Rules({ group_name }: { group_name: string }) {
    const [selectedDiscipline, setSelectedDiscipline] = useState<Discipline | undefined>();
    const [groupDisciplines, setGroupDisciplines] = useState<Discipline[]>([]);
    const throwError = useAsyncError();

    useEffect(() => {
        let api_url = `/api/disciplines?name=${group_name}`

        fetch(api_url)
            .then(res => {
                if (res.ok) {
                    return res.json()
                } else {
                    throwError(new Error(`Network response was not ok: ${res.status} - ${res.statusText}`));
                }
            })
            .then(res => {
                let disciplines = res as Discipline[]
                setGroupDisciplines(disciplines)
            })
            .catch((e) => {
                throwError(e);
                setGroupDisciplines([])
            })
    }, [group_name])

    if (groupDisciplines.length == 0) {
        <LoadingAnimation></LoadingAnimation>
    }

    return (
        <Title_Footer_Layout title="Informationen">
            {
                selectedDiscipline ?
                    <div>
                        <DisciplineRuleOverview discipline={selectedDiscipline} onClose={() => setSelectedDiscipline(undefined)}></DisciplineRuleOverview>
                    </div>
                    :
                    <div className="h-full grid grid-rows-10 w-full">
                        <div className="row-span-1 h-full w-full flex items-center justify-center rounded-md shadow-md shadow-slate-700" onClick={() => setSelectedDiscipline(general_info)}>
                            <div className="text-center text-lg font-bold m-2 ">Generelle Infos</div>
                        </div>
                        <div className="row-span-9  pt-3 pb-3 overflow-scroll">
                            <div className="grid grid-cols-2 grid-rows-5">
                                {
                                    groupDisciplines.map((discipline) => {
                                        return (
                                            <div
                                                key={discipline.name}
                                                className="flex flex-col justify-center items-center p-3 m-2 rounded-md shadow-md shadow-slate-700"
                                                onClick={() => setSelectedDiscipline(discipline)}
                                            >
                                                <Image
                                                    src={"images/discipline_graphics/" + discipline_rules[discipline.name]["image"]}
                                                    alt={discipline.name}
                                                    className="w-10 h-10 mb-2"
                                                    width={10}
                                                    height={10}
                                                ></Image>
                                                <div className="text-center break-words w-full p-1">{discipline.name}</div>
                                            </div>
                                        )
                                    })
                                }
                            </div>
                        </div>
                    </div>
            }
        </Title_Footer_Layout>
    )
}

function DisciplineRuleOverview({ discipline, onClose }: { discipline: Discipline, onClose: () => void }) {
    if (discipline.name == "general") {
        return (
            <PopUp onClose={onClose} title={"Generelle Infos"}>
                <div className="h-[80vh] w-[90vw] overflow-scroll p-2">
                    <div >
                        {general_rules.intro.split("\n").map((text, i) => {
                            return (
                                <div key={i} className="mb-2">{text}</div>
                            )
                        })}
                    </div>
                    <div >
                        <div className="font-bold">Allgemeines:</div>
                        {general_rules.general.split("\n").map((text, i) => {
                            return (
                                <div key={i} className="mb-2">{text}</div>
                            )
                        })}
                    </div>
                    <div >
                        <div className="font-bold">Dankeschön</div>
                        {general_rules.thanks.split("\n").map((text, i) => {
                            return (
                                <div key={i} className="mb-2">{text}</div>
                            )
                        })}
                    </div>
                </div>
            </PopUp>
        )
    } else {


        const discipline_rule_text = discipline_rules[discipline.name];

        let info_paragraphs = discipline_rule_text.info.split("\n")

        return (
            <PopUp onClose={onClose} title={discipline.name}>
                <div className="h-[80vh] w-[90vw] min-[576px]:h-[100%] min-[576px]:w-[100%] overflow-scroll p-2  min-[576px]:p-4">
                    <div >
                        <div className="font-bold">Generelle Information:</div>
                        {info_paragraphs.map((text, i) => {
                            return (
                                <div key={i} className="mb-2">{text}</div>
                            )
                        })}
                    </div>
                    {
                        discipline_rule_text.weights &&
                        <div>
                            <div className="font-bold">Gewichte:</div>
                            {discipline_rule_text.weights.split("\n").map(text => {
                                let age_group = text.split(":")[0].trim();
                                let height = text.split(":")[1].trim();

                                return (
                                    <div
                                        key={age_group}
                                        className="grid grid-cols-2">
                                        <div className="underline">{age_group}:</div>
                                        <div>{height}</div>
                                    </div>
                                )
                            })}
                        </div>
                    }
                    {
                        discipline_rule_text.start_height &&
                        <div>
                            <div className="font-bold">Starthöhen:</div>
                            <div>{discipline_rule_text.start_height}</div>
                        </div>
                    }
                    {
                        discipline_rule_text.hurdle_height &&
                        <div>
                            <div className="font-bold">Hürden Höhen:</div>
                            {discipline_rule_text.hurdle_height.split("\n").map((text, i) => {
                                let subheader = !text.startsWith(" -")
                                return (
                                    <div key={i} className={"mb-1 " + (subheader && "underline")}>{text}</div>
                                )
                            })}
                        </div>
                    }
                    {
                        discipline_rule_text.hurdle_distance &&
                        <div>
                            <div className="font-bold">Hürden Abstand:</div>
                            {discipline_rule_text.hurdle_distance.split("\n").map((text, i) => {
                                let subheader = !text.startsWith(" -")
                                return (
                                    <div key={i} className={"mb-1 " + (subheader && "underline")}>{text}</div>
                                )
                            })}
                        </div>
                    }
                    <div>

                    </div>
                </div>

            </PopUp>
        )
    }
}