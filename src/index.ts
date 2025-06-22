import express from 'express';
import cron from 'node-cron';
import { monitorEventChanges } from './cron-handler';
import { EventStatus } from './enums';
import { AppState } from './models';
import { appStateService } from './services';

const app = express();
const port = process.env.PORT || 4000;

app.get('/client/state', async (_req, res) => {
    const activeEvents: AppState = new Map();
    const events = appStateService.getCachedState();
    for (const [id, event] of events.entries()) {
        if (event.status !== EventStatus.Removed) {
            activeEvents.set(id, event);
        }
    }
    res.json(Object.fromEntries(activeEvents));
});

cron.schedule('* * * * * *', async () => {
    await monitorEventChanges();
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
