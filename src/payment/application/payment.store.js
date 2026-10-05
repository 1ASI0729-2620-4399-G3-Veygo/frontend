import {reactive} from 'vue';
import {BookingApi} from '@/booking/infrastructure/booking-api.js';
import {BookingAssembler} from '@/booking/infrastructure/booking.assembler.js';
import {TransactionAssembler} from '@/payment/infrastructure/transaction.assembler.js';

const bookingApi = new BookingApi();

/**
 * Application service (store) for the Payment bounded context.
 *
 * @remarks
 * Builds the transactions of the signed-in owner from their bookings.
 */
export const paymentStore = reactive({
    /** @type {import('@/payment/domain/model/transaction.entity.js').Transaction[]} */
    transactions: [],
    /** @type {boolean} */
    loading: false,
    /** @type {string[]} */
    errors: [],

    /**
     * Loads the transactions of an owner.
     *
     * @param {number} ownerId - The owner identifier.
     * @returns {Promise<void>}
     */
    loadOwnerTransactions(ownerId) {
        this.errors = [];
        this.loading = true;
        return bookingApi.getBookingsByOwnerId(ownerId)
            .then(response => {
                this.transactions = TransactionAssembler.toEntitiesFromBookings(BookingAssembler.toEntitiesFromResponse(response));
            })
            .catch(message => this.errors.push(message))
            .finally(() => this.loading = false);
    }
});
