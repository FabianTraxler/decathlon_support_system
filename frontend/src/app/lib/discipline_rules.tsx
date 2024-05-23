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
    "intro": " Bald startet wieder unser Favoritner Jedermann-Zehnkampf, der dank der guten Organisation und des Einsatzes vieler freiwilliger Helfer zu einem Fixpunkt im Wiener Leichtathletikkalender geworden ist. Diese Anerkennung macht es wieder notwendig, den erreichten Standard dieser Veranstaltung zumindest zu halten, wenn nicht zu verbessern.\nDazu gehört auch, dass die Helfer im Rahmen der Betreuung der einzelnen Gruppen und der jeweilige Gruppenbetreuer ein harmonisches Team bilden, was natürlich nur dann gegeben ist, wenn jeder seine Aufgaben genau kennt. Da sich nun in den Reihen der Helfer einige 'Neulinge' befinden, enthält dieses Merkblatt kurz wichtige Informationen über den Wettkampfablauf und die sich daraus ergebenden Aufgaben für die Helfer, um einen reibungslosen und sicheren Wettkampf durchführen zu können.",
    "general": "Für unseren Zehnkampf gelten die Regeln wie bei Verbandswettkämpfen. Ausnahmen sind jedoch die Hürdenhöhe und die getauschte Bewerbreihenfolge in den 'geraden' Gruppen (die Bewerbe 2, 3 und 4 werden mit den Bewerben 7, 8 und 9 getauscht).\nFür den Ablauf der Bewerbe (zeitlich, organisatorisch) ist der Gruppenbetreuer zuständig, der dabei von den Helfern tatkräftig unterstützt wird. Er ist letztlich auch für die Gültigkeit des durchgeführten Versuchs verantwortlich.\nVor Beginn des Aufwärmens sollten die Athleten aufmerksam gemacht werden, dass sie keine Wertsachen in den Garderoben belassen und dort auch keine Spikes benutzen.\nUm den gesamten Zeitablauf nicht zu gefährden, sollen die angegebenen Beginn- und Endzeiten möglichst eingehalten oder sogar etwas Zeit gut gemacht werden. Die halbe Stunde, die zwischen den Bewerben zur Verfügung steht, kann bei Anwesenheit des Gruppenbetreuers schon zum Einspringen oder Einwerfen benutzt werden. Dazu ist eine zeitgerechte Kontrolle der benötigten Sportgeräte bei den Sportstätten notwendig. Falls diese fehlen, sind diese bei Christian Swoboda oder Fabian Traxler zu erhalten und nach dem Bewerb wieder abzugeben (außer die nachfolgende Gruppe ist schon am Platz).\n Für alle Bewerbe sind die Protokolle in Mappen jeweils zeitgerecht vor dem Beginn beim Wettkampfbüro abzuholen. In diesen Mappen sind auch die Zeitpläne und die Lage der Wettkampfstätten enthalten.\nNach Beendigung eines Bewerbs sind die ausgefüllten Protokolle ins Wettkampfbüro zu bringen.\nZweckmäßig ist es, bei allen Versuchen den Athleten und den nachfolgenden Athleten aufzurufen, was die Abwicklung beschleunigt und den Athleten mehr Zeit zwischen den einzelnen Bewerben gibt.\nEtwa in der Mitte jedes Wettkampftages sind für die Athleten in der Küche Bananen als Zwische",
    "thanks": " Als 'Dankeschön!' für die Bemühungen der Helfer, unseren Zehnkampf zu einem erfolgreichen und positiven Erlebnis zu machen, werden sie bei unserem Buffet kostenlos verwöhnt. Außerdem gibt es für die Betreuer und Helfer einen Essensbon für die Grillparty am Samstag, wobei der Bon bis 12 Uhr bei der Anmeldungsstelle abgeholt werden soll."
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