export interface Discipline {
    name: string,
    location: string,
    start_time: string,
    state: string,
    starting_order: StartingOrder | string,
    discipline_type: string
}

export interface StartingOrder {
    Track?: {
        name: string,
        athletes: (AthleteID|null)[]
    }[],
    Default?: AthleteID[]
}


export class AthleteID {
    name: string;
    surname: string;
    age_group: string;

    constructor(name: string, surname: string, age_group: string) {
        this.name = name;
        this.surname = surname;
        this.age_group = age_group;
    }

    full_name(): string {
        return this.name + "_" + this.surname
    }
}

export class AthleteTimeResult extends AthleteID {
    starting_number?: number;
    final_result?: number | string;

    constructor(name: string, surname: string, age_group: string, starting_number?: number) {
        super(name, surname, age_group)
        this.starting_number = starting_number
    }
}

export class AthleteDistanceResults extends AthleteID {
    discipline_name: string;
    discipline_unit: string;
    starting_number?: number;
    first_try?: number;
    second_try?: number;
    third_try?: number;
    best_try?: number;

    constructor(athlete: AthleteID, discipline_name: string, discipline_unit: string, starting_number?: number) {
        super(athlete.name, athlete.surname, athlete.age_group)
        this.discipline_name = discipline_name
        this.discipline_unit = discipline_unit
        this.starting_number = starting_number
    }
}

// TODO: Merge with Achievement Interface?
export interface AthleteHeightResults extends AthleteID {
    discipline_name: string,
    discipline_unit: string,
    tries?: string,
    start_height?: number,
    start_height_set: boolean,
    height_increase?: number,
    final_result?: number,
    still_active: boolean,
    current_height: number,
    current_try: number,
    starting_number?: number
}

export class AthleteHeightID extends AthleteID {
    starting_number: number;

    constructor(name: string, surname: string, age_group: string, starting_number: number) {
        super(name, surname, age_group)
        this.starting_number = starting_number;
    }
}
