type DisciplineRule = {
    image: string,
    info: string,
    weights?: string,
    start_height?: string,
    hurdle_height?: string
}

type Rules = {
    [index:string]: DisciplineRule
}

export const general_rules = {
    "intro": "",
    "general": "",
    "thanks": ""
}

export const discipline_rules: Rules = {
    "100 Meter Lauf": {
        "image": "sprint.svg",
        "info": "App: Die Laufreihenfolge kann digital verändert werden, welche dann direkt bei der Zeitnehmung im Ziel sichtbar ist.\nProtokolle: Es gibt drei Protokolle (Starter, Zeitnehmung, Gruppenbetreuer) und etwaige Änderungswünsche in der Bahnverteilung müssen in allen Protokollen vermerkt werden."
    },
    "Weitsprung": {
        "image": "long-jump.svg",
        "info": "Es wird vom Balken gesprungen (kein Zonenabsprung), wobie der schwarze Streifen beim Absprung nicht berührt werden darf. Gemessen wird vom nähesten Abdruck im rechten Winkel zurück zum schwarzen Streifen am Balken.\nNach jedem Sprung ist der Sand in der Sprunggrube einzuebnen."
    },
    "Kugelstoß": {
        "image": "shot-put.svg",
        "info": "Es gilt Sicherheit zuerst! Vor dem aktiven Athleten soll sich nur der Helfer aufhalten. Alle anderen Personen sollen sich seitlich oder dahinter befinden\n Die Einschlagstellen sind nach der Messung bodengleich zu machen.",
        "weights": "AK-M & M40: 7,26kg\nM50: 6,00kg\nM60: 5,00kg\nM70: 4,00kg\nAK-W & W40: 4,00kg\nW50: 3,00kg\nW60: 3,00kg"

    },
    "Hochsprung": {
        "image": "high-jump.svg",
        "info": "Es gibt je Höhe drei Versuche, wobei ein gültiger mit 'O' oder einem Hackerl, ein Fehlversuch mit 'X' und ein ausgelassener Versuch mit '-' gekennzeichnet wird. Die beste Leistung wird am Ende des Bewerbs in eine extra Spalte eingetragen (entfällt bei Nutzung der App).\nNach dem Einspringen soll jede:r Springer:in die Anfangshöhe bekanntgeben, welche im Protokoll/App vermerkt wird.\nAls Fehlversuch wird gewertet, wenn der/die Wettkämpfer:in mit irgendeinem Körperteil die Matte berührt. Wenn die Matte nicht berührt wurde und die Latte nicht abgeworfen wurde, dann darf der Versuch sofort wiederholt werden (Zeitlimit für den gesamten Versuch: 60s)",
        "start_height": "80cm für alle Athlet:innen. Steigerung 4cm (keine Ausnahmen, auch wenn nur noch ein:e Athlet:in im Bewerb ist)"
    },
    "400 Meter Lauf": {
        "image": "sprint.svg",
        "info": "App: Die Laufreihenfolge kann digital verändert werden, welche dann direkt bei der Zeitnehmung im Ziel sichtbar ist.\nProtokolle: Es gibt drei Protokolle (Starter, Zeitnehmung, Gruppenbetreuer) und etwaige Änderungswünsche in der Bahnverteilung müssen in allen Protokollen vermerkt werden.\nIm Ziel soll für die Athleten ein isotonisches Getrönk vorbereitet sein, welches in der Küche samt Bechern erhältnlich ist. Auch soll ein Abfallbehälter für die benutzten Becher vorhanden sein."
    },
    "110 Meter Hürden": {
        "image": "hurdles.svg",
        "info": "App: Die Laufreihenfolge kann digital verändert werden, welche dann direkt bei der Zeitnehmung im Ziel sichtbar ist.\nProtokolle: Es gibt drei Protokolle (Starter, Zeitnehmung, Gruppenbetreuer) und etwaige Änderungswünsche in der Bahnverteilung müssen in allen Protokollen vermerkt werden.",
        "hurdle_height": "AK-M: 91cm\nAK-W & M40/M50: 76cm\nM60 & W40/W50/W60: 54cm"
    },
    "Diskuswurf": {
        "image": "disc-throw.svg",
        "info": "Es gilt Sicherheit zuerst! Vor dem aktiven Athleten soll sich nur der Helfer aufhalten. Alle anderen Personen sollen sich seitlich oder dahinter befinden. Auch zum 'Käfig', zur Laufbahn und von den Sektorenbegrenzungen soll ein ausreichender Abstand gehalten werden\n Die Einschlagstellen sind nach der Messung bodengleich zu machen.\n Der Metallring darf während des Versuchs nicht übertreten werden. Der Diskus muss im Sektor landen und der/die Athlet:in den Kreis hinter der Mittellinie verlassen.\nDie Messung erfolgt von der Einschlagstelle zum Kreismittelpunkt, wobei am inneren Rand des Metallrings abgelesen wird.",
        "weights": "AK-M & M40: 2,0kg\nM50: 1,5kg\nM60: 1,0kg\nM70: 1,0kg\nAK-W & W40: 1,0kg\nW50: 1,0kg\nW60: 1,0kg"
    },
    "Stabhochsprung": {
        "image": "pole-vault.svg",
        "info": "Es gibt je Höhe drei Versuche, wobei ein gültiger mit 'O' oder einem Hackerl, ein Fehlversuch mit 'X' und ein ausgelassener Versuch mit '-' gekennzeichnet wird. Die beste Leistung wird am Ende des Bewerbs in eine extra Spalte eingetragen (entfällt bei Nutzung der App).\nNach dem Einspringen soll jede:r Springer:in die Anfangshöhe bekanntgeben, welche im Protokoll/App vermerkt wird.\n Als Fehlversuch gilt, wenn der/die Wettkämpfer:in mit irgendeinem Körperteil oder mit dem Stab den Boden oder die Matte jenseits der senkrechten Ebene über der Oberkante tes Einstichkastens berührt (Null-Linie).\n Das Abfangen der Stande wird ausschließlich bei der Anfangshöhe (120cm) akzeptiert.",
        "start_height": "120cm für alle Athlet:innen. Steigerung 20cm (keine Ausnahmen, auch wenn nur noch ein:e Athlet:in im Bewerb ist)"

    },
    "Speerwurf": {
        "image": "javelin_throw.svg",
        "info": "Es gilt Sicherheit zuerst! Vor dem aktiven Athleten soll sich nur der Helfer aufhalten. Alle anderen Personen sollen sich seitlich oder dahinter befinden.\nDer Speer muss mit der Spitze landen bzw. mit der vorderen Hälfte der Speeres! Die weiße Linie darf beim Abwurf sowie danach nicht berührt oder überschritten werden.\n Rasenkerben nach der Speerlandung wieder zutreten",
        "weights": "AK-M & M40: 800g\nM50: 700g\nM60: 600g\nM70: 500g\nAK-W & W40: 600g\nW50: 500g\nW60: 500g"
    },
    "1500 Meter Lauf": {
        "image": "run.svg",
        "info": "Alle Athlet:innen starten gleichzeitig und müssen ihre Startnummer gut sichtbar vorne tragen, damit sie bei jedem Rundendurchgang gelesen und notiert werden können. Die Helfer läuten die letzte Runde ein. Der Zieleinlauf (Startnummern) muss von einem Helfer mitgeschrieben werden. \nIm Ziel soll für die Athleten ein isotonisches Getrönk vorbereitet sein, welches in der Küche samt Bechern erhältnlich ist. Auch soll ein Abfallbehälter für die benutzten Becher vorhanden sein."
    },
    "100 Meter Hürden": {
        "image": "hurdles.svg",
        "info": "App: Die Laufreihenfolge kann digital verändert werden, welche dann direkt bei der Zeitnehmung im Ziel sichtbar ist.\nProtokolle: Es gibt drei Protokolle (Starter, Zeitnehmung, Gruppenbetreuer) und etwaige Änderungswünsche in der Bahnverteilung müssen in allen Protokollen vermerkt werden.",

    },
    "1000 Meter Lauf": {
        "image": "run.svg",
        "info": "Alle Athlet:innen starten gleichzeitig und müssen ihre Startnummer gut sichtbar vorne tragen, damit sie bei jedem Rundendurchgang gelesen und notiert werden können. Die Helfer läuten die letzte Runde ein. Der Zieleinlauf (Startnummern) muss von einem Helfer mitgeschrieben werden. \nIm Ziel soll für die Athleten ein isotonisches Getrönk vorbereitet sein, welches in der Küche samt Bechern erhältnlich ist. Auch soll ein Abfallbehälter für die benutzten Becher vorhanden sein."
    },
    "60 Meter Hürden": {
        "image": "hurdles.svg",
        "info": "App: Die Laufreihenfolge kann digital verändert werden, welche dann direkt bei der Zeitnehmung im Ziel sichtbar ist.\nProtokolle: Es gibt drei Protokolle (Starter, Zeitnehmung, Gruppenbetreuer) und etwaige Änderungswünsche in der Bahnverteilung müssen in allen Protokollen vermerkt werden.",
    },
    "60 Meter Lauf": {
        "image": "sprint.svg",
        "info": "App: Die Laufreihenfolge kann digital verändert werden, welche dann direkt bei der Zeitnehmung im Ziel sichtbar ist.\nProtokolle: Es gibt drei Protokolle (Starter, Zeitnehmung, Gruppenbetreuer) und etwaige Änderungswünsche in der Bahnverteilung müssen in allen Protokollen vermerkt werden."
    },
    "Vortex": {
        "image": "javelin_throw.svg",
        "info": ""
    },
    "1200 Meter Cross Lauf": {
        "image": "run.svg",
        "info": "Alle Athlet:innen starten gleichzeitig und müssen ihre Startnummer gut sichtbar vorne tragen, damit sie bei jedem Rundendurchgang gelesen und notiert werden können. Die Helfer läuten die letzte Runde ein. Der Zieleinlauf (Startnummern) muss von einem Helfer mitgeschrieben werden. \nIm Ziel soll für die Athleten ein isotonisches Getrönk vorbereitet sein, welches in der Küche samt Bechern erhältnlich ist. Auch soll ein Abfallbehälter für die benutzten Becher vorhanden sein."
    },
    "Schlagball": {
        "image": "javelin_throw.svg",
        "info": ""
    }
}