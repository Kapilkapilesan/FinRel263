import React, { useState } from 'react';
import { History as HistoryIcon } from 'lucide-react';
import { colors } from '@/themes/colors';
import { ScheduledPayment } from '../../services/collection.types';
import { Pagination } from '@/components/common/Pagination';

interface ScheduledPaymentsTableProps {
    payments: ScheduledPayment[];
    selectedCenter: string;
    onCollectPayment: (payment: ScheduledPayment) => void;
    onShowHistory: (payment: ScheduledPayment) => void;
    selectedDate: string;
}

export function ScheduledPaymentsTable({ payments, selectedCenter, onCollectPayment, onShowHistory, selectedDate }: ScheduledPaymentsTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const isToday = selectedDate === new Date().toISOString().split('T')[0];

    // Pagination logic
    const totalItems = payments.length;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const pagedPayments = payments.slice(startIndex, endIndex);

    // Reset to first page when data starts filtering or changing
    React.useEffect(() => {
        setCurrentPage(1);
    }, [payments.length, selectedCenter, selectedDate]);

    // Calculate net arrears for a payment
    const getNetArrears = (payment: ScheduledPayment) => {
        return payment.arrears; // Arrears is now pre-calculated as (Suspense - PastUnpaid) on backend
    };

    // Get styling based on net arrears value
    const getArrearsStyle = (netArrears: number) => {
        if (netArrears > 0) {
            return 'text-rose-500 font-bold'; // Positive (+) = Debt/Red
        } else if (netArrears < 0) {
            return 'text-primary-500 font-bold'; // Negative (-) = Advance/Blue
        } else {
            return 'text-text-muted font-bold';
        }
    };

    // Format net arrears display
    const formatNetArrears = (netArrears: number) => {
        if (netArrears === 0) {
            return '0';
        } else if (netArrears > 0) {
            return `+${netArrears.toLocaleString()}`; // Debt
        } else {
            return netArrears.toLocaleString(); // Advance (already has minus sign)
        }
    };

    return (
        <div className="bg-card rounded-3xl border border-border-default overflow-hidden shadow-sm">
            <div className="bg-table-header border-b border-border-default px-6 py-3">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-[0.2em]">
                    Scheduled Payments — <span className="text-text-primary">{selectedCenter}</span>
                </h3>
            </div>

            <div className="bg-table-header border-b border-border-default px-6 py-2 hidden md:block">
                <div className="grid grid-cols-12 gap-4 text-[10px] font-black text-text-muted uppercase tracking-wider">
                    <div className="col-span-2">Customer / Code</div>
                    <div className="col-span-2">Contract / Group</div>
                    <div className="col-span-1 text-center">Center</div>
                    <div className="col-span-2 text-right">Outstanding</div>
                    <div className="col-span-1 text-right">Due</div>
                    <div className="col-span-1 text-right">Penalty</div>
                    <div className="col-span-1 text-right">Arrears</div>
                    <div className="col-span-2 text-center">Action</div>
                </div>
            </div>

            <div className="divide-y divide-border-divider">
                {payments.length === 0 ? (
                    <div className="px-6 py-6 text-center text-text-muted italic bg-muted-bg/30">
                        No loans found matching your criteria.
                    </div>
                ) : (
                    pagedPayments.map((payment) => {
                        const netArrears = getNetArrears(payment);
                        return (
                            <div key={payment.id} className="px-6 py-2 hover:bg-table-row-hover transition-all group">
                                <div className="grid grid-cols-12 gap-4 items-center">
                                    {/* Customer */}
                                    <div className="col-span-2">
                                        <p className="font-bold text-text-primary text-sm group-hover:text-primary-500 transition-colors uppercase">{payment.customer}</p>
                                        <p className="text-[10px] text-text-muted font-black bg-muted-bg px-1.5 py-0.5 rounded inline-block mt-1 uppercase tracking-tighter">{payment.customerCode}</p>
                                    </div>

                                    {/* Contract / Group */}
                                    <div className="col-span-2">
                                        <p className="text-sm text-text-secondary font-bold tracking-tight uppercase">{payment.contractNo}</p>
                                        <p className="text-[10px] text-text-muted font-black uppercase mt-1 tracking-tighter">{payment.group}</p>
                                    </div>

                                    {/* Center */}
                                    <div className="col-span-1">
                                        <span
                                            className="px-2 py-1 text-[9px] font-black rounded-lg uppercase truncate block text-center border border-current/10"
                                            title={payment.center_name}
                                            style={{ backgroundColor: `${colors.primary[500]}15`, color: colors.primary[500] }}
                                        >
                                            {payment.center_name?.toUpperCase()}
                                        </span>
                                    </div>

                                    {/* Outstanding */}
                                    <div className="col-span-2 text-right">
                                        <div className="flex flex-col items-end">
                                            <p className="text-sm font-black text-text-primary">
                                                LKR {payment.outstanding.toLocaleString()}
                                            </p>
                                            <p className="text-[10px] text-text-muted font-bold uppercase tracking-tighter">Remaining Bal.</p>

                                            {payment.unsettled_collection_amount && payment.unsettled_collection_amount > 0 ? (
                                                <div className="mt-1 px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded text-[8px] font-black underline decoration-amber-200 uppercase w-fit border border-amber-100/50" title="Amount collected by FO but not yet settled in branch">
                                                    Pending Settlement: {payment.unsettled_collection_amount.toLocaleString()}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>

                                    {/* Due Amount */}
                                    <div className="col-span-1 text-right font-black text-text-primary text-sm">
                                        {payment.dueAmount.toLocaleString()}
                                    </div>

                                    {/* Penalty */}
                                    <div className="col-span-1 text-right font-bold text-rose-500 text-sm">
                                        {payment.penalty ? payment.penalty.toLocaleString() : '-'}
                                    </div>

                                    <div className="col-span-1 text-right">
                                        <p className={`text-sm ${getArrearsStyle(netArrears)}`}>
                                            {formatNetArrears(netArrears)}
                                        </p>
                                        {netArrears < 0 && (
                                            <p className="text-[9px] text-primary-500 font-black uppercase tracking-tighter">Advance</p>
                                        )}
                                        {netArrears > 0 && (
                                            <p className="text-[9px] text-rose-500 font-black uppercase tracking-tighter">Debt</p>
                                        )}
                                    </div>

                                    {/* Action */}
                                    <div className="col-span-2 flex items-center justify-center gap-3">
                                        <button
                                            onClick={() => onShowHistory(payment)}
                                            className="p-2 text-text-muted hover:text-primary-500 hover:bg-primary-500/10 rounded-xl transition-all"
                                            title="Payment History"
                                            style={{ color: colors.primary[600] }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = colors.primary[50];
                                                e.currentTarget.style.color = colors.primary[700];
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = '';
                                                e.currentTarget.style.color = colors.primary[600];
                                            }}
                                        >
                                            <HistoryIcon size={18} />
                                        </button>
                                        <button
                                            onClick={() => onCollectPayment(payment)}
                                            disabled={!payment.can_collect}
                                            title={!payment.can_collect
                                                ? (payment.dueAmount <= 0 ? "Already Fully Paid" : "Cycle Closed or Future Cycle")
                                                : "Collect Payment"}
                                            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 ${!payment.can_collect ? 'bg-muted-bg text-text-muted cursor-not-allowed' : 'bg-primary-500 text-white hover:bg-primary-600 shadow-primary-500/20 shadow-lg'}`}
                                            style={{ backgroundColor: payment.can_collect ? colors.primary[600] : undefined }}
                                            onMouseEnter={(e) => {
                                                if (payment.can_collect) {
                                                    e.currentTarget.style.backgroundColor = colors.primary[700];
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (payment.can_collect) {
                                                    e.currentTarget.style.backgroundColor = colors.primary[600];
                                                }
                                            }}
                                        >
                                            {payment.totalPayable <= 0 ? 'Paid' : 'Collect'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {totalItems > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                    itemName="PAYMENTS"
                />
            )}
        </div>
    );
}

