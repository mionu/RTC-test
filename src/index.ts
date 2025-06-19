import express from 'express';
import cron from 'node-cron';

import { AppStateService } from './services';

const app = express();
const port = process.env.PORT || 4000;

app.get('/client/state', async (req, res) => {
    res.json(Object.fromEntries(await AppStateService.getState()));
});

cron.schedule('* * * * * *', async () => {
    // console.log(123);
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
