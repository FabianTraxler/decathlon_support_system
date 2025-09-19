import { useEffect, useState } from "react";
import { Athlete } from "../lib/athlete_fetching";


interface Query{
    query: string,
    column: string
}

export interface SearchQuery {
    global: boolean,
    queries: Query[]

}


export function Search({ updateQuery, searchQuery, showGlobal }: { updateQuery: (query: SearchQuery) => void, searchQuery?: SearchQuery, showGlobal: boolean }) {
    const [formState, setFormState] = useState<{
        global: boolean;
        name: string;
        surname: string;
        starting_number: string;
    }>({
        global: false,
        name: "",
        surname: "",
        starting_number: "",
    });

    // Initialize state from searchQuery on mount/update
    useEffect(() => {
        let n = "", s = "", sn = "";
        searchQuery?.queries.forEach((query) => {
            switch (query.column) {
                case "name":
                    n = query.query;
                    break;
                case "surname":
                    s = query.query;
                    break;
                case "starting_number":
                    sn = query.query;
                    break;
            }
        });
        setFormState({
            global: searchQuery?.global ?? false,
            name: n,
            surname: s,
            starting_number: sn,
        });
    }, [searchQuery]);
    
    // Handle input changes and update form state and search query
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        const newFormState = {
            ...formState,
            [name]: type === "checkbox" ? checked : value,
        };
        setFormState(newFormState);

        // Build new SearchQuery from form state
        const queries: Query[] = [];
        if (newFormState.name) queries.push({ query: newFormState.name, column: "name" });
        if (newFormState.surname) queries.push({ query: newFormState.surname, column: "surname" });
        if (newFormState.starting_number) queries.push({ query: newFormState.starting_number, column: "starting_number" });

        updateQuery({ global: newFormState.global, queries });
    };

    const handleReset = () => {
        setFormState({
            global: false,
            name: "",
            surname: "",
            starting_number: "",
        });
        updateQuery({ global: false, queries: [] });
    };

    const { global, name, surname, starting_number } = formState;

    return (
        <div>
            <h2 className="font-bold text-center text-xl">Suche</h2>
            <form>
                <div className="columns-2">
                    <div>
                        <label>Nummer: </label> <br />
                        <input
                            className="max-w-12 shadow-md bg-slate-200 text-black"
                            name="starting_number"
                            value={starting_number}
                            onChange={handleInputChange}
                        /><br />
                    </div>
                    {showGlobal ?
                    <div className="right">
                        <label>Global: </label> <br />
                        <input
                            type="checkbox"
                            className="max-w-12 shadow-md bg-slate-200 text-black"
                            name="global"
                            checked={global}
                            onChange={handleInputChange}
                        /><br />
                    </div>
                    :
                    <div className="right">
                    </div>
                    }
                </div>

                <hr />

                <label>Vorname: </label> <br />
                <input
                    className="max-w-32 sm:max-w-fit shadow-md bg-slate-200 text-black"
                    name="name"
                    value={name}
                    onChange={handleInputChange}
                /><br />
                <hr />

                <label>Nachname: </label> <br />
                <input
                    className="max-w-32 sm:max-w-fit shadow-md bg-slate-200 text-black"
                    name="surname"
                    value={surname}
                    onChange={handleInputChange}
                /><br />
                <hr />
            </form>
            <div className="flex justify-center p-2 text-black">
                <button
                    type="button"
                    className="p-2 border-black rounded-md bg-red-300 shadow-md shadow-slate-400 hover:cursor-pointer hover:bg-red-600"
                    onClick={handleReset}
                >Reset</button>
            </div>
        </div>
    )
}


export class AthleteQuery {
    query: SearchQuery

    constructor(query: SearchQuery) {
        this.query = query
    }

    matchAthlete(athlete: Athlete): boolean {
        let match = true;
        this.query.queries.forEach(query => {
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
