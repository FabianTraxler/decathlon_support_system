import { Athlete } from "../athlete_fetching"

export interface Team {
  team_name: string,
  total_points: number,
  paid: boolean,
  athlete_infos: Athlete[]
}
