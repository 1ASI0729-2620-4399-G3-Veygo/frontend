import {Booking} from '@/booking/domain/model/booking.entity.js';

/**
 * Assembler that maps Booking resources to entities and back.
 */
export class BookingAssembler {
    /**
     * Converts a resource into a Booking entity.
     *
     * @param {import('./booking-resources.js').BookingResource} resource - The API resource.
     * @returns {Booking}
     */
    static toEntityFromResource(resource) {
        return new Booking({...resource});
    }

    /**
     * Converts a list response into Booking entities, skipping invalid records.
     *
     * @param {import('axios').AxiosResponse} response - The API response.
     * @returns {Booking[]}
     */
    static toEntitiesFromResponse(response) {
        return (response.data || []).map(resource => {
            try {
                return this.toEntityFromResource(resource);
            } catch (error) {
                console.error('Validation error for booking:', error.message, resource);
                return null;
            }
        }).filter(booking => booking !== null);
    }

    /**
     * Converts a Booking entity into the resource expected by the API.
     *
     * @param {Booking} booking - The booking entity.
     * @returns {import('./booking-resources.js').BookingResource}
     */
    static toResourceFromEntity(booking) {
        const resource = {
            vehicleId: booking.vehicleId,
            renterId: booking.renterId,
            ownerId: booking.ownerId,
            startDate: booking.period.startIso(),
            endDate: booking.period.endIso(),
            pricePerDay: booking.pricePerDay.amount,
            totalPrice: booking.totalPrice.amount,
            status: booking.status,
            paymentMethod: booking.paymentMethod,
            createdAt: booking.createdAt.toISOString(),
            confirmedAt: booking.confirmedAt ? booking.confirmedAt.toISOString() : null
        };
        if (booking.id !== null) resource.id = booking.id;
        return resource;
    }
}
