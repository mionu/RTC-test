import { CompetitorType, ScoreType } from '../enums';
import { SportEvent, Score, NamesMapping } from '../models';
import { mappingService } from '../services';

export const formatScores = (
    scoresString: string,
    namesMapping: NamesMapping
): SportEvent['scores'] => {
    const scores = scoresString.split('|');
    if (scores.every((s) => s.length === 0)) {
        return null;
    }
    return scores.reduce(
        (acc, score) => {
            const [type, homeVsAway] = score.split('@');
            const [home, away] = homeVsAway.split(':');
            const typeName = mappingService.getName(
                type,
                namesMapping
            ) as ScoreType;
            acc[typeName] = {
                type: typeName,
                home,
                away,
            };
            return acc;
        },
        {} as Record<ScoreType, Score>
    );
};

export const formatStartTime = (startTime: string): string => {
    return new Date(+startTime).toISOString();
};

export const formatCompetitors = (
    homeCompetitor: string,
    awayCompetitor: string,
    namesMapping: NamesMapping
): SportEvent['competitors'] => {
    return {
        [CompetitorType.Home]: {
            type: CompetitorType.Home,
            name: mappingService.getName(homeCompetitor, namesMapping),
        },
        [CompetitorType.Away]: {
            type: CompetitorType.Away,
            name: mappingService.getName(awayCompetitor, namesMapping),
        },
    };
};
