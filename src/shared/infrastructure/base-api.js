import axios from 'axios';
import {errorInterceptor} from '@/shared/infrastructure/error.interceptor.js';

const veygoApiUrl = import.meta.env.VITE_VEYGO_API_URL;

/**
 * Base class for the RESTful API clients of each bounded context.
 *
 * @remarks
 * Owns a pre-configured Axios instance pointing to the Veygo API, with the shared
 * error interceptor applied. Context APIs extend it and expose their endpoints.
 */
export class BaseApi {
    /** @type {import('axios').AxiosInstance} */
    #http;

    /**
     * Creates a new BaseApi instance.
     *
     * @param {string} [baseUrl] - Base URL of the API (defaults to VITE_VEYGO_API_URL).
     */
    constructor(baseUrl = veygoApiUrl) {
        this.#http = axios.create({
            baseURL: baseUrl,
            headers: {'Content-Type': 'application/json'}
        });
        this.#http.interceptors.response.use(errorInterceptor.onResponse, errorInterceptor.onError);
    }

    /**
     * The configured Axios instance.
     *
     * @returns {import('axios').AxiosInstance}
     */
    get http() {
        return this.#http;
    }
}
