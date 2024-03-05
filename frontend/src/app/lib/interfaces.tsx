export interface Discipline {
    name: string,
    location: string,
    start_time: string,
    state: string,
    starting_order: StartingOrder | string
}

export interface StartingOrder {
    Track?: {
        name: string,
        athletes: AthleteID[]
    }[],
    Default?: AthleteID[]
}


export interface AthleteID {
    name: string,
    surname: string,
    starting_number: number,
    age_group: string
}