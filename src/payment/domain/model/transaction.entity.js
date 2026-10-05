import {Money} from '@/shared/domain/model/money.js';

/**
 * Transaction states.
 *
 * @readonly
 * @enum {string}
 */
export const TransactionStatus = Object.freeze({
    COMPLETED: 'completed',
    PENDING: 'pending',
    REFUNDED: 'refunded'
});

/**
 * Domain entity (read model) representing the payment of a booking for the Owner.
 *
 * @remarks
 * In Sprint 2 transactions are derived from bookings: confirmed bookings are pending
 * payments, finished bookings are completed payments and bookings cancelled after being
 * confirmed are refunds. The Payments Web Service will provide them in later sprints.
 */
export class Transaction {
    /**
     * Creates a new Transaction.
     *
     * @param {Object} props - The transaction properties.
     * @param {number} props.bookingId - The paid booking.
     * @param {number} props.vehicleId - The vehicle.
     * @param {number} props.renterId - The client that pays.
     * @param {number} props.ownerId - The owner that receives the payment.
     * @param {import('@/shared/domain/model/date-range.js').DateRange} props.period - The rental period.
     * @param {Money} props.amount - The amount.
     * @param {string} props.status - One of {@link TransactionStatus}.
     * @param {import('@/shared/domain/model/date-time.js').DateTime} props.date - Date of the payment event.
     * @param {string} props.paymentMethod - "card" or "yape".
     * @throws {Error} If the status is not supported.
     */
    constructor({bookingId, vehicleId, renterId, ownerId, period, amount, status, date, paymentMethod}) {
        if (!Object.values(TransactionStatus).includes(status)) throw new Error(`Unsupported transaction status: ${status}`);
        this.bookingId = bookingId;
        this.vehicleId = vehicleId;
        this.renterId = renterId;
        this.ownerId = ownerId;
        this.period = period;
        this.amount = amount instanceof Money ? amount : new Money(amount);
        this.status = status;
        this.date = date;
        this.paymentMethod = paymentMethod;
    }

    /** @returns {string} Readable code, e.g. "TRX-00012". */
    get code() {
        return `TRX-${String(this.bookingId).padStart(5, '0')}`;
    }
}
