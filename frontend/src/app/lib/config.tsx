export const decathlon_age_groups = ["AK-M", "M40", "M50", "M60", "M70", "AK-W", "W40", "W50", "W60", "W70", "Staffel"]
export const groups = [1, 2, 3, 4, 5, 6, 7, 8]
export const youth_groups = ["U4/U6", "U8", "U10", "U12", "U14/U16"]
export const long_distance_disciplines = ["1500 Meter Lauf", "1200 Meter Cross Lauf", "1000 Meter Lauf"]

export const default_discipline_values = {
    "Hochsprung": {
        "starting_height": 80,
        "unit": "cm",
        "height_increase": 4
    },
    "Stabhochsprung": {
        "starting_height": 120,
        "unit": "cm",
        "height_increase": 20
    },
}

type Disciplines = [string, string, string][]

export const decathlon_disciplines: Disciplines = [
    ["100 Meter Lauf", "Time", "100m"],
    ["Weitsprung", "Distance", "Weit"],
    ["Kugelstoß", "Distance", "Kugel"],
    ["Hochsprung", "Height", "Hoch"],
    ["400 Meter Lauf", "Time", "400m"],
    ["110 Meter Hürden", "Time", "Hürden"],
    ["Diskuswurf", "Distance", "Diskus"],
    ["Stabhochsprung", "Height", "Stab"],
    ["Speerwurf", "Distance", "Speerwurf"],
    ["1500 Meter Lauf", "Time", "1500m"]
]

export const hepathlon_disciplines: Disciplines = [
    ["100 Meter Hürden", "Time", "Hürden"],
    ["Hochsprung", "Height", "Hoch"],
    ["Kugelstoß", "Distance", "Kugel"],
    ["100 Meter Lauf", "Time", "100m"],
    ["Weitsprung", "Distance", "Weit"],
    ["Speerwurf", "Distance", "Speerwurf"],
    ["1000 Meter Lauf", "Time", "1000m"]
]

export const pentathlon_disciplines: Disciplines = [
    ["60 Meter Hürden", "Time", "Hürden"],
    ["Hochsprung", "Height", "Hoch"],
    ["60 Meter Lauf", "Time", "60m"],
    ["Vortex", "Distance", "Speerwurf"],
    ["1200 Meter Cross Lauf", "Time", "Cross Lauf"]
]

export const triathlon_discplines: Disciplines = [
    ["60 Meter Lauf", "Time", "60m"],
    ["Schlagball", "Distance", "Schlagball"],
    ["Weitsprung", "Distance", "Weit"],
]

type DisciplineMap = {[index: string]: Disciplines}
export const discipline_mapping: DisciplineMap = {
    "Decathlon": decathlon_disciplines,
    "Triathlon": triathlon_discplines,
    "Hepathlon": hepathlon_disciplines,
    "Pentathlon": pentathlon_disciplines
}


export const german_discipline_states: Map<string, string> =  new Map([
    ["BeforeStart", "Ausstehend"], 
    ["Active", "Aktiv"], 
    ["Finished", "Abgeschlossen"]
])

export const unit_mapping: Map<string, string> = new Map([
    ["s", "s"], 
    ["min", "min:s"], 
    ["cm", "cm"],
    ["m", "m"]
])