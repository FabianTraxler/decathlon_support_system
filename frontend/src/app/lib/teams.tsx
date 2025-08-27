import { PopUp } from "@/app/lib/achievement_edit/popup";
import { Team } from "@/app/lib/achievement_edit/teams";
import { Athlete, fetch_all_athletes } from "@/app/lib/athlete_fetching";
import { LoadingAnimation, LoadingButton } from "@/app/lib/loading";
import { useEffect, useState } from "react";

export function TeamsTable({show_points}: {show_points?: boolean}) {
    return (
        <div className="flex flex-col items-center p-6 pb-10 2xl:p-10 overflow-scroll w-full h-[95vh] sm:h-screen">
            <div className="items-center justify-between p-1 w-full ">
                <div className='text-2xl font-bold p-4 border rounded-lg shadow-lg '>
                    <div className='flex justify-between hover:cursor-pointer'>
                        <span>Teams</span>
                    </div>
                    <div className={"mt-5 text-sm 2xl:text-md font-normal overflow-x-scroll h-full"}>
                        <Teams show_points={show_points}></Teams>
                    </div>
                </div>
            </div>
        </div>
    )
}



function Teams({show_points}: {show_points?: boolean}) {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [addTeamPopupOpen, setAddTeamPopupOpen] = useState(false);

    var new_team = {
        team_name: "",
        athlete_infos: [] as Athlete[],
        total_points: 0,
        paid: false,
    } as Team

    async function fetchTeams() {
        setLoading(true);
        const response = await fetch('/api/teams');
        if (response.ok) {
            const data = await response.json();
            setTeams(data);
        } else {
            console.error('Failed to fetch teams');
        }
        setLoading(false);
    }

    useEffect(() => {
        fetchTeams();
    }, []);

    const refreshTeams = function () {
        fetchTeams();
    }

    return (
        <div>
            {loading ?
                <div className="flex justify-center">
                    <div className=" h-48 w-48">
                        <LoadingAnimation></LoadingAnimation>
                    </div>
                </div>
                :
                <table className="min-w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-300">
                            <th className="border border-gray-300 px-4 py-2">Team Name</th>
                            <th className="border border-gray-300 px-4 py-2">Bezahlt</th>
                            {show_points && <th className="border border-gray-300 px-4 py-2">Gesamt-Punkte</th>}
                            <th className="border border-gray-300 px-4 py-2">Mitglied 1</th>
                            <th className="border border-gray-300 px-4 py-2">Mitglied 2</th>
                            <th className="border border-gray-300 px-4 py-2">Mitglied 3</th>
                            <th className="border border-gray-300 px-4 py-2">Mitglied 4</th>
                            <th className="border border-gray-300 px-4 py-2">Mitglied 5</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teams.map((team, index) => (
                            <TeamRow key={index} team={team} index={index} refresh={refreshTeams} show_points={show_points}/>
                        ))}
                    </tbody>
                </table>
            }
            <div className="text-lg flex justify-end mt-4 p-4">
                <button
                    onClick={() => setAddTeamPopupOpen(true)}
                    className="bg-stw_green rounded-lg shadow-md shadow-black p-2">Team hizufügen</button>
            </div>
            {addTeamPopupOpen &&
                <TeamDetailsPopup team={new_team} onClose={() => { setAddTeamPopupOpen(false); refreshTeams(); }} new_team={true} />
            }
        </div>

    );
}

function TeamRow({ team, index, refresh, show_points}: { team: Team, index: number, refresh: () => void, show_points?: boolean }) {
    const [popupOpen, setPopupOpen] = useState(false);

    let athletes = team.athlete_infos ? team.athlete_infos : [];
    return (
        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
            <td className="border border-gray-300 px-4 py-2 text-center hover:bg-slate-400 hover:cursor-pointer" onClick={() => setPopupOpen(true)}>
                {team.team_name}
            </td>
            <td className="border border-gray-300 px-4 py-2 text-center">
                {team.paid ? <span>&#9989;</span> : <span>&#10060;</span>}
            </td>
            {show_points && <td className="border border-gray-300 px-4 py-2 text-center">{team.total_points}</td>}
            {athletes.map((athlete, idx) => (
                <td key={idx} className="border border-gray-300 px-4 py-2 text-center">
                    {athlete.name} {athlete.surname} {show_points && <span>({athlete.total_points} Pkt.)</span> }
                </td>
            )
            )}
            {popupOpen && <TeamDetailsPopup team={team} onClose={() => { setPopupOpen(false); refresh(); }} />}
        </tr>
    );
}

function TeamDetailsPopup({ team, onClose, new_team }: { team: Team, onClose: () => void, new_team?: boolean }) {
    const [athletePopupOpen, setAthletePopupOpen] = useState(false);
    const [athletes, setAthletes] = useState<string[]>(team.athlete_infos.map(a => a.name + "_" + a.surname));
    const [teamName, setTeamName] = useState<string>(team.team_name);
    const [paid, setPaid] = useState<boolean>(team.paid);

    const saveChanges = function () {
        if (athletes.length > 5) {
            alert("Ein Team darf maximal 5 Mitglieder haben.");
            return;
        }
        let update_body = {
            team_name: teamName,
            athletes: athletes,
            paid: paid,
        };

        if (new_team) {
            fetch(`api/team`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(update_body),
            }).then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                else if (response.ok) {
                    onClose();
                }
            }).catch(error => {
                console.error('There was a problem with the fetch operation:', error);
                alert("Fehler beim Ändern des Teams.");
            });
        } else {
            fetch(`api/team?name=${team.team_name}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(update_body),
            }).then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                else if (response.ok) {
                    onClose();
                }
            }).catch(error => {
                console.error('There was a problem with the fetch operation:', error);
                alert("Fehler beim Ändern des Teams.");
            });
        }
        onClose();
    }
    const deleteTeam = function () {
        if (confirm(`Team ${team.team_name} wirklich löschen?`)) {
            fetch(`api/team?name=${team.team_name}`, {
                method: 'DELETE',
            }).then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                else if (response.ok) {
                    onClose();
                }
            }).catch(error => {
                console.error('There was a problem with the fetch operation:', error);
                alert("Fehler beim Löschen des Teams.");
            });
        }
    }


    return (
        <PopUp title="Team Edit" onClose={onClose}>
            <div className="p-4 flex-col items-center w-full" >
                <div className="w-full flex justify-between">
                    <h2 className="text-2xl font-bold mb-4 mr-2">
                        Team-Name:
                    </h2>
                    <h2 className="text-2xl mb-4">
                        <input className="border rounded-md" defaultValue={teamName} onChange={(e) => setTeamName(e.target.value)}></input>
                    </h2>
                </div>
                <div className="lex-col items-left" >
                    <div className="w-full flex justify-between">
                        <h2 className="text-2xl font-bold mb-4 mr-2">
                            Mitglieder:
                        </h2>
                        <button
                            className="bg-stw_orange text-white px-4 py-2 rounded hover:bg-orange-600"
                            onClick={() => setAthletePopupOpen(true)}
                        >
                            Ändern
                        </button>
                    </div>

                    <ul className="list-disc list-inside">
                        {athletes.map((athlete, index) => (
                            <li key={index} className="mb-1 text-lg">
                                {athlete.replace("_", " ")}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="text-xl w-full flex justify-between mt-4">
                    <div>Gezahlt?</div>
                    <div>
                        {paid ?
                            <span
                                onClick={() => setPaid(false)}
                                className="hover:cursor-pointer hover:bg-red-500 text-xl">
                                &#9989;
                            </span>
                            :
                            <span
                                onClick={() => setPaid(true)}
                                className="hover:cursor-pointer text-xl">
                                &#x25a2;
                            </span>
                        }
                    </div>
                </div>
                <div className="w-full flex justify-between mt-6">
                    {!new_team &&
                        <button
                            className="mt-3 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                            onClick={deleteTeam}
                        >
                            Löschen
                        </button>
                    }


                    <button
                        className="mt-3 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        onClick={saveChanges}
                    >
                        Speichern
                    </button>

                </div>

            </div>
            {athletePopupOpen && <AthleteDetailsPopup selectedAthletes={athletes} updateAthletes={setAthletes} onClose={() => setAthletePopupOpen(false)} />}

        </PopUp>
    );
}

function AthleteDetailsPopup({ selectedAthletes, updateAthletes, onClose }: { selectedAthletes: string[], updateAthletes: (athletes: string[]) => void, onClose: () => void }) {
    const [allAthletes, setAllAthletes] = useState<Athlete[]>([]);
    useEffect(() => {
        fetch_all_athletes(setAllAthletes);
    }, []);

    return (
        <PopUp title="Alle Athlet:innen" onClose={onClose}>
            {allAthletes.length == 0 ?
                <div className="w-full h-full flex items-center  justify-center">
                    <div className="h-48 w-48">
                        <LoadingAnimation></LoadingAnimation>
                    </div>
                </div>
                :
                <div className="p-4 flex-col items-center" >
                    <AthleteSearchSelectTable allAthletes={allAthletes} selectedAthletes={selectedAthletes} updateAthletes={updateAthletes} ></AthleteSearchSelectTable>
                </div>
            }
        </PopUp>
    );
}

function AthleteSearchSelectTable({ allAthletes, selectedAthletes, updateAthletes }: { allAthletes: Athlete[], selectedAthletes: string[], updateAthletes: (athletes: string[]) => void }) {
    const [searchTerm, setSearchTerm] = useState("");

    let filteredAthletes = allAthletes.filter(athlete => {
        const term = searchTerm.toLowerCase();
        return athlete.name.toLowerCase().includes(term) ||
            athlete.surname.toLowerCase().includes(term) ||
            athlete.group_name?.toLowerCase().includes(term);
    });

    filteredAthletes.sort((a, b) => {
        if (a.surname === b.surname) {
            return a.name.localeCompare(b.name);
        }
        return a.surname.localeCompare(b.surname);
    });

    const updateSelected = function (name: string, surname: string, select: boolean) {
        let identifier = name + "_" + surname;
        let newSelected = [...selectedAthletes];
        if (select) {
            newSelected.push(identifier);
        } else {
            newSelected = newSelected.filter(a => a !== identifier);
        }
        updateAthletes(newSelected);
    }

    return (
        <div className="overflow-scroll h-[60vh] w-[90vw]">
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Suche nach Name, Vorname, JG, Gruppe"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border border-gray-300 rounded px-4 py-2 w-full"
                />
            </div>
            <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                    <tr>
                        <th className="border border-gray-300 px-4 py-2">Gewählt</th>
                        <th className="border border-gray-300 px-4 py-2">Name</th>
                        <th className="border border-gray-300 px-4 py-2">Vorname</th>
                        <th className="border border-gray-300 px-4 py-2">JG</th>
                        <th className="border border-gray-300 px-4 py-2">Gruppe</th>
                        <th className="border border-gray-300 px-4 py-2">Punkte</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredAthletes.map((athlete, index) => {
                        let selected = selectedAthletes.includes(athlete.name + "_" + athlete.surname);
                        return (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                                <td className="border border-gray-300 px-4 py-2 text-center">
                                    {selected ?
                                        <span
                                            onClick={() => updateSelected(athlete.name, athlete.surname, false)}
                                            className="hover:cursor-pointer hover:bg-red-500 text-xl">
                                            &#9989;
                                        </span>
                                        :
                                        <span
                                            onClick={() => updateSelected(athlete.name, athlete.surname, true)}
                                            className="hover:cursor-pointer text-xl">
                                            &#x25a2;
                                        </span>
                                    }
                                </td>
                                <td className="border border-gray-300 px-4 py-2 text-center">{athlete.surname}</td>
                                <td className="border border-gray-300 px-4 py-2 text-center">{athlete.name}</td>
                                <td className="border border-gray-300 px-4 py-2 text-center">{new Date(athlete.birth_date * 1000).getFullYear()}</td>
                                <td className="border border-gray-300 px-4 py-2 text-center">{athlete.group_name}</td>
                                <td className="border border-gray-300 px-4 py-2 text-center">{athlete.total_points}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>

    );
}