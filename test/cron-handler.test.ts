import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest';
import { logChanges } from '../src/cron-handler';
import { CompetitorType, EventStatus, ScoreType, Sport } from '../src/enums';
import { appStateService } from '../src/services';

describe('logChanges', () => {
    let logSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        appStateService.getEventById = vi.fn((id: string) => ({
            id,
            sport: Sport.Football,
            competition: 'Premier League',
            competitors: {
                HOME: { type: CompetitorType.Home, name: 'Team A' },
                AWAY: { type: CompetitorType.Away, name: 'Team B' },
            },
            startTime: '123',
            status: EventStatus.Live,
            scores: {
                CURRENT: { type: ScoreType.Current, home: '1', away: '0' },
            },
        }));
    });

    afterEach(() => {
        logSpy.mockRestore();
        vi.clearAllMocks();
    });

    it('logs formatted change details for each change', () => {
        const changes = [
            {
                id: '1',
                type: 'score',
                oldValue: '0',
                newValue: '1',
            },
        ];
        logChanges(changes);

        expect(logSpy).toHaveBeenCalledWith(
            '[FOOTBALL, Premier League: Team A VS Team B]: score: 0 -> 1'
        );
    });

    it('does nothing if changes is empty', () => {
        logChanges([]);
        expect(logSpy).not.toHaveBeenCalled();
    });
});
