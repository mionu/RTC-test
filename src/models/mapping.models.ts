import { CompetitorType, EventStatus, ScoreType, Sport } from '../enums';

export type Id = string;

export type AppState = Map<Id, SportEvent>;
export type NamesMapping = Map<Id, string>;

export interface Score {
    type: ScoreType;
    home: string;
    away: string;
}

export interface Competitor {
    type: CompetitorType;
    name: string;
}

export interface SportEvent {
    id: Id;
    status: EventStatus;
    scores: Record<ScoreType, Score> | null;
    startTime: string;
    sport: Sport;
    competitors: { [type in CompetitorType]: Competitor };
    competition: string;
}