import { CompetitorType, EventStatus, ScoreType, Sport } from '../enums';
import { Nullable } from './common.models';

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
    scores: Nullable<Partial<Record<ScoreType, Score>>>;
    startTime: string;
    sport: Sport;
    competitors: { [type in CompetitorType]: Competitor };
    competition: string;
}

export interface EventChange {
    id: Id;
    type: string;
    oldValue: Nullable<string>;
    newValue: string;
}
