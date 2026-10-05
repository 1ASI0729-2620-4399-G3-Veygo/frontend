import {Transaction, TransactionStatus} from '@/payment/domain/model/transaction.entity.js';
import {DateTime} from '@/shared/domain/model/date-time.js';

/**
 * Assembler (anti-corruption layer) that builds Transactions from Booking entities.
 */
export class TransactionAssembler {
    /**
     * Converts a booking into a transaction, or null when no payment happened.
     *
     * @param {import('@/booking/domain/model/booking.entity.js').Booking} booking - The booking.
     * @returns {Transaction|null}
     */
    static toEntityFromBooking(booking) {
        let status = null;
        let date = booking.confirmedAt ?? booking.createdAt;
        if (booking.isFinished()) {
            status = TransactionStatus.COMPLETED;
            date = new DateTime(booking.period.end);
        } else if (booking.wasRefunded()) status = TransactionStatus.REFUNDED;
        else if (booking.displayStatus === 'confirmed' || booking.isInProgress()) status = TransactionStatus.PENDING;
        if (!status) return null;
        return new Transaction({
            bookingId: booking.id, vehicleId: booking.vehicleId, renterId: booking.renterId, ownerId: booking.ownerId,
            period: booking.period, amount: booking.totalPrice, status, date, paymentMethod: booking.paymentMethod
        });
    }

    /**
     * Converts bookings into transactions, newest first.
     *
     * @param {import('@/booking/domain/model/booking.entity.js').Booking[]} bookings - The bookings.
     * @returns {Transaction[]}
     */
    static toEntitiesFromBookings(bookings) {
        return bookings.map(booking => this.toEntityFromBooking(booking))
            .filter(Boolean)
            .sort((a, b) => b.date.valueOf() - a.date.valueOf());
    }
}
