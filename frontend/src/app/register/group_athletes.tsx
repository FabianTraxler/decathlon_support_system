import { useState, useEffect, createContext, useContext } from "react"
import { Athlete, fetch_all_athletes, fetch_group_athletes } from "../lib/athlete_fetching"
import AthleteTable from "./search_table"
import { groups, youth_groups } from "../lib/config";
import { LoadingAnimation } from "../lib/loading";

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
                <div className="flex flex-col sm:flex-col justify-between items-center p-2 w-screen sm:w-fit">
                    <div className="h-fit border border-black p-2 2xl:p-5 m-2 2xl:m-5 shadow-md rounded-md">
                        <Search updateQuery={setSearchQuery}></Search>
                    </div>
                    <div className=" h-fit border border-black p-2 mt-1 2xl:mt-5 2xl:p-5 2xl:m-5 shadow-md rounded-md">
                        <AddAthlete groupName={groupName}></AddAthlete>
                    </div>
                </div>

                <div className="w-screen sm:w-fit x-overflow-scroll border border-black p-2 pb-16 sm:pb-2 mt-2 2xl:p-5 2xl:m-5 2xl:pl-10 2xl:pr-10 shadow-md rounded-md">
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
    const [formState, setFormState] = useState("ready")
    let { reload_athletes } = useContext(AthleteContext);

    const onSubmit = function (e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        let form = e.target as HTMLFormElement;
        var formData = new FormData(form);


        let parsing_error = [false, ""];
        let special_characters = /[!@#$%^&*()}^__+\=\[\]{};':"\\|,.<>\/?]+/;

        let birth_date = parseInt(formData.get("birth_date")?.toString() || "1990");
        let current_year = new Date().getFullYear();
        let age = current_year - birth_date;

        let values: [string, string | number | {}][] = [];

        Array.from(formData.entries()).forEach(([key, val]) => {
            let string_val = val.toString();

            if (string_val != "") {
                if(key == "name" || key == "surname"){
                    // Check for wrong characters
                    if (special_characters.test(string_val)){
                        parsing_error = [true, "Name enthält ungültige Zeichen - Bitte keine Sonderzeichen eingeben"]
                    }
                }
                if (/^[0-9]*$/.test(string_val)) {
                    values.push([key, parseInt(string_val)])
                } else {
                    values.push([key, string_val])
                }

                if (key == "group_name") {
                    let comptetion_name = "Decathlon"
                    if (string_val.includes("U")) {
                        let age_group = parseInt(string_val.replace("U", ""))
                        if(string_val == "U4/U6"){
                            age_group = 6
                        }
                        if (age_group <= 12) {
                            comptetion_name = "Triathlon"
                        } else if (age_group <= 14) {
                            comptetion_name = "Pentathlon"
                        } else if (age_group <= 16) {
                            comptetion_name = "Heptathlon"
                        }

                        if ((age_group - age <= 0 || age_group - age > 2) && (age_group != 6 || age >= 6)){
                            parsing_error = [true, "Falsche Altersklasse ausgewählt für angegebenen Jahrgang"]
                        }
                    }
                    values.push(["competition_type", comptetion_name])
                }
                if (key == "birth_date"){
                    let date = new Date(parseInt(string_val), 1, 1, 0,0)
                    values.push(["birth_date", date.getTime() / 1000])
                }
            }
        })

        if (parsing_error[0]){
            alert(parsing_error[1]);
            //reload_athletes()
        }else{
            setFormState("uploading")

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
                    setFormState("uploaded")
                    setTimeout(() => setFormState("ready"), 500)
                    reload_athletes()
                } else {
                    throw new Error(`Network response was not ok: ${res.status} - ${res.statusText}`);
                }
            }).catch((e) => {
                setTimeout(() => setFormState("ready"), 500)
                alert(e)
            })
        }

    }

    return (
        <div>
            {
                formState == "ready" &&
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
                                <label>JG: </label>
                                <label>Gruppe: </label>
                            </div>
                            <div className="flex flex-row justify-between">
                                <select className="max-w-30 sm:max-w-fit shadow-md bg-slate-200" name="gender">
                                    <option value="W">W</option>
                                    <option value="M">M</option>
                                </select>
                                <input type="number" className="w-16 max-w-30 shadow-md bg-slate-200" name="birth_date">
                                </input>
                                <select defaultValue={groupName || "U4"} className="max-w-32 sm:max-w-fit shadow-md bg-slate-200" name="group_name">
                                    {youth_groups.map((group_id) => {
                                        let group_name = group_id
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
            }

            {
                formState == "uploading" &&
                <div>
                    <svg aria-hidden="true" className="w-24 h-24 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                    </svg>
                    <span className="sr-only flex justify-center items-center h-full w-full"><LoadingAnimation></LoadingAnimation></span>
                </div>
            }

            {
                formState == "uploaded" &&
                <div>
                    <svg className="w-24 h-24 me-2 text-green-500 dark:text-green-400 flex-shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                    </svg>
                    <span className="sr-only">Uploaded</span>
                </div>
            }

        </div>
    )
}