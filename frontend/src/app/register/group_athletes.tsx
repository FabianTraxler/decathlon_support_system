import { useState, useEffect, createContext, useContext } from "react"
import { Athlete, fetch_all_athletes, fetch_group_athletes } from "../lib/athlete_fetching"
import AthleteTable from "./search_table"
import { groups, youth_groups } from "../lib/config";

export interface SearchQuery {
    query: string,
    column: string
}

export const AthleteContext = createContext({ update_athlete: (a: Athlete) => { }, reload_athletes: () => { } });

export default function GroupAthletes({ groupName }: { groupName: string }) {
    const [athletes, setAthletes] = useState<Athlete[]>([])
    const [searchQuery, setSearchQuery] = useState<SearchQuery[]>([])
    let load_athlete = () => { };
    if (groupName == "Übersicht") {
        load_athlete = () => fetch_all_athletes(setAthletes)
    } else if (groupName == "Nachmeldungen") {

    } else {
        load_athlete = () => fetch_group_athletes(groupName, setAthletes)
    }
    useEffect(() => {
        load_athlete()
    }, [groupName])

    const updateAthlete = function (a: Athlete) {
        let index = athletes.findIndex((b) => (a.name + a.surname) == (b.name + b.name));
        if (index > 0) {
            athletes.splice(index, 0, a);
            setAthletes(athletes)
        }
    }

    return (
        <AthleteContext.Provider value={{ "update_athlete": updateAthlete, "reload_athletes": load_athlete }}>
            <div className="flex flex-col sm:flex-row justify-center items-center">
                <div className="flex flex-row sm:flex-col justify-between items-center w-full p-2 sm:w-fit ">
                    <div className="h-fit border border-black p-2 xl:p-5 xl:m-5 shadow-md rounded-md">
                        <Search updateQuery={setSearchQuery}></Search>
                    </div>
                    <div className=" h-fit border border-black p-2 mt-5 xl:p-5 xl:m-5 shadow-md rounded-md">
                        <AddAthlete groupName={groupName}></AddAthlete>
                    </div>
                </div>

                <div className="border border-black p-2 mt-2 xl:p-5 xl:m-5 xl:pl-10 xl:pr-10 shadow-md rounded-md">
                    <AthleteTable athletes={athletes} searchQuery={searchQuery}></AthleteTable>
                </div>

            </div>
        </AthleteContext.Provider>
    )
}

function Search({ updateQuery }: { updateQuery: (query: SearchQuery[]) => void }) {

    const onChange = function () {
        let form: HTMLFormElement | null = document.getElementById("searchForm") as HTMLFormElement
        let search_query: SearchQuery[] = []

        Array.from(form.elements).forEach((element) => {
            let el: HTMLInputElement = element as HTMLInputElement
            if (el.value) search_query.push({ query: el.value, column: el.name })

        })
        updateQuery(search_query)
    }

    return (
        <div>
            <h2 className="font-bold text-center text-xl">Suche</h2>
            <form id="searchForm" onChange={onChange}>
                <label>Startnummer: </label> <br />
                <input className="max-w-12 shadow-md bg-slate-200" name="starting_number"></input><br />
                <hr />

                <label>Vorname: </label> <br />
                <input className="max-w-32 sm:max-w-fit shadow-md bg-slate-200" name="name"></input><br />
                <hr />

                <label>Nachname: </label> <br />
                <input className="max-w-32 sm:max-w-fit shadow-md bg-slate-200" name="surname"></input><br />
                <hr />
            </form>
        </div>
    )
}

function AddAthlete({ groupName }: { groupName: string }) {
    let { reload_athletes } = useContext(AthleteContext);


    const onSubmit = function (e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        let form = e.target as HTMLFormElement;
        var formData = new FormData(form);

        let values: [string, string | number | {}][] = [];

        Array.from(formData.entries()).forEach(([key, val]) => {
            let string_val = val.toString();

            if (string_val != "") {
                if (/^[0-9]*$/.test(string_val)) {
                    values.push([key, parseInt(string_val)])
                } else {
                    values.push([key, string_val])
                }

                if (key == "group_name") {
                    let comptetion_name = "Decathlon"
                    if (string_val.includes("U")) {
                        let age_group = parseInt(string_val.replace("U", ""))
                        if (age_group <= 12) {
                            comptetion_name = "Triathlon"
                        } else if (age_group <= 14) {
                            comptetion_name = "Pentathlon"
                        } else if (age_group <= 16) {
                            comptetion_name = "Heptathlon"
                        }
                    }
                    values.push(["competition_type", comptetion_name])
                }
            }
        })

        values.push(["achievements", {}])

        let api_url = `/api/group_athlete`

        fetch(api_url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(Object.fromEntries(values || []))
        }).then(res => {
            if (res.ok) {
                reload_athletes()
                return res
            } else {
                throw new Error(`Network response was not ok: ${res.status} - ${res.statusText}`);
            }
        }).catch((e) => {
            console.error(e)
        })

    }

    return (
        <div>
            <h2 className="font-bold text-center text-xl">Hinzufügen</h2>
            <form id="searchForm" onSubmit={onSubmit}>
                <label>Startnummer: </label> <br />
                <input className="max-w-12 shadow-md bg-slate-200" name="starting_number"></input><br />
                <hr />

                <label>Vorname: </label> <br />
                <input className="max-w-32 sm:max-w-fit shadow-md bg-slate-200" name="name"></input><br />
                <hr />

                <label>Nachname: </label> <br />
                <input className="max-w-32 sm:max-w-fit shadow-md bg-slate-200" name="surname"></input><br />
                <hr />
                <div className="flex flex-col">
                    <div className="flex flex-row justify-between">
                        <label>Geschlecht: </label>
                        <label>Gruppe: </label>
                    </div>
                    <div className="flex flex-row justify-between">
                        <select className="max-w-32 sm:max-w-fit shadow-md bg-slate-200" name="gender">
                            <option value="W">W</option>
                            <option value="M">M</option>
                            <option value="M">Diverse</option>
                        </select>
                        <select defaultValue={groupName || "U4"} className="max-w-32 sm:max-w-fit shadow-md bg-slate-200" name="group_name">
                            {youth_groups.map((group_id) => {
                                let group_name = "U" + group_id
                                return (
                                    <option key={group_id} value={group_name}>{group_name}</option>
                                )
                            })}
                            {groups.map((group_id) => {
                                let group_name = "Gruppe " + group_id
                                return (
                                    <option key={group_id} value={group_name}>{group_name}</option>
                                )
                            })}

                        </select>
                    </div>

                </div>


                <br />
                <hr />

                <input type="submit" value="Submit" className="flex float-right mt-3 shadow-md bg-slate-100 border"></input>
            </form>
        </div>
    )
}