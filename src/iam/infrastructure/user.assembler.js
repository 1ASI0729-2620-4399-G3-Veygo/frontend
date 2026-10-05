import {User} from '@/iam/domain/model/user.entity.js';

/**
 * Assembler that maps IAM resources to User entities and requests to resources.
 */
export class UserAssembler {
    /**
     * Converts a resource into a User entity.
     *
     * @param {import('./iam-resources.js').UserResource} resource - The API resource.
     * @returns {User}
     */
    static toEntityFromResource(resource) {
        return new User({...resource});
    }

    /**
     * Converts a list response into User entities, skipping invalid records.
     *
     * @param {import('axios').AxiosResponse} response - The API response.
     * @returns {User[]}
     */
    static toEntitiesFromResponse(response) {
        return (response.data || []).map(resource => {
            try {
                return this.toEntityFromResource(resource);
            } catch (error) {
                console.error('Validation error for user:', error.message, resource);
                return null;
            }
        }).filter(user => user !== null);
    }

    /**
     * Builds the user resource to persist from a sign-up request.
     *
     * @param {import('./iam-resources.js').SignUpRequest} request - The sign-up data.
     * @returns {Object} The resource for the API.
     */
    static toResourceFromSignUpRequest(request) {
        return {
            fullName: request.fullName.trim(),
            email: request.email.trim().toLowerCase(),
            password: request.password,
            role: request.role,
            phone: request.phone || '',
            documentNumber: request.documentNumber,
            driverLicense: request.driverLicenseNumber
                ? {number: request.driverLicenseNumber.trim(), category: 'A-I', issuedAt: '', expiresAt: '', verified: false}
                : null,
            district: request.district,
            ownerType: request.ownerType || '',
            photoUrl: '',
            identityVerified: false,
            rating: 0,
            reviewsCount: 0,
            createdAt: new Date().toISOString(),
            birthDate: '',
            address: '',
            bio: '',
            passwordUpdatedAt: new Date().toISOString(),
            preferences: {notifications: true, promotions: true, twoFactor: false, darkMode: false}
        };
    }

    /**
     * Converts a User entity into a plain object that can be stored in the browser session.
     *
     * @param {User} user - The user entity.
     * @returns {Object}
     */
    static toSessionFromEntity(user) {
        return this.toResourceFromEntity(user);
    }

    /**
     * Converts a User entity into its API resource (without credentials).
     *
     * @param {User} user - The user entity.
     * @returns {import('./iam-resources.js').UserResource}
     */
    static toResourceFromEntity(user) {
        return {
            id: user.id, fullName: user.fullName, email: user.email, role: user.role, phone: user.phone,
            documentNumber: user.documentNumber, district: user.district, ownerType: user.ownerType,
            photoUrl: user.photoUrl.toString(), identityVerified: user.identityVerified, rating: user.rating,
            reviewsCount: user.reviewsCount, createdAt: user.createdAt.toISOString(), birthDate: user.birthDate,
            address: user.address, bio: user.bio,
            passwordUpdatedAt: user.passwordUpdatedAt ? user.passwordUpdatedAt.toISOString() : null,
            driverLicense: user.driverLicense ? {...user.driverLicense} : null,
            preferences: {...user.preferences}
        };
    }
}
