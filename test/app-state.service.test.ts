import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CompetitorType, EventStatus, ScoreType, Sport } from '../src/enums';
import { NamesMapping, SportEvent } from '../src/models';
import { appStateService } from '../src/services/app-state.service';
import { mappingService } from '../src/services/mapping.service';
import { sportEventsService } from '../src/services/sport-events.service';

vi.mock('../src/services/sport-events.service', () => ({
    sportEventsService: {
        getEventsList: vi.fn(),
    },
}));
vi.mock('../src/services/mapping.service', () => ({
    mappingService: {
        getName: vi.fn((val) => val),
        namesMapping: {
            getValue: vi.fn(),
        },
    },
}));

describe('AppStateService', () => {
    const rawState =
        '1,FOOTBALL,UEFA,1750694966496,Barcelona,Manchester United,LIVE,CURRENT@9:8|PERIOD_1@7:8|PERIOD_2@2:0';
    const namesMapping: NamesMapping = new Map();
    const parsedEvent: SportEvent = {
        id: '1',
        status: EventStatus.Live,
        scores: {
            CURRENT: { type: ScoreType.Current, home: '9', away: '8' },
            PERIOD_1: { type: ScoreType.Period1, home: '7', away: '8' },
            PERIOD_2: { type: ScoreType.Period2, home: '2', away: '0' },
        },
        startTime: '2025-06-23T16:09:26.496Z',
        sport: Sport.Football,
        competitors: {
            HOME: { type: CompetitorType.Home, name: 'Barcelona' },
            AWAY: { type: CompetitorType.Away, name: 'Manchester United' },
        },
        competition: 'UEFA',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getState returns parsed state from backend', async () => {
        (sportEventsService.getEventsList as any).mockResolvedValue({
            data: { odds: rawState },
        });
        (mappingService.namesMapping.getValue as any).mockResolvedValue(
            namesMapping
        );

        const state = await appStateService.getState();
        expect(state.get('1')).toMatchObject(parsedEvent);
    });

    it('getState returns cached state on error', async () => {
        const cached = new Map([['1', parsedEvent]]);
        appStateService.setState(cached);
        (sportEventsService.getEventsList as any).mockRejectedValue(
            new Error('fail')
        );

        const state = await appStateService.getState();
        expect(state).toBe(cached);
    });

    it('getCachedState returns current state', () => {
        const cached = new Map([['1', parsedEvent]]);
        appStateService.setState(cached);
        expect(appStateService.getCachedState()).toBe(cached);
    });

    it('setState updates the state', () => {
        const newState = new Map([['1', parsedEvent]]);
        appStateService.setState(newState);
        expect(appStateService.getCachedState()).toBe(newState);
    });

    it('getEventById returns event by id', () => {
        const state = new Map([['1', parsedEvent]]);
        appStateService.setState(state);
        expect(appStateService.getEventById('1')).toBe(parsedEvent);
        expect(appStateService.getEventById('2')).toBeUndefined();
    });

    it('applyChanges marks removed events', () => {
        const event1 = { ...parsedEvent, id: '1', status: EventStatus.Live };
        const event2 = { ...parsedEvent, id: '2', status: EventStatus.Live };
        appStateService.setState(
            new Map([
                ['1', event1],
                ['2', event2],
            ])
        );
        const newState = new Map([['1', event1]]);
        const updated = appStateService.applyChanges(newState);
        expect(updated.get('2')?.status).toBe(EventStatus.Removed);
        expect(updated.get('1')).toEqual(event1);
    });

    it('getChanges detects status and score changes', () => {
        const oldEvent = {
            ...parsedEvent,
            status: EventStatus.Live,
            scores: {
                CURRENT: { type: ScoreType.Current, home: '1', away: '2' },
            },
        };
        const newEvent = {
            ...parsedEvent,
            status: EventStatus.Removed,
            scores: {
                CURRENT: { type: ScoreType.Current, home: '2', away: '2' },
            },
        };
        const oldState = new Map([['1', oldEvent]]);
        const newState = new Map([['1', newEvent]]);
        const changes = appStateService.getChanges(oldState, newState);
        expect(changes).toEqual([
            {
                id: '1',
                type: 'Change in status',
                oldValue: EventStatus.Live,
                newValue: EventStatus.Removed,
            },
            {
                id: '1',
                type: 'Change in CURRENT score',
                oldValue: '1:2',
                newValue: '2:2',
            },
        ]);
    });

    it('getChanges detects new period scores', () => {
        const oldEvent = { ...parsedEvent, scores: {} };
        const newEvent = {
            ...parsedEvent,
            scores: {
                CURRENT: { type: ScoreType.Current, home: '1', away: '2' },
            },
        };
        const oldState = new Map([['1', oldEvent]]);
        const newState = new Map([['1', newEvent]]);
        const changes = appStateService.getChanges(oldState, newState);
        expect(changes).toEqual([
            {
                id: '1',
                type: 'New period CURRENT',
                oldValue: null,
                newValue: '1:2',
            },
        ]);
    });
});
