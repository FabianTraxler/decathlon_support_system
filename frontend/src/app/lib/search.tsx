import { Athlete } from "../lib/athlete_fetching";


interface Query{
    query: string,
    column: string
}

export interface SearchQuery {
    global: boolean,
    queries: Query[]

}


export function Search({ updateQuery }: { updateQuery: (query: SearchQuery) => void }) {

    const onChange = function () {
        let form: HTMLFormElement | null = document.getElementById("searchForm") as HTMLFormElement
        let search_query: SearchQuery = {global: false, queries: []}

        Array.from(form.elements).forEach((element) => {
            let el: HTMLInputElement = element as HTMLInputElement
            if (el.value && el.name != "global") search_query.queries.push({ query: el.value, column: el.name })
            if(el.name == "global"){
                search_query.global = el.checked
            }
        })
        updateQuery(search_query)
    }

    return (
        <div>
            <h2 className="font-bold text-center text-xl">Suche</h2>
            <form id="searchForm" onChange={onChange}>
                <div className="columns-2">
                    <div>
                        <label>Nummer: </label> <br />
                        <input className="max-w-12 shadow-md bg-slate-200 text-black" name="starting_number"></input><br />
                    </div>
                    <div className="right">
                        <label>Global: </label> <br />
                        <input type="checkbox" className="max-w-12 shadow-md bg-slate-200 text-black" name="global"></input><br />
                    </div>
                </div>

                <hr />

                <label>Vorname: </label> <br />
                <input className="max-w-32 sm:max-w-fit shadow-md bg-slate-200 text-black" name="name"></input><br />
                <hr />

                <label>Nachname: </label> <br />
                <input className="max-w-32 sm:max-w-fit shadow-md bg-slate-200 text-black" name="surname"></input><br />
                <hr />
            </form>
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
