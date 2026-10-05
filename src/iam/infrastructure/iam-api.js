import {BaseApi} from '@/shared/infrastructure/base-api.js';
import {BaseEndpoint} from '@/shared/infrastructure/base-endpoint.js';

const usersEndpointPath = import.meta.env.VITE_USERS_ENDPOINT_PATH;

/**
 * RESTful API client for the Identity and Access Management (IAM) bounded context.
 *
 * @remarks
 * In Sprint 2 authentication is simulated against the Fake API (json-server) by querying
 * users by credentials. It will be replaced by the sign-in / sign-up endpoints of the
 * ASP.NET Core Web Services, keeping the same method signatures.
 */
export class IamApi extends BaseApi {
    /** @type {BaseEndpoint} */
    #usersEndpoint;

    constructor() {
        super();
        this.#usersEndpoint = new BaseEndpoint(this, usersEndpointPath);
    }

    /**
     * Finds the user that matches the given credentials.
     *
     * @param {import('./iam-resources.js').SignInRequest} request - The credentials.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    signIn(request) {
        return this.#usersEndpoint.getAll({email: request.email, password: request.password});
    }

    /**
     * Finds users by email (used to avoid duplicated accounts).
     *
     * @param {string} email - The email to look for.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    getUsersByEmail(email) {
        return this.#usersEndpoint.getAll({email});
    }

    /**
     * Creates a new user account.
     *
     * @param {Object} resource - The user resource to persist.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    signUp(resource) {
        return this.#usersEndpoint.create(resource);
    }

    /**
     * Retrieves a user by identifier.
     *
     * @param {number} id - The user identifier.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    getUserById(id) {
        return this.#usersEndpoint.getById(id);
    }

    /**
     * Checks a user's current password (Fake API: query by id and password).
     *
     * @param {number} id - The user identifier.
     * @param {string} password - The password to check.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    verifyPassword(id, password) {
        return this.#usersEndpoint.getAll({id, password});
    }

    /**
     * Partially updates a user (profile data, preferences, photo or password).
     *
     * @param {number} id - The user identifier.
     * @param {Object} changes - The fields to change.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    updateUser(id, changes) {
        return this.#usersEndpoint.patch(id, changes);
    }

    /**
     * Deletes a user account.
     *
     * @param {number} id - The user identifier.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    deleteUser(id) {
        return this.#usersEndpoint.delete(id);
    }
}
