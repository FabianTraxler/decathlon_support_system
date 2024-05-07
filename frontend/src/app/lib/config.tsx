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

export const hepathlon_disciplines: [string, string, string][] = [
    ["100 Meter Hürden", "Time", "Hürden"],
    ["Hochsprung", "Height", "Hoch"],
    ["Kugelstoß", "Distance", "Kugel"],
    ["100 Meter Lauf", "Time", "100m"],
    ["Weitsprung", "Distance", "Weit"],
    ["Speerwurf", "Distance", "Speerwurf"],
    ["1000 Meter Lauf", "Time", "1000m"]
]

export const pentathlon_disciplines: [string, string, string][] = [
    ["60 Meter Hürden", "Time", "Hürden"],
    ["Hochsprung", "Height", "Hoch"],
    ["60 Meter Lauf", "Time", "60m"],
    ["Vortex", "Distance", "Speerwurf"],
    ["1200 Meter Cross Lauf", "Time", "Cross Lauf"]
]

export const triathlon_discplines: [string, string, string][] = [
    ["60 Meter Lauf", "Time", "60m"],
    ["Schlagball", "Distance", "Schlagball"],
    ["Weitsprung", "Distance", "Weit"],
]


export const german_discipline_states: Map<string, string> =  new Map([
    ["BeforeStart", "Ausstehend"], 
    ["Active", "Aktiv"], 
    ["Finished", "Abgeschlossen"]])