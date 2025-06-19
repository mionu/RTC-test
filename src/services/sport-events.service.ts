import axios, { AxiosInstance, AxiosResponse } from 'axios';

import { MappingsResponse, StateResponse } from '../models';

export class SportEventsService {
    private static http: AxiosInstance = axios.create({
        baseURL: process.env.API_URL || `http://localhost:3000`,
    });

    public static getNamesMapping(): Promise<AxiosResponse<MappingsResponse>> {
        return SportEventsService.http.get('/api/mappings');
    }

    public static getEventsList(): Promise<AxiosResponse<StateResponse>> {
        return SportEventsService.http.get('/api/state');
    }
}