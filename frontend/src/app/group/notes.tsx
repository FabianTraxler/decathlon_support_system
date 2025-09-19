import Title_Footer_Layout from "./subpage_layout";
import { discipline_mapping } from "../lib/config";
import { useEffect, useState } from "react";
import { useAsyncError } from "../lib/asyncError";
import { Discipline } from "../lib/interfaces";
import { set } from "zod";

export default function NotesPage({discipline, group_name}:{discipline: string, group_name: string}) {

    return (
        <Title_Footer_Layout title="Notizen">
            <Notes page={"Notizen"} group_name={group_name}></Notes>
        </Title_Footer_Layout>
    )
}

export function Notes({page, group_name}:{page: string, group_name: string}) {
    const [selectedDiscipline, setSelectedDiscipline] = useState("Allgemein");
    const [content, setContent] = useState("");
    const [disciplines, setGroupDisciplines] = useState<string[]>([]);
    const [noteSaved, setNoteSaved] = useState(true);
    const throwError = useAsyncError();

    useEffect(() => {
        let api_url = `/api/disciplines?name=${group_name}`

        fetch(api_url)
            .then(res => {
                if (res.ok) {
                    return res.json()
                } else {
                    throwError(new Error(`Network response was not ok: ${res.status} - ${res.statusText}`));
                }
            })
            .then(res => {
                let disciplines = res as Discipline[]
                let discipline_names = disciplines.map(d => d.name);
                setGroupDisciplines(discipline_names)
                if(discipline_names.includes(page)) {
                    setSelectedDiscipline(page);
                }
            })
            .catch((e) => {
                throwError(e);
                setGroupDisciplines([])
            })
    }, [group_name])

    // Fetch the content based on the selected discipline
    useEffect(() => {  
        let api_url = `/api/notes?discipline=${selectedDiscipline}&group_name=${group_name}`;
        fetch(api_url)
            .then(res => {
                if (res.ok) {
                    return res.text();
                } else if (res.status === 404) {
                    // If the note does not exist, return an empty string
                    return "";
                } else {
                    throw new Error(`Network response was not ok: ${res.status} - ${res.statusText}`);
                }
            })
            .then(text => {
                setContent(text);
            })
            .catch((e) => {
                console.error("Error fetching notes:", e);
                setContent("Fehler beim Laden der Notizen.")
            });
    }, [selectedDiscipline]);

    const saveNote = () => {
        let api_url = `/api/notes?discipline=${selectedDiscipline}&group_name=${group_name}`;
        fetch(api_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: content,
        })
        .then(res => {
            if (res.ok) {
                setNoteSaved(true);
            } else {
                throw new Error(`Network response was not ok: ${res.status} - ${res.statusText}`);
            }
        })
        .catch((e) => {
            console.error("Error saving note:", e);
            alert("Fehler beim Speichern der Notiz.");
        });
    }

    const noteUpdated = (content: string) => {
        setContent(content);
        setNoteSaved(false);
    }

    return (
        <div className="w-screen items-center justify-center">
            <div className="w-full text-2xl font-bold text-center p-4 rounded-md shadow-md shadow-slate-700">
                <select
                    className="p-2 rounded border border-gray-300"
                    value={selectedDiscipline}
                    onChange={(e) => setSelectedDiscipline(e.target.value)}
                >
                    <option value="Allgemein">Allgemein</option>
                    {disciplines.map((name) => (
                        <option key={name} value={name} selected={name == selectedDiscipline}>{name} </option>
                    ))}
                </select>
            </div>
            <div className="flex flex-col items-right w-full text-lg p-4 mt-4 rounded-md shadow-md shadow-slate-700 bg-gray-100">
                <textarea 
                key="note"
                className="w-full min-h-[35vh] p-2 rounded border border-gray-300 bg-white" 
                placeholder="Hier Notizen eingeben..."
                value={content}
                onChange={(e) => noteUpdated(e.target.value)}>
                </textarea>
                <button onClick={saveNote} className={"border border-black p-2 shadow-md rounded " + (noteSaved ? "bg-stw_green " : "bg-stw_orange")}>Speichern</button>
            </div>
        </div>
    )
}