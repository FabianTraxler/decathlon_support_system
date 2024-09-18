import { Athlete, sort_athletes } from "../lib/athlete_fetching";
import { useState, useEffect, useContext } from "react";
import { AthleteContext, SearchQuery } from "./group_athletes";


class AthleteQuery {
    queries: SearchQuery[]

    constructor(queries: SearchQuery[]) {
        this.queries = queries
    }

    matchAthlete(athlete: Athlete): boolean {
        let match = true;
        this.queries.forEach(query => {
            switch (query.column) {
                case "name":
                    match = match && athlete.name.toLocaleLowerCase().includes(query.query.toLocaleLowerCase())
                    break
                case "surname":
                    match = match && athlete.surname.toLocaleLowerCase().includes(query.query.toLocaleLowerCase())
                    break
                case "starting_number":
                    match = match && (!!athlete.starting_number && athlete.starting_number.toString().includes(query.query.toLocaleLowerCase()))
                    break
                case "birth_day":
                    let athlete_bd = new Date(athlete.birth_date * 1000)
                    let query_date = new Date(query.query)
                    match = match && athlete_bd.getDate() == query_date.getDate()
                    break
            }
        })
        return match;
    }
}


export default function AthleteTable({ athletes, searchQuery }:
    { athletes: Athlete[], searchQuery: SearchQuery[] }) {
    const [sorted, setSorted] = useState({ name: "#", ascending: true })

    let query = new AthleteQuery(searchQuery)

    const sortColumn = function (col_name: string) {
        if (sorted.name == col_name) {
            setSorted({ name: col_name, ascending: !sorted.ascending })
        } else {
            setSorted({ name: col_name, ascending: true })
        }
    }

    let selected_athletes: Athlete[] = []
    let deselected_athletes: Athlete[] = []

    let group_available = false

    athletes.forEach(athlete => {
        if (athlete.group_name) group_available = true
        if (query.matchAthlete(athlete)) {
            selected_athletes.push(athlete)
        } else {
            deselected_athletes.push(athlete)
        }
    })

    selected_athletes.sort((a, b) => sort_athletes(a, b, sorted));
    deselected_athletes.sort((a, b) => sort_athletes(a, b, sorted));


    return (
        <div className="text-sm 2xl:text-md font-normal overflow-scroll sm:max-h-[20rem] md:max-h-[35rem] 2xl:max-h-[45rem]">
            <table className="table-auto border-collapse w-full text-[1rem] sm:text-[0.8rem] 2xl:text-sm">
                <thead>
                    <tr>
                        <th onClick={() => sortColumn("#")} className="border border-slate-600 p-1 pl-2 pr-2 hover:cursor-pointer">
                            <span className='hidden sm:inline pr-1'>Startnummer</span>
                            <span className='sm:hidden pr-1'>#</span>
                            {sorted.name != "#" && <span>&#x25b4;&#x25be;</span>}
                            {(sorted.name == "#" && sorted.ascending) && <span>&#x25b4;</span>}
                            {(sorted.name == "#" && !sorted.ascending) && <span>&#x25be;</span>}
                        </th>
                        {group_available &&
                            <th onClick={() => sortColumn("Gruppe")} className="hidden sm:table-cell border border-slate-600 p-1 pl-2 pr-2 hover:cursor-pointer">
                                <span className='pr-1'>Gruppe</span>
                                {sorted.name != "Gruppe" && <span>&#x25b4;&#x25be;</span>}
                                {(sorted.name == "Gruppe" && sorted.ascending) && <span>&#x25b4;</span>}
                                {(sorted.name == "Gruppe" && !sorted.ascending) && <span>&#x25be;</span>}
                            </th>
                        }
                        <th onClick={() => sortColumn("Vorname")} className="border border-slate-600 p-1 pl-2 pr-2 hover:cursor-pointer">
                            <span className='pr-1'>Vorname</span>
                            {sorted.name != "Vorname" && <span>&#x25b4;&#x25be;</span>}
                            {(sorted.name == "Vorname" && sorted.ascending) && <span>&#x25b4;</span>}
                            {(sorted.name == "Vorname" && !sorted.ascending) && <span>&#x25be;</span>}
                        </th>
                        <th onClick={() => sortColumn("Nachname")} className="border border-slate-600 p-1 pl-2 pr-2 hover:cursor-pointer">
                            <span className='pr-1'>Nachname</span>
                            {sorted.name != "Nachname" && <span>&#x25b4;&#x25be;</span>}
                            {(sorted.name == "Nachname" && sorted.ascending) && <span>&#x25b4;</span>}
                            {(sorted.name == "Nachname" && !sorted.ascending) && <span>&#x25be;</span>}
                        </th>
                        <th onClick={() => sortColumn("age_group")} className="hidden sm:table-cell border border-slate-600 p-1 pl-2 pr-2 hover:cursor-pointer">
                            <span className='pr-1'>Altersklasse</span>
                            {sorted.name != "age_group" && <span>&#x25b4;&#x25be;</span>}
                            {(sorted.name == "age_group" && sorted.ascending) && <span>&#x25b4;</span>}
                            {(sorted.name == "age_group" && !sorted.ascending) && <span>&#x25be;</span>}
                        </th>
                        <th onClick={() => sortColumn("Gender")} className="hidden sm:table-cell border border-slate-600 p-1 pl-2 pr-2 hover:cursor-pointer">
                            <span className='pr-1'>Sex</span>
                            {sorted.name != "Gender" && <span>&#x25b4;&#x25be;</span>}
                            {(sorted.name == "Gender" && sorted.ascending) && <span>&#x25b4;</span>}
                            {(sorted.name == "Gender" && !sorted.ascending) && <span>&#x25be;</span>}
                        </th>
                        <th onClick={() => sortColumn("JG")} className="hidden 2xl:table-cell border border-slate-600 p-1 pl-2 pr-2 hover:cursor-pointer">
                            <span className='pr-1'>Geburtstag</span>
                            {sorted.name != "JG" && <span>&#x25b4;&#x25be;</span>}
                            {(sorted.name == "JG" && sorted.ascending) && <span>&#x25b4;</span>}
                            {(sorted.name == "JG" && !sorted.ascending) && <span>&#x25be;</span>}
                        </th>
                        <th onClick={() => sortColumn("T-Shirt")} className="hidden xl:table-cell border border-slate-600 p-1 pl-2 pr-2 hover:cursor-pointer">
                            <span className='pr-1'>Shirt</span>
                            {sorted.name != "T-Shirt" && <span>&#x25b4;&#x25be;</span>}
                            {(sorted.name == "T-Shirt" && sorted.ascending) && <span>&#x25b4;</span>}
                            {(sorted.name == "T-Shirt" && !sorted.ascending) && <span>&#x25be;</span>}
                        </th>
                        <th onClick={() => sortColumn("Bezahlt")} className="hidden xl:table-cell border border-slate-600 p-1 pl-2 pr-2 hover:cursor-pointer">
                            <span className='pr-1'>Bezahlt</span>
                            {sorted.name != "Bezahlt" && <span>&#x25b4;&#x25be;</span>}
                            {(sorted.name == "Bezahlt" && sorted.ascending) && <span>&#x25b4;</span>}
                            {(sorted.name == "Bezahlt" && !sorted.ascending) && <span>&#x25be;</span>}
                        </th>

                    </tr>
                </thead>
                <tbody>
                    {selected_athletes.map((athlete, i) => {
                        return <AthleteTableRow key={i} athlete={athlete} selected={true} groupAvailable={group_available}></AthleteTableRow>
                    })}
                    {deselected_athletes.map((athlete, i) => {
                        return <AthleteTableRow key={i} athlete={athlete} selected={false} groupAvailable={group_available}></AthleteTableRow>
                    })}
                </tbody>
            </table>
        </div>
    )
}


function AthleteTableRow({ athlete, selected, groupAvailable }: { athlete: Athlete, selected: boolean, groupAvailable: boolean }) {
    const full_name = athlete.name + "_" + athlete.surname;
    let birth_day = "-"
    let age_group = athlete.gender

    if (athlete.birth_date) {
        let date = new Date(athlete.birth_date * 1000);
        birth_day = date.getDate() + "." + date.getMonth() + "." + date.getFullYear();

        let today = new Date()
        let age = today.getFullYear() - date.getFullYear()
        if ( age < 16 || athlete.group_name?.includes("U")) {
            if(age < 4) {
                age_group = "U4"
            } else if (age < 6) {
                age_group = "U6"
            }else if (age < 8) {
                age_group = "U8"
            }else if (age < 10) {
                age_group = "U10"
            }else if (age < 12) {
                age_group = "U12"
            }else if (age < 14) {
                age_group = "U14"
            }else {
                age_group = "U16"
            }
        } else {
            if(age < 40) {
                age_group = "AK"
            } else if (age < 50) {
                age_group = athlete.gender + "40"
            }else if (age < 60) {
                age_group = athlete.gender + "50"
            }else {
                age_group = athlete.gender + "60"
            }
        }
    } else if (groupAvailable && athlete.group_name?.includes("U")) {
        age_group = athlete.group_name
    }

    
    return (
        <tr key={full_name} className={(!selected ? "bg-slate-400" : "")}>
            <td className='border border-slate-800 p-1 pl-3 pr-3'>
                <StartingNumberInput key={full_name} athlete={athlete}></StartingNumberInput>
            </td>
            {groupAvailable &&
                <td className='hidden sm:table-cell border border-slate-800 p-1 pl-2 pr-2'>{athlete.group_name}</td>
            }
            <td className='border border-slate-800 p-1 pl-2 pr-2'>{athlete.name}</td>
            <td className='border border-slate-800 p-1 pl-2 pr-2'>{athlete.surname}</td>
            <td className='hidden sm:table-cell border border-slate-800 p-1 pl-2 pr-2 text-center'>{age_group}</td>
            <td className='hidden sm:table-cell border border-slate-800 p-1 pl-2 pr-2 text-center'>{athlete.gender}</td>
            <td className='hidden 2xl:table-cell border border-slate-800 p-1 pl-2 pr-2'>{birth_day}</td>
            <td className='hidden xl:table-cell border border-slate-800 p-1 pl-2 pr-2 text-center'>{athlete.t_shirt}</td>
            <td className='hidden xl:table-cell border border-slate-800 p-1 pl-2 pr-2 text-center'>{athlete.paid ? <span>&#9989;</span>: <span>&#10060;</span>}</td>
        </tr>
    )
}


function StartingNumberInput({ athlete }: { athlete: Athlete }) {
    const [currentState, set_currentState] = useState({ starting_number: athlete.starting_number, isUploaded: !!athlete.starting_number, isError: false })

    let { update_athlete } = useContext(AthleteContext);

    useEffect(() => {
        if (currentState.starting_number != athlete.starting_number && !currentState.isUploaded) {
            let changed_value = {
                "starting_number": currentState.starting_number
            }

            let timer = setTimeout(() => {
                fetch(`/api/athlete?name=${athlete.name}&surname=${athlete.surname}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(changed_value)
                }).then(res => {
                    if (res.ok) {
                        athlete.starting_number = currentState.starting_number
                        update_athlete(athlete)
                        set_currentState(prevState => ({
                            ...prevState,
                            isUploaded: true
                        }))
                    } else {
                        throw new Error(`Network response was not ok: ${res.status} - ${res.statusText}`);
                    }
                }).catch(e => {
                    set_currentState(prevState => ({
                        ...prevState,
                        isError: true
                    }))
                    alert(`Startnummer nicht gespeichert! Händisch niederschreiben! -> ${e}`)
                }
                )

            }, 500)
            return () => {
                clearTimeout(timer);
            };
        }
    })

    let handleOnChange = function (e: any) {
        let value = e.target.value;
        if (/^[0-9]*$/.test(value)) {
            set_currentState({
                starting_number: parseInt(value),
                isUploaded: false,
                isError: false
            })
        } else {
            set_currentState(prevState => ({
                ...prevState,
                isError: true
            }))
        }
    }

    return (
        <input
            onChange={handleOnChange}
            className={"text-center shadow-sm hover:cursor-pointer max-w-[6rem] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none " +
                (currentState.isError ? " bg-red-400" : "") + ((!currentState.isError && currentState.isUploaded) ? " bg-green-100" : "") +
                ((!currentState.isError && !currentState.isUploaded) ? " bg-yellow-100" : "")}
            defaultValue={currentState.starting_number || ""}></input>
    )
}

