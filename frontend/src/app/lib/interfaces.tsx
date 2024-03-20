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

export interface AthleteDistanceResults extends AthleteID {
    discipline_name: string,
    discipline_unit: string,
    first_try?: number,
    second_try?: number,
    third_try?: number,
    best_try?: number
}