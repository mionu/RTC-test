import axios, { AxiosInstance, AxiosResponse } from 'axios';

import { MappingsResponse, StateResponse } from '../models';

/**
 * Service for interacting with the backend API for sport events and mappings.
 */
class SportEventsService {
    private http: AxiosInstance = axios.create({
        baseURL: process.env.API_URL || `http://localhost:3000`,
    });

    /**
     * Fetches the names mapping from the backend API.
     * @returns {Promise<AxiosResponse<MappingsResponse>>} The API response.
     */
    public getNamesMapping(): Promise<AxiosResponse<MappingsResponse>> {
        return this.http.get('/api/mappings');
    }

    /**
     * Fetches the list of sport events from the backend API.
     * @returns {Promise<AxiosResponse<StateResponse>>} The API response.
     */
    public getEventsList(): Promise<AxiosResponse<StateResponse>> {
        return this.http.get('/api/state');
    }
}

export const sportEventsService = new SportEventsService();
