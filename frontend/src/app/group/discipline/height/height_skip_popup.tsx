import { useCallback, useEffect, useMemo, useState } from "react";
import { update_height_achievement } from "@/app/lib/achievement_edit/api_calls";
import { Athlete } from "@/app/lib/athlete_fetching";
import { AthleteHeightResults } from "@/app/lib/interfaces";
import { useAsyncError } from "@/app/lib/asyncError";
import { decode_athlete_tries } from "./height_discipline";
import { update_try_string_with_skip } from "./achievement_input";

interface ActiveHeightAthlete {
	id: string,
	name: string,
	surname: string,
	starting_number: number,
	current_height: number,
	current_try: number,
	result: AthleteHeightResults
}

export function HeightSkipPopupContent({ group_name, discipline_name, close }: { group_name: string, discipline_name: string, close: () => void }) {
	const throwError = useAsyncError();
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [allAthletes, setAllAthletes] = useState<ActiveHeightAthlete[]>([]);
	const [activeAthletes, setActiveAthletes] = useState<ActiveHeightAthlete[]>([]);
	const [selectedAthleteId, setSelectedAthleteId] = useState<string | undefined>(undefined);
	const [skipCount, setSkipCount] = useState(0);
	const [searchQuery, setSearchQuery] = useState("");

	const min_start_height = discipline_name == "Hochsprung" ? 80 : 120;
	const default_height_increase = discipline_name == "Hochsprung" ? 4 : 20;

	const selectedAthlete = useMemo(
		() => activeAthletes.find((athlete) => athlete.id === selectedAthleteId),
		[activeAthletes, selectedAthleteId]
	);

	const upcomingHeights = useMemo(() => {
		if (!selectedAthlete) {
			return [];
		}
		const step = selectedAthlete.result.height_increase || default_height_increase;
		return Array.from({ length: 5 }, (_, i) => selectedAthlete.current_height + i * step);
	}, [selectedAthlete, default_height_increase]);

	const loadAthletes = useCallback(function () {
		if (!group_name || !discipline_name) {
			setAllAthletes([]);
			setActiveAthletes([]);
			return;
		}

		setLoading(true);
		fetch(`/api/group?name=${group_name}`)
			.then((res) => {
				if (res.ok) {
					return res.json();
				}
				throw new Error(`Network response was not ok: ${res.status} - ${res.statusText}`);
			})
			.then((res) => {
				const athletes: Athlete[] = res.athletes || [];
				const nextAthletes: ActiveHeightAthlete[] = [];

				athletes.forEach((athlete) => {
					if (athlete.starting_number == undefined) {
						return;
					}

					const achievement_map: Map<string, any> = new Map(Object.entries(athlete.achievements || {}));
					const achievement = achievement_map.get(discipline_name)?.Height;

					const athlete_result: AthleteHeightResults = {
						name: athlete.name,
						surname: athlete.surname,
						age_group: "",
						starting_number: athlete.starting_number,
						discipline_name: discipline_name,
						discipline_unit: achievement?.unit || "cm",
						start_height: achievement?.start_height || min_start_height,
						start_height_set: !!achievement?.start_height,
						height_increase: achievement?.height_increase || default_height_increase,
						tries: achievement?.tries,
						final_result: achievement?.final_result,
						still_active: false,
						current_height: min_start_height,
						current_try: 1,
						full_name: () => athlete.name + "_" + athlete.surname
					};

					try {
						const state = decode_athlete_tries(athlete_result);
						athlete_result.still_active = state.still_active;
						athlete_result.current_height = state.next_height;
						athlete_result.current_try = state.current_try;
						athlete_result.final_result = state.jumped_height;

						if (state.still_active) {
							nextAthletes.push({
								id: athlete_result.full_name(),
								name: athlete_result.name,
								surname: athlete_result.surname,
								starting_number: athlete_result.starting_number || NaN,
								current_height: state.next_height,
								current_try: state.current_try,
								result: athlete_result
							});
						}
					} catch (e) {
						if (e instanceof Error) {
							throwError(e);
						} else {
							throwError(new Error("Unknown error while decoding active height athletes"));
						}
					}
				});

				nextAthletes.sort((a, b) => a.starting_number - b.starting_number);
				setActiveAthletes(nextAthletes);
				setAllAthletes(nextAthletes);

				setSelectedAthleteId((previousSelectedId) => {
					if (previousSelectedId && !nextAthletes.find((athlete) => athlete.id === previousSelectedId)) {
						setSkipCount(0);
						return undefined;
					}
					return previousSelectedId;
				});
			})
			.catch((e) => {
				throwError(e instanceof Error ? e : new Error("Could not load athletes for height skip popup"));
			})
			.finally(() => setLoading(false));
	}, [group_name, discipline_name, min_start_height, default_height_increase, throwError]);

	useEffect(() => {
		loadAthletes();
	}, [loadAthletes]);
	useEffect(() => {
		if (searchQuery.trim() === "") {
			setActiveAthletes(allAthletes);
			return;
		}
		const filteredAthletes = allAthletes.filter((athlete) => {
			const fullName = `${athlete.name} ${athlete.surname}`.toLowerCase();
			var nameMatch = fullName.includes(searchQuery.toLowerCase());
			var startingNumberMatch = athlete.starting_number.toString().includes(searchQuery);
			return nameMatch || startingNumberMatch;
		});
		setActiveAthletes(filteredAthletes);
	}, [searchQuery]);

	const toggleSkipAtIndex = function (index: number) {
		if (skipCount === index + 1) {
			setSkipCount(index);
		} else {
			setSkipCount(index + 1);
		}
	};

	const buildTryStringWithSkippedHeights = function (athlete: ActiveHeightAthlete, count: number): string {
		let temporary_athlete_result: AthleteHeightResults = {
			...athlete.result,
			full_name: () => athlete.result.full_name()
		};

		let current_height = athlete.current_height;
		let current_try = athlete.current_try;

		for (let i = 0; i < count; i++) {
			temporary_athlete_result.tries = update_try_string_with_skip(temporary_athlete_result, current_height, current_try);
			const new_state = decode_athlete_tries(temporary_athlete_result);
			temporary_athlete_result.current_height = new_state.next_height;
			temporary_athlete_result.current_try = new_state.current_try;
			temporary_athlete_result.still_active = new_state.still_active;
			current_height = new_state.next_height;
			current_try = new_state.current_try;
		}

		return temporary_athlete_result.tries || "";
	};

	const saveSkipSelection = function () {
		if (!selectedAthlete || skipCount <= 0 || saving) {
			return;
		}

		setSaving(true);
		try {
			const updated_tries = buildTryStringWithSkippedHeights(selectedAthlete, skipCount);
			const updated_result: AthleteHeightResults = {
				...selectedAthlete.result,
				tries: updated_tries,
				full_name: () => selectedAthlete.result.full_name()
			};

			const decoded = decode_athlete_tries(updated_result);
			updated_result.final_result = decoded.jumped_height;
			updated_result.current_height = decoded.next_height;
			updated_result.current_try = decoded.current_try;
			updated_result.still_active = decoded.still_active;

			update_height_achievement(updated_result, () => {
				setSkipCount(0);
				loadAthletes();
				if (typeof window !== "undefined") {
					window.dispatchEvent(new CustomEvent("height-skip-updated"));
				}
				
			}, true)
			.catch((e) => {
					throwError(e instanceof Error ? e : new Error("Error while saving skipped heights"));
				})
			.finally(() => {
				setSaving(false);
				setSelectedAthleteId(undefined);
				close();
			});
		} catch (e) {
			setSaving(false);
			if (e instanceof Error) {
				throwError(e);
			} else {
				throwError(new Error("Unknown error while preparing skipped heights"));
			}
		}
	};

	return (
		<div className="relative flex-auto p-4 max-h-[95vh] overflow-scroll">
			<div className="grid gap-4">
				
				<div className="text-sm text-slate-700 [@media(max-height:100px)]:hidden">
					Aktive Athlet:innen auswählen und die nächsten 1 bis 5 Höhen überspringen.
				</div>
				<div className="border rounded-md text-xl">
					<input
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Suche..."
						className="w-full focus:outline-none focus:ring focus:border-blue-300"
					></input>
				</div>
				{loading &&
					<div className="text-center font-semibold">Lade Athlet:innen...</div>
				}

				{!loading && activeAthletes.length == 0 &&
					<div className="text-center font-semibold">Keine aktiven Athlet:innen gefunden.</div>
				}

				{!loading && activeAthletes.length > 0 &&
					<div>
						<div className="grid grid-cols-8 border-b bg-white">
							<div className="col-span-1 text-center">#</div>
							<div className="col-span-4">Name</div>
							<div className="col-span-3 text-right">Nächste Höhe</div>
						</div>
						<div className="max-h-[20vh] overflow-scroll border rounded-md">
							{activeAthletes.map((athlete) => {
								const isSelected = selectedAthlete?.id == athlete.id;
								return (
									<div
										key={athlete.id}
										className={"grid grid-cols-8 border-b p-2 hover:cursor-pointer " + (isSelected ? "bg-green-200" : "bg-white")}
										onClick={() => {
											setSelectedAthleteId(athlete.id);
											setSkipCount(0);
										}}
									>
										<div className="col-span-1 text-center">{athlete.starting_number}</div>
										<div className="col-span-4">{athlete.name} {athlete.surname}</div>
										<div className="col-span-3 text-right">{athlete.current_height} cm</div>
									</div>
								);
							})}
						</div>
					</div>
				}

				{selectedAthlete &&
					<div className="border rounded-md p-3 bg-slate-50 overflow-scroll">
						<div className="font-semibold mb-2">
							Ausgewählt: {selectedAthlete.name} {selectedAthlete.surname}
						</div>
						<div className="grid gap-1 max-h-[30vh] overflow-scroll">
							{upcomingHeights.map((height, index) => {
								const checked = index < skipCount;
								return (
									<button
										key={height}
										className={"border rounded-md p-2 text-left " + (checked ? "bg-yellow-200 border-yellow-700" : "bg-white")}
										onClick={() => toggleSkipAtIndex(index)}
										type="button"
									>
										<span className="font-semibold mr-2">{checked ? "[x]" : "[ ]"}</span>
										{height} cm
									</button>
								);
							})}
						</div>
						<div className="mt-3 text-sm">
							Gewählt: {skipCount} Höhe(n) überspringen
						</div>
						<div className="mt-4 flex justify-end">
							<button
								type="button"
								className={"border rounded-md p-2 " + (skipCount > 0 && !saving ? "bg-stw_green shadow-md" : "bg-slate-200")}
								onClick={saveSkipSelection}
								disabled={skipCount <= 0 || saving}
							>
								{saving ? "Speichere..." : "Auswahl speichern"}
							</button>
						</div>
					</div>
				}
			</div>
		</div>
	);
}
