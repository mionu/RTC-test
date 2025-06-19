import { CompetitorType, EventStatus, ScoreType, Sport } from '../enums';
import { AppState, Id, NamesMapping, Score, SportEvent } from '../models';
import { MappingService } from './mapping.service';
import { SportEventsService } from './sport-events.service';

export class AppStateService {
    public static getRawState: () => Promise<AppState> = async () => {
        const response = await SportEventsService.getEventsList();
        return AppStateService.parseState(response.data.odds);
    }

    public static getState: () => Promise<AppState> = async () => {
        const response = await SportEventsService.getEventsList();
        return AppStateService.parseState(response.data.odds, await MappingService.MAPPING.getValue());
    }

    public static parseState = (rawState: string, namesMapping: NamesMapping = new Map()) => {
        const events = rawState.split('\n');
        return events.reduce((acc, event) => {
            const [id, sport, competition, startTime, homeCompetitor, awayCompetitor, status, scoresString] = event.split(',');
            const scores = scoresString.split('|');

            acc.set(id, {
                id,
                status: (namesMapping.get(status) ?? status) as EventStatus,
                scores: scores.some(s => s.length > 0) ? scores.reduce((acc, score) => {
                    const [type, homeVsAway] = score.split('@');
                    const [home, away] = homeVsAway.split(':');
                    const typeName = (namesMapping.get(type) ?? type) as ScoreType;
                    acc[typeName] = { type: typeName, home, away };
                    return acc;
                }, {} as Record<ScoreType, Score>) : null,
                startTime: new Date(+startTime).toISOString(),
                sport: (namesMapping.get(sport) ?? sport) as Sport,
                competitors: {
                    [CompetitorType.Home]: {
                        type: CompetitorType.Home,
                        name: namesMapping.get(homeCompetitor) ?? homeCompetitor,
                    },
                    [CompetitorType.Away]: {
                        type: CompetitorType.Away,
                        name: namesMapping.get(awayCompetitor) ?? awayCompetitor,
                    },
                },
                competition: namesMapping.get(competition) ?? competition,
            });
            return acc;
        }, new Map<Id, SportEvent>);
    }
}