export const decathlon_age_groups = ["AK-M", "M40", "M50", "M60", "AK-W", "W40", "W50", "W60"]
export const groups = [1, 2, 3, 4, 5, 6, 7, 8]
export const youth_groups = [4, 6, 8, 10, 12, 14, 16]


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

export const discipline_types: Map<string, string> = new Map([
    ["100 Meter Lauf", "Time"],
    ["Weitsprung", "Distance"],
    ["Kugelstoß", "Distance"],
    ["Hochsprung", "Height"],
    ["400 Meter Lauf", "Time"],
    ["110 Meter Hürden", "Time"],
    ["Diskuswurf", "Distance"],
    ["Stabhochsprung", "Height"],
    ["Speerwurf", "Distance"],
    ["1500 Meter Lauf", "Time"]
])

export const decathlon_disciplines: [string, string, string][] = [
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

export const german_discipline_states: Map<string, string> =  new Map([
    ["BeforeStart", "Ausstehend"], 
    ["Active", "Aktiv"], 
    ["Finished", "Abgeschlossen"]])