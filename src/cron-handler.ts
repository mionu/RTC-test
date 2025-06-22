import { EventChange } from './models';
import { appStateService, CachedValue } from './services';

let tick = 0;
const appState = new CachedValue(async () => appStateService.getState(), 0);

export const monitorEventChanges = async () => {
    console.log(`Tick ${++tick}`);
    const newState = await appState.getValue();
    const updatedState = appStateService.applyChanges(newState);
    logChanges(
        appStateService.getChanges(
            appStateService.getCachedState(),
            updatedState
        )
    );
    appStateService.setState(updatedState);
};

export const logChanges = (changes: EventChange[]): void => {
    changes.forEach((change) => {
        const event = appStateService.getEventById(change.id)!;
        const eventDetails = `${event.sport}, ${event.competition}: ${event.competitors.HOME.name} VS ${event.competitors.AWAY.name}`;
        const changeDetails = `${change.type}: ${change.oldValue} -> ${change.newValue}`;
        console.log(`[${eventDetails}]: ${changeDetails}`);
    });
};
