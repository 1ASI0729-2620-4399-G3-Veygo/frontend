import {reactive} from 'vue';
import {IamApi} from '@/iam/infrastructure/iam-api.js';
import {UserAssembler} from '@/iam/infrastructure/user.assembler.js';
import {sessionStorageService} from '@/iam/infrastructure/session-storage.js';
import {applyDarkMode} from '@/shared/presentation/theme.js';

const iamApi = new IamApi();

/**
 * Application service (store) for the Identity and Access Management bounded context.
 *
 * @remarks
 * Orchestrates sign-in, sign-up and sign-out, keeps the current user and caches
 * other users' public profiles (e.g. vehicle owners) requested by other contexts.
 */
export const iamStore = reactive({
    /** @type {import('@/iam/domain/model/user.entity.js').User|null} */
    currentUser: null,
    /** @type {Map<number, import('@/iam/domain/model/user.entity.js').User>} */
    usersById: new Map(),
    /** @type {string[]} */
    errors: [],

    /** @returns {boolean} True when a user is signed in. */
    get isSignedIn() {
        return this.currentUser !== null;
    },

    /**
     * Restores the session saved in the browser, if any.
     */
    restoreSession() {
        const session = sessionStorageService.load();
        if (!session) return;
        try {
            this.currentUser = UserAssembler.toEntityFromResource(session);
            applyDarkMode(this.currentUser.preferences.darkMode);
        } catch (error) {
            sessionStorageService.clear();
        }
    },

    /**
     * Signs in with email and password.
     *
     * @param {import('@/iam/infrastructure/iam-resources.js').SignInRequest} request - The credentials.
     * @returns {Promise<import('@/iam/domain/model/user.entity.js').User>} The signed-in user.
     */
    signIn(request) {
        this.errors = [];
        return iamApi.signIn({email: request.email.trim().toLowerCase(), password: request.password})
            .then(response => {
                const [user] = UserAssembler.toEntitiesFromResponse(response);
                if (!user) throw 'errors.invalid-credentials';
                this.startSession(user);
                return user;
            })
            .catch(message => {
                this.errors.push(message);
                throw message;
            });
    },

    /**
     * Creates a new account and signs in with it.
     *
     * @param {import('@/iam/infrastructure/iam-resources.js').SignUpRequest} request - The sign-up data.
     * @returns {Promise<import('@/iam/domain/model/user.entity.js').User>} The new user.
     */
    signUp(request) {
        this.errors = [];
        return iamApi.getUsersByEmail(request.email.trim().toLowerCase())
            .then(response => {
                if (response.data.length > 0) throw 'errors.email-already-registered';
                return iamApi.signUp(UserAssembler.toResourceFromSignUpRequest(request));
            })
            .then(response => {
                const user = UserAssembler.toEntityFromResource(response.data);
                this.startSession(user);
                return user;
            })
            .catch(message => {
                this.errors.push(message);
                throw message;
            });
    },

    /**
     * Ends the current session.
     */
    signOut() {
        this.currentUser = null;
        sessionStorageService.clear();
        applyDarkMode(false);
    },

    /**
     * Updates the personal information of the signed-in user.
     *
     * @param {import('@/iam/infrastructure/iam-resources.js').UpdateProfileRequest} request - The new data.
     * @returns {Promise<import('@/iam/domain/model/user.entity.js').User>}
     */
    updateProfile(request) {
        const changes = {
            fullName: request.fullName.trim(), email: request.email.trim().toLowerCase(), phone: request.phone.trim(),
            birthDate: request.birthDate, address: request.address.trim(), district: request.district, bio: request.bio.trim()
        };
        const emailChanged = changes.email !== this.currentUser.email;
        const check = emailChanged
            ? iamApi.getUsersByEmail(changes.email).then(response => {
                if (response.data.length > 0) throw 'errors.email-already-registered';
            })
            : Promise.resolve();
        return check.then(() => this.patchCurrentUser(changes));
    },

    /**
     * Replaces the profile photo.
     *
     * @param {string} photoUrl - URL (or data URL) of the new photo.
     * @returns {Promise<import('@/iam/domain/model/user.entity.js').User>}
     */
    updatePhoto(photoUrl) {
        return this.patchCurrentUser({photoUrl});
    },

    /**
     * Changes some preferences (notifications, promotions, two-factor, dark mode).
     *
     * @param {Object} changes - The preferences to change.
     * @returns {Promise<import('@/iam/domain/model/user.entity.js').User>}
     */
    updatePreferences(changes) {
        const preferences = this.currentUser.preferences.with(changes);
        applyDarkMode(preferences.darkMode);
        return this.patchCurrentUser({preferences: {...preferences}});
    },

    /**
     * Changes the password after checking the current one.
     *
     * @param {import('@/iam/infrastructure/iam-resources.js').ChangePasswordRequest} request - The passwords.
     * @returns {Promise<import('@/iam/domain/model/user.entity.js').User>}
     */
    changePassword(request) {
        if (request.newPassword.length < 8) return Promise.reject('errors.password-length');
        return iamApi.verifyPassword(this.currentUser.id, request.currentPassword)
            .then(response => {
                if (response.data.length === 0) throw 'errors.wrong-current-password';
                return this.patchCurrentUser({password: request.newPassword, passwordUpdatedAt: new Date().toISOString()});
            });
    },

    /**
     * Permanently deletes the account of the signed-in user and ends the session.
     *
     * @returns {Promise<void>}
     */
    deleteAccount() {
        return iamApi.deleteUser(this.currentUser.id).then(() => this.signOut());
    },

    /**
     * Sends changes of the signed-in user to the API and refreshes the session.
     *
     * @param {Object} changes - The fields to change.
     * @returns {Promise<import('@/iam/domain/model/user.entity.js').User>}
     */
    patchCurrentUser(changes) {
        return iamApi.updateUser(this.currentUser.id, changes)
            .then(response => {
                const user = UserAssembler.toEntityFromResource(response.data);
                this.usersById.set(user.id, user);
                this.startSession(user);
                return user;
            })
            .catch(message => {
                this.errors.push(message);
                throw message;
            });
    },

    /**
     * Retrieves (and caches) the public profile of a user, e.g. a vehicle owner.
     *
     * @param {number} id - The user identifier.
     * @returns {Promise<import('@/iam/domain/model/user.entity.js').User|null>}
     */
    fetchUserById(id) {
        if (this.usersById.has(id)) return Promise.resolve(this.usersById.get(id));
        return iamApi.getUserById(id)
            .then(response => {
                const user = UserAssembler.toEntityFromResource(response.data);
                this.usersById.set(id, user);
                return user;
            })
            .catch(message => {
                this.errors.push(message);
                return null;
            });
    },

    /**
     * Stores the signed-in user in memory and in the browser.
     *
     * @param {import('@/iam/domain/model/user.entity.js').User} user - The user.
     */
    startSession(user) {
        this.currentUser = user;
        applyDarkMode(user.preferences.darkMode);
        sessionStorageService.save(UserAssembler.toSessionFromEntity(user));
    }
});
