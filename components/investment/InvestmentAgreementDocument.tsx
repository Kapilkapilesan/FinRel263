'use client';

import React from 'react';
import { Investment } from '../../types/investment.types';
import { numberToWords, formatDateToOrdinal, formatCurrency } from '../../utils/document.utils';

interface Props {
    investment: Investment;
    witnesses: {
        name: string;
        nic: string;
        address: string;
    }[];
}

export function InvestmentAgreementDocument({ investment, witnesses }: Props) {
    const customer = investment.customer;
    const address = customer ? [
        customer.address_line_1,
        customer.address_line_2,
        customer.address_line_3,
        customer.city
    ].filter(Boolean).join(', ') : '';

    const interestRate = investment.snapshot_payout_type === 'MONTHLY'
        ? investment.snapshot_interest_rate_monthly
        : investment.snapshot_interest_rate_maturity;

    return (
        <div className="agreement-document bg-white text-black p-[1in] font-serif leading-relaxed text-[10pt]" style={{ width: '8.27in', minHeight: '11.69in', margin: '0 auto' }}>
            <style jsx>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        -webkit-print-color-adjust: exact;
                    }
                    .agreement-document {
                        padding: 1in !important;
                        width: 100% !important;
                        height: 100% !important;
                        box-shadow: none !important;
                    }
                }
                .agreement-document h1, .agreement-document h2, .agreement-document h3 {
                    font-family: 'Cambria', serif;
                    color: #2b5797;
                    text-transform: uppercase;
                    font-weight: bold;
                    margin-bottom: 0.5rem;
                    margin-top: 1.5rem;
                    font-size: 13pt;
                }
                .agreement-document p {
                    margin-bottom: 1rem;
                    text-align: justify;
                }
                .agreement-document .field-data {
                    color: #000000;
                    font-weight: bold;
                }
                .signature-section {
                    margin-top: 3rem;
                }
                .signature-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 2rem;
                }
                .footer {
                    margin-top: 4rem;
                    font-size: 9pt;
                    border-top: 1px solid #eee;
                    padding-top: 1rem;
                }
            `}</style>

            <div className="header text-center mb-12">
                <h1 className="border-b-2 border-[#2b5797] pb-2 inline-block">LOAN AGREEMENT</h1>
            </div>

            <div className="metadata mb-10">
                <p><strong>AGREEMENT NO:</strong> <span className="field-data">{investment.transaction_id}</span></p>
                <p><strong>Made this</strong> <span className="field-data">{formatDateToOrdinal(investment.start_date)}</span></p>
            </div>

            <div className="parties mb-10">
                <h2 className="text-[#2b5797] font-bold">BETWEEN</h2>
                <p>
                    <span className="field-data uppercase">{customer?.full_name}</span><br />
                    <span className="field-data">{customer?.customer_code}</span><br />
                    <span className="field-data uppercase">{address}</span><br />
                    (hereinafter referred to as the 'Lender')
                </p>

                <p className="font-bold my-4">AND</p>

                <p>
                    <strong>BMS CAPITAL SOLUTIONS (PVT) LTD</strong><br />
                    No. 6, 1st Floor, Main Street, Chankanai.<br />
                    Democratic Socialist Republic of Sri Lanka.<br />
                    (hereinafter referred to as the 'Borrower')
                </p>
            </div>

            <div className="terms">
                <h2>TERMS AND CONDITIONS</h2>

                <p>
                    <strong>1. AUTHORITY OF DIRECTOR:</strong><br />
                    Both parties admit that <span className="field-data underline">Gunabalasingam Mathivarman</span> is the current DIRECTOR of BMS Capital Solutions (Pvt) Ltd, and both parties acknowledge that the said DIRECTOR is empowered to enter into this transaction and sign relevant documents on behalf of the company.
                </p>

                <p>
                    <strong>2. LOAN AMOUNT:</strong><br />
                    The Borrower admits that a sum of Sri Lankan <span className="field-data underline">Rupees {numberToWords(investment.amount)} Only (Rs. {formatCurrency(investment.amount)})</span> has been received from the Lender as a loan, and the Borrower acknowledges the receipt of the said amount in full.
                </p>

                <p>
                    <strong>3. LOAN TERM:</strong><br />
                    The loan tenure is limited to <span className="field-data underline">({numberToWords(investment.snapshot_policy_term).toUpperCase()}) ({investment.snapshot_policy_term})</span> months, commencing from <span className="field-data underline">({formatDateToOrdinal(investment.start_date)})</span> to <span className="field-data underline">({formatDateToOrdinal(investment.maturity_date)})</span>.
                </p>

                <p>
                    <strong>4. INTEREST RATE:</strong><br />
                    Both parties agree that the interest rate for the entire loan amount is <span className="field-data underline">per({interestRate}%)</span> annum.
                </p>

                <p>
                    <strong>5. PAYMENT TERMS:</strong><br />
                    {investment.snapshot_payout_type === 'MATURITY' ? (
                        <>
                            <strong>i) Deferred Payment (No Monthly Payments)</strong><br />
                            The Borrower shall not be required to make monthly payments. Instead, the total amount, including interest, shall be paid in full at the end of the loan term.
                        </>
                    ) : (
                        <>
                            <strong>ii) Monthly Interest Payments</strong><br />
                            The Borrower shall be required to make monthly interest payments. The total loan amount shall be paid in full at the end of the loan term.
                        </>
                    )}
                </p>

                <p>
                    <strong>6. EARLY REPAYMENT OPTION:</strong><br />
                    The Borrower has the right to repay the loan in full at any time before the end of the loan tenure. If the Borrower chooses to repay early, they shall only be required to pay interest accrued from the agreement date until the repayment date.
                </p>

                <p>
                    <strong>7. STIPULATED INTEREST:</strong><br />
                    The Lender shall not be entitled to charge any interest other than what is stipulated in this agreement.
                </p>

                <p>
                    <strong>8. PRIORITY IN CASE OF LIQUIDATION:</strong><br />
                    The Borrower assures that if, for any reason, BMS Capital Solutions (Pvt) Ltd is liquidated, priority shall be given to settle the loan before <span className="field-data underline">({formatDateToOrdinal(investment.maturity_date)})</span>. The Lender is not entitled to demand the loaned money in full or in part before this date. However, in the event that the Lender requests the repayment of the loan, an annual interest rate of 7% shall be provided on the loan. If the monthly interest method is applied, this rate shall be calculated proportionately for the actual duration the funds were held, and any interest already paid shall be adjusted against the final settlement.
                </p>

                <p>
                    <strong>9. EXTENSION OF LOAN:</strong><br />
                    The Lender has the right to consider an extension of the principal loan amount of Sri Lankan <span className="field-data underline">Rupees {numberToWords(investment.amount)} Only ({formatCurrency(investment.amount)})</span> upon the request of the Borrower.
                </p>

                <p>
                    <strong>10. DEFAULT IN PAYMENT:</strong><br />
                    The Borrower admits that in case of failure to pay the full loan amount and interest by <span className="field-data underline">({formatDateToOrdinal(investment.maturity_date)})</span>, the Lender shall be entitled to enforce the terms of this agreement and take legal action to recover the full amount.
                </p>

                <p>
                    <strong>11. BINDING AGREEMENT:</strong><br />
                    Both parties agree that they, along with their successors, heirs, executors, and liquidators, are bound by this agreement.
                </p>
            </div>

            <div className="signatures signature-section mt-24">
                <p className="text-sm italic mb-12">The parties hereby covenant with each other, for themselves and their heirs, executors, administrators, and assigns, to perform and observe all the covenants herein contained.</p>

                <div className="mt-12">
                    <p><strong>Lender:</strong> <span className="field-data">{customer?.full_name} ({customer?.customer_code})</span></p>
                    <div className="w-1/2 border-b border-black mt-12 mb-8"></div>
                </div>

                <div className="mt-16">
                    <p><strong>Borrower:</strong> (<span className="field-data">Gunabalasingam Mathivarman</span>), Director of BMS Capital Solutions (Pvt) Ltd</p>
                </div>

                <div className="witnesses mt-20">
                    <p className="font-bold mb-8">WITNESSES:</p>
                    {[0, 1].map((i) => {
                        // Priority: 1. Props witnesses, 2. Investment nested witnesses
                        const w = (witnesses && witnesses[i]) || (investment.witnesses && investment.witnesses[i]);

                        return (
                            <div key={i} className="mb-12">
                                <div className="flex items-end justify-between gap-8 mb-3">
                                    <div className="flex-1">
                                        <p className="m-0"><strong>{i + 1}. Name:</strong> (<span className="field-data">{w?.name || '__________________________'}</span>)</p>
                                    </div>
                                    <div className="w-[3in] border-b border-black pb-1"></div>
                                </div>
                                <p className="mb-2 pl-4"><strong>   NIC No:</strong> (<span className="field-data">{w?.nic || '__________________________'}</span>)</p>
                                <p className="mb-2 pl-4"><strong>   Address:</strong> (<span className="field-data">{w?.address || '__________________________'}</span>)</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="company-details-section mt-24 pt-8 border-t border-gray-100">
                <h3 className="text-[#2b5797] font-bold text-[11pt] mb-4">COMPANY DETAILS</h3>
                <div className="space-y-1 text-[10pt]">
                    <p className="m-0">Head Office: No. 6, 1st Floor, Main Street, Chankanai</p>
                    <p className="m-0">Tel: 0212223556</p>
                    <p className="m-0">Web: www.bmscapital.lk</p>
                    <p className="m-0">Email: info@bmscapital.lk</p>
                </div>
            </div>
        </div>
    );
}
