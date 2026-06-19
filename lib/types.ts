export type LitmusRelation = "new_to_litmus" | "end_user" | "contributor";

export interface ScoreRow {
  id: string;
  name: string;
  linkedin: string;
  company: string | null;
  litmus_usage_team: string | null;
  wants_adopters_list: boolean;
  litmus_relation: LitmusRelation;
  wants_community: boolean;
  email: string | null;
  score: number;
  created_at: string;
}

export interface PlayerInfo {
  name: string;
  linkedin: string;
  company: string;
  litmusUsageTeam: string;
  wantsAdoptersList: boolean;
  litmusRelation: LitmusRelation | "";
  wantsCommunity: boolean;
  email: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  company: string | null;
  score: number;
}

export interface SubmitResult {
  ok: boolean;
  error?: string;
  rank?: number;
}
