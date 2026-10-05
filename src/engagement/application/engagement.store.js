import {reactive} from 'vue';
import {EngagementApi} from '@/engagement/infrastructure/engagement-api.js';
import {FavoriteAssembler} from '@/engagement/infrastructure/favorite.assembler.js';
import {Favorite} from '@/engagement/domain/model/favorite.entity.js';

const engagementApi = new EngagementApi();

/**
 * Application service (store) for the Engagement bounded context.
 *
 * @remarks
 * Manages the vehicles a renter saves as favorites.
 */
export const engagementStore = reactive({
    /** @type {Favorite[]} */
    favorites: [],
    /** @type {boolean} */
    loaded: false,
    /** @type {string[]} */
    errors: [],

    /**
     * Loads the favorites of a renter.
     *
     * @param {number} renterId - The renter identifier.
     * @returns {Promise<void>}
     */
    loadFavorites(renterId) {
        this.errors = [];
        return engagementApi.getFavoritesByRenterId(renterId)
            .then(response => {
                this.favorites = FavoriteAssembler.toEntitiesFromResponse(response);
                this.loaded = true;
            })
            .catch(message => {
                this.errors.push(message);
                this.favorites = [];
            });
    },

    /**
     * Checks whether a vehicle is in the favorites list.
     *
     * @param {number} vehicleId - The vehicle identifier.
     * @returns {boolean}
     */
    isFavorite(vehicleId) {
        return this.favorites.some(favorite => favorite.vehicleId === vehicleId);
    },

    /**
     * Adds or removes a vehicle from the favorites of a renter.
     *
     * @param {number} renterId - The renter identifier.
     * @param {number} vehicleId - The vehicle identifier.
     * @returns {Promise<boolean>} True if the vehicle is now a favorite.
     */
    toggleFavorite(renterId, vehicleId) {
        const existing = this.favorites.find(favorite => favorite.vehicleId === vehicleId);
        if (existing) {
            return engagementApi.deleteFavorite(existing.id)
                .then(() => {
                    this.favorites = this.favorites.filter(favorite => favorite.id !== existing.id);
                    return false;
                })
                .catch(message => {
                    this.errors.push(message);
                    throw message;
                });
        }
        const favorite = new Favorite({renterId, vehicleId});
        return engagementApi.createFavorite(FavoriteAssembler.toResourceFromEntity(favorite))
            .then(response => {
                this.favorites.unshift(FavoriteAssembler.toEntityFromResource(response.data));
                return true;
            })
            .catch(message => {
                this.errors.push(message);
                throw message;
            });
    },

    /** Clears the loaded favorites (e.g. on sign-out). */
    reset() {
        this.favorites = [];
        this.loaded = false;
    }
});
