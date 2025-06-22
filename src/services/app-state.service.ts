import { inspect } from 'node:util';
import { EventStatus, Sport } from '../enums';
import {
    formatCompetitors,
    formatScores,
    formatStartTime,
} from '../formatters';
import { AppState, EventChange, Id, NamesMapping, SportEvent } from '../models';
import { mappingService } from './mapping.service';
import { sportEventsService } from './sport-events.service';

/**
 * Service for managing the application state of sport events.
 * Handles fetching, caching, updating, and diffing event states.
 */
class AppStateService {
    private state: AppState = new Map<Id, SportEvent>();

    /**
     * Fetches the latest state from the backend and parses it.
     * Falls back to cached state on error.
     * @returns {Promise<AppState>} The parsed application state.
     */
    public async getState(): Promise<AppState> {
        try {
            const response = await sportEventsService.getEventsList();
            return this.parseState(
                response.data.odds,
                await mappingService.namesMapping.getValue()
            );
        } catch (e) {
            console.error(
                `There's been an error fetching the state: ${inspect(e, { depth: null })}`
            );
            return this.state;
        }
    }

    /**
     * Returns the currently cached application state.
     * @returns {AppState} The cached state.
     */
    public getCachedState(): AppState {
        return this.state;
    }

    /**
     * Sets the internal application state.
     * @param {AppState} state - The new state to cache.
     */
    public setState(state: AppState): void {
        this.state = state;
    }

    /**
     * Retrieves a specific event by its ID from the cached state.
     * @param {Id} id - The event ID.
     * @returns {SportEvent | undefined} The event, if found.
     */
    public getEventById(id: Id): SportEvent | undefined {
        return this.state.get(id);
    }

    /**
     * Applies changes from a new state to the current state,
     * marking removed events as such.
     * @param {AppState} newState - The new state to apply.
     * @returns {AppState} The updated state.
     */
    public applyChanges(newState: AppState): AppState {
        const currentEvents: string[] = [];
        const updatedState: AppState = new Map();

        for (const event of newState.values()) {
            currentEvents.push(event.id);
            updatedState.set(event.id, event);
        }
        for (const [id, event] of this.state.entries()) {
            if (
                !currentEvents.includes(id) &&
                event.status !== EventStatus.Removed
            ) {
                updatedState.set(id, { ...event, status: EventStatus.Removed });
            }
        }

        return updatedState;
    }

    /**
     * Computes the list of changes between two states.
     * @param {AppState} oldState - The previous state.
     * @param {AppState} newState - The new state.
     * @returns {EventChange[]} List of detected changes.
     */
    public getChanges(oldState: AppState, newState: AppState): EventChange[] {
        const changes: EventChange[] = [];

        for (const [id, newEvent] of newState.entries()) {
            const oldEvent = oldState.get(id);
            if (oldEvent) {
                if (oldEvent.status !== newEvent.status) {
                    changes.push({
                        id,
                        type: 'Change in status',
                        oldValue: oldEvent.status,
                        newValue: newEvent.status,
                    });
                }
                changes.push(
                    ...this.getScoresDiff(id, oldEvent.scores, newEvent.scores)
                );
            }
        }
        return changes;
    }

    /**
     * Parses the raw state string into an AppState object.
     * @param {string} rawState - The raw state string.
     * @param {NamesMapping} namesMapping - Mapping for names.
     * @returns {AppState} The parsed state.
     */
    private parseState(rawState: string, namesMapping: NamesMapping): AppState {
        const events = rawState.split('\n');
        return events.reduce((acc, event) => {
            const eventProps = event.split(',');
            if (eventProps.length >= 8) {
                const [
                    id,
                    sport,
                    competition,
                    startTime,
                    homeCompetitor,
                    awayCompetitor,
                    status,
                    scoresString,
                ] = eventProps;

                try {
                    acc.set(id, {
                        id,
                        status: mappingService.getName(
                            status,
                            namesMapping
                        ) as EventStatus,
                        scores: formatScores(scoresString, namesMapping),
                        startTime: formatStartTime(startTime),
                        sport: mappingService.getName(
                            sport,
                            namesMapping
                        ) as Sport,
                        competitors: formatCompetitors(
                            homeCompetitor,
                            awayCompetitor,
                            namesMapping
                        ),
                        competition: mappingService.getName(
                            competition,
                            namesMapping
                        ),
                    });
                } catch (e) {
                    console.error(
                        `There's been an error parsing event: ${e.message}`
                    );
                }
            }
            return acc;
        }, new Map<Id, SportEvent>());
    }

    /**
     * Computes the score differences for an event between two states.
     * @param {Id} eventId - The event ID.
     * @param {SportEvent['scores']} oldScores - Previous scores.
     * @param {SportEvent['scores']} newScores - New scores.
     * @returns {EventChange[]} List of score changes.
     */
    private getScoresDiff(
        eventId: Id,
        oldScores: SportEvent['scores'],
        newScores: SportEvent['scores']
    ): EventChange[] {
        const changes: EventChange[] = [];

        for (const scoreType in newScores) {
            const newScore = newScores[scoreType];
            const oldScore = oldScores?.[scoreType];
            if (!oldScore) {
                changes.push({
                    id: eventId,
                    type: `New period ${scoreType}`,
                    oldValue: null,
                    newValue: `${newScore.home}:${newScore.away}`,
                });
            } else if (
                oldScore.home !== newScore.home ||
                oldScore.away !== newScore.away
            ) {
                changes.push({
                    id: eventId,
                    type: `Change in ${scoreType} score`,
                    oldValue: `${oldScore.home}:${oldScore.away}`,
                    newValue: `${newScore.home}:${newScore.away}`,
                });
            }
        }
        return changes;
    }
}

export const appStateService = new AppStateService();
