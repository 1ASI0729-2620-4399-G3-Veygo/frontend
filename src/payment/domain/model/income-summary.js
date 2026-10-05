import {Money} from '@/shared/domain/model/money.js';
import {TransactionStatus} from '@/payment/domain/model/transaction.entity.js';

/**
 * Domain service that summarizes the transactions of an owner inside a period:
 * income, completed and pending payments, refunds, income by month and by vehicle.
 */
export class IncomeSummary {
    /**
     * @param {import('./transaction.entity.js').Transaction[]} transactions - Transactions inside the period.
     */
    constructor(transactions) {
        const byStatus = status => transactions.filter(transaction => transaction.status === status);
        const sum = list => list.reduce((total, transaction) => total.add(transaction.amount), Money.zero());
        this.count = transactions.length;
        this.completed = byStatus(TransactionStatus.COMPLETED);
        this.pending = byStatus(TransactionStatus.PENDING);
        this.refunded = byStatus(TransactionStatus.REFUNDED);
        this.income = sum(this.completed);
        this.pendingAmount = sum(this.pending);
        this.refundedAmount = sum(this.refunded);
        Object.freeze(this);
    }

    /**
     * Percentage of transactions with a status.
     *
     * @param {Array} list - completed, pending or refunded.
     * @returns {number}
     */
    percentage(list) {
        return this.count ? Math.round(list.length * 100 / this.count) : 0;
    }

    /**
     * Completed income grouped by vehicle, highest first.
     *
     * @returns {Array<{vehicleId: number, amount: Money}>}
     */
    incomeByVehicle() {
        const totals = new Map();
        this.completed.forEach(transaction => {
            totals.set(transaction.vehicleId, (totals.get(transaction.vehicleId) ?? Money.zero()).add(transaction.amount));
        });
        return [...totals.entries()]
            .map(([vehicleId, amount]) => ({vehicleId, amount}))
            .sort((a, b) => b.amount.amount - a.amount.amount);
    }

    /**
     * Completed income of the last months, including the month of the given date.
     *
     * @param {import('./transaction.entity.js').Transaction[]} allTransactions - Every transaction of the owner.
     * @param {Date} untilDate - Last month to include.
     * @param {number} [months=6] - Number of months.
     * @returns {Array<{year: number, month: number, amount: Money}>}
     */
    static incomeByMonth(allTransactions, untilDate, months = 6) {
        return Array.from({length: months}, (_, index) => {
            const monthDate = new Date(untilDate.getFullYear(), untilDate.getMonth() - (months - 1 - index), 1);
            const amount = allTransactions
                .filter(transaction => transaction.status === TransactionStatus.COMPLETED
                    && transaction.date.toDate().getFullYear() === monthDate.getFullYear()
                    && transaction.date.toDate().getMonth() === monthDate.getMonth())
                .reduce((total, transaction) => total.add(transaction.amount), Money.zero());
            return {year: monthDate.getFullYear(), month: monthDate.getMonth(), amount};
        });
    }
}
