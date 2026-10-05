import {ref} from 'vue';
import {fleetStore} from '@/fleet/application/fleet.store.js';
import {iamStore} from '@/iam/application/iam.store.js';

/**
 * Composable that resolves the vehicles and counterpart users referenced by bookings.
 *
 * @remarks
 * Bookings only keep identifiers of other aggregates (Vehicle, User). This composable
 * asks the Fleet and IAM application services for them so the views can show details.
 *
 * @returns {{vehiclesById: import('vue').Ref<Map>, usersById: import('vue').Ref<Map>, resolveDetails: Function}}
 */
export function useBookingDetails() {
    const vehiclesById = ref(new Map());
    const usersById = ref(new Map());

    /**
     * Loads the vehicles and users referenced by a list of bookings.
     *
     * @param {import('@/booking/domain/model/booking.entity.js').Booking[]} bookings - The bookings.
     * @param {(booking: import('@/booking/domain/model/booking.entity.js').Booking) => number} counterpartId - Selects the user to show.
     * @returns {Promise<void>}
     */
    const resolveDetails = (bookings, counterpartId) => {
        const userIds = [...new Set(bookings.map(counterpartId))];
        return Promise.all([
            fleetStore.fetchVehiclesByIds(bookings.map(booking => booking.vehicleId)),
            Promise.all(userIds.map(id => iamStore.fetchUserById(id)))
        ]).then(([vehicles, users]) => {
            vehiclesById.value = vehicles;
            usersById.value = new Map(users.filter(Boolean).map(user => [user.id, user]));
        });
    };

    return {vehiclesById, usersById, resolveDetails};
}