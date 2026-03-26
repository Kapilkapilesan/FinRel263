"use client";

import React from "react";
import { LoanWithAgreement } from "@/services/loanAgreement.service";
import { numberToWords, formatAmount, calculateEndDate } from "@/utils/numberToWords";

interface LoanAgreementPrintDocumentProps {
    loan: LoanWithAgreement;
    printSection?: "acknowledgement" | "agreement" | "all";
}

// Common styles
const PAGE_STYLE: React.CSSProperties = {
    width: "210mm",
    minHeight: "297mm",
    padding: "20mm 25mm",
    background: "white",
    color: "#000",
    fontFamily: "'Times New Roman', 'Noto Serif Tamil', serif",
    fontSize: "10pt",
    lineHeight: "1.5",
    position: "relative",
    boxSizing: "border-box",
    pageBreakAfter: "always",
};

const LAST_PAGE_STYLE: React.CSSProperties = {
    ...PAGE_STYLE,
    pageBreakAfter: "auto",
};

const JUSTIFIED: React.CSSProperties = { textAlign: "justify" };
const CENTER: React.CSSProperties = { textAlign: "center" };
const BOLD: React.CSSProperties = { fontWeight: "bold" };

export default function LoanAgreementPrintDocument({ loan, printSection = "all" }: LoanAgreementPrintDocumentProps) {
    // --- Computed Values ---
    const loanAmount = Number(loan.approved_amount || loan.request_amount);
    const interestRate = loan.interest_rate_annum || loan.interest_rate || 21;
    const terms = loan.terms || 0;

    // Fallback rental calculation if loan.rentel is 0 (occurs if loan is not yet disbursed)
    let rental = Number(loan.rentel || 0);
    if (rental <= 0 && terms > 0) {
        const totalInterest = loanAmount * (interestRate / 100);
        rental = (loanAmount + totalInterest) / terms;
    }

    const serviceCharge = Number(loan.service_charge || 0);
    const docCharges = Number(loan.document_charge || 1000);
    const lessAmount = serviceCharge + docCharges;
    const bankTransferAmount = loanAmount - lessAmount;
    const defaultInterestMonthly = 5; // Can be made dynamic if field exists

    const agreementDate = loan.agreement_date
        ? new Date(loan.agreement_date)
        : new Date();
    const formattedDate = agreementDate.toLocaleDateString("en-GB");
    const tamilYear = agreementDate.getFullYear();
    const tamilMonth = agreementDate.getMonth() + 1;
    const tamilDay = agreementDate.getDate();
    const endDate = calculateEndDate(
        loan.agreement_date || new Date().toISOString(),
        (loan.terms || 48) + 1
    );

    const customerName = loan.customer?.full_name || "................................";
    const customerNIC = loan.customer?.customer_code || "................";
    const customerAddress = [
        loan.customer?.address_line_1,
        loan.customer?.address_line_2,
        loan.customer?.city,
    ]
        .filter(Boolean)
        .join(", ") || "................";

    const guardianName = loan.guardian_name || "................................";
    const guardianNIC = loan.guardian_nic || "................";
    const guardianAddress = loan.guardian_address || "................";

    const g1Name = loan.g1_details?.name || "................................";
    const g1NIC = loan.g1_details?.nic || "................";
    const g1Address = loan.g1_details?.address || "................";

    const g2Name = loan.g2_details?.name || "................................";
    const g2NIC = loan.g2_details?.nic || "................";
    const g2Address = loan.g2_details?.address || "................";

    const w1Name = loan.w1_details?.name || "................................";
    const w1NIC = loan.w1_details?.nic || "................";
    const w2Name = loan.w2_details?.name || "................................";
    const w2NIC = loan.w2_details?.nic || "................";

    const csuCode = loan.customer?.customer_code || "................";
    const contractNumber = loan.contract_number || "................";
    const spacedContractNumber = contractNumber.split("").join(" ");
    const fieldOfficer = loan.staff?.full_name || "................";

    const loanAmountWords = numberToWords(loanAmount);
    const serviceChargeWords = numberToWords(serviceCharge);

    return (
        <div id="loan-print-container">
            {/* ============================================================ */}
            {/* PAGE 1: Tamil Promissory Note + Checklist                     */}
            {/* ============================================================ */}
            {(printSection === "acknowledgement" || printSection === "all") && (<>
                <div className="print-page" style={{ ...PAGE_STYLE, fontSize: "10pt", padding: "15mm 20mm" }}>
                    {/* Title Row - aligned with Two-column layout below */}
                    <div style={{ display: "flex", gap: "20px", marginBottom: "24px", alignItems: "center" }}>
                        <div style={{ width: "20%" }}></div> {/* Matches LEFT COLUMN width */}
                        <div style={{ flex: 1, display: "flex", gap: "10px" }}> {/* Matches RIGHT COLUMN layout */}
                            <div style={{ flex: 1, textAlign: "center", fontFamily: "'Noto Serif Tamil', serif", fontSize: "14pt" }}>
                                உறுதிப்பத்திரம்
                            </div>
                            <div style={{ width: "60px", textAlign: "right", fontSize: "10pt" }}>
                                PN0007
                            </div>
                        </div>
                    </div>

                    {/* Two-column layout: Left (4 sections) + Right (content) */}
                    <div style={{ display: "flex", gap: "20px", marginTop: "5px" }}>
                        {/* LEFT COLUMN */}
                        <div style={{ width: "20%", fontFamily: "'Noto Serif Tamil', serif", fontSize: "9pt", lineHeight: "1.2" }}>
                            {/* Section 1 */}
                            <div style={{ marginBottom: "10px" }}>
                                <p style={{ margin: 0, fontSize: "8pt" }}>
                                    1. கடனாக பெற்ற மொத்த தொகை
                                </p>
                                <p style={{ margin: 0 }}>ரூபாய் <span style={BOLD}>Rs. {formatAmount(loanAmount)}/=</span></p>
                            </div>

                            {/* Section 2 */}
                            <div style={{ marginBottom: "10px" }}>
                                <p style={{ margin: 0, fontSize: "8pt" }}>
                                    2. வருட வட்டி நூற்றுக்கு வீதம்
                                </p>
                                <p style={{ margin: 0, ...BOLD }}>{interestRate}%</p>
                            </div>

                            {/* Section 3 */}
                            <div style={{ marginBottom: "10px" }}>
                                <p style={{ margin: 0, fontSize: "8pt" }}>
                                    3. கிழமைக்கு ஒரு தடவை தவணை
                                </p>
                                <p style={{ margin: 0 }}>ரூபாய் <span style={BOLD}>Rs. {formatAmount(rental)}/=</span></p>
                            </div>

                            {/* Section 4 */}
                            <div style={{ marginBottom: "10px" }}>
                                <p style={{ margin: 0, fontSize: "8pt" }}>
                                    4. கையொப்பம்
                                </p>
                                <div style={{ marginTop: "25px", borderBottom: "1px dotted #000", width: "70%" }}></div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div style={{ flex: 1, fontFamily: "'Noto Serif Tamil', serif", fontSize: "9pt", display: "flex", gap: "10px" }}>
                            <div style={{ flex: 1, marginTop: "0px" }}>
                                {/* Date line */}
                                <div style={{ ...CENTER, marginBottom: "10px", fontSize: "8pt" }}>
                                    {tamilYear} ஆண்டு {tamilMonth} மாதம் {tamilDay} திகதியன்று
                                </div>

                                {/* Boxed amount */}
                                <div style={{ ...CENTER, marginBottom: "21px" }}>
                                    <div style={{ display: "inline-block", border: "2px solid #000", padding: "10px 30px", textAlign: "center", borderRadius: "10px" }}>
                                        ரூபாய் <span style={{ fontSize: "12pt", ...BOLD }}>Rs. {formatAmount(loanAmount)}/=</span>
                                    </div>
                                </div>

                                {/* Tamil legal paragraph - Justified */}
                                <div style={{ textAlign: "center" }}>
                                    <p style={{ fontSize: "9pt", lineHeight: "1.3", textAlign: "justify" }}>
                                        கீழே கையொப்பமிடும் <span style={{ ...BOLD, textDecoration: "underline" }}>{customerAddress}</span> எனும் விலாசத்தில் வதியும் <span style={BOLD}>{customerName}</span> ஆகிய நான் இன்றைய தினம் இலக்கம் 06, முதல் தளம், பிரதான வீதி, சங்கானை விலாசத்தில் தனது பதிவுசெய்யப்பட்ட அலுவலகத்தைக் கொண்டுள்ள பி.எம்.எஸ் கேப்பிட்டல் சொல்யூசன்ஸ் பிரைவேட் லிமிடெட் நிறுவனத்திடமிருந்து இலங்கையில் செல்லுபடியாகும் பணத்தில் ரூபாய் <span style={BOLD}>{formatAmount(loanAmount)}</span>/= நிலுவை இன்றி கடனாக கேட்டு பெற்றுக்கொண்டேன். அத்தொகையை பி.எம்.எஸ் கேப்பிட்டல் சொல்யூசன்ஸ் பிரைவேட் லிமிடெட் நிறுவனமோ அல்லது நிறுவனத்தின் உத்தரவின் பேரிலோ கோரும் பட்சத்தில் செலுத்தவும் மற்றும் செலுத்தி முடிக்கும் வரை ஆண்டுக்கு நூற்றுக்கு <span style={BOLD}>{interestRate}%</span> வீதம் வட்டியை செலுத்தவும் உறுதியளித்து கையொப்பமிட்டேன்.
                                    </p>

                                    {/* Witnesses - Left Aligned */}
                                    <div style={{ marginTop: "12px", textAlign: "left" }}>
                                        <p style={{ fontSize: "8pt" }}>சாட்சிகள்</p>
                                        <div style={{ marginTop: "5px" }}>
                                            <p>{w1Name}</p>
                                            <div style={{ marginTop: "3px", width: "120px" }}></div>
                                            <p style={{ marginTop: "8px" }}>{w2Name}</p>
                                            <div style={{ marginTop: "3px", width: "120px" }}></div>
                                        </div>
                                    </div>
                                    <br />

                                    {/* Borrower signature area - Right Aligned with Tamil statement */}
                                    <div style={{ textAlign: "right", marginTop: "15px" }}>
                                        <p style={{ ...BOLD, fontSize: "8pt" }}>கடன்பெற்றோரின் கையொப்பம்</p>
                                        <p style={{ fontSize: "7pt", fontStyle: "italic" }}>
                                            மேற்கூறிய சகல பிரிவுகளையும் வாசித்து விளங்கிக்கொண்ட பின்னர் கையொப்பமிட்டேன்.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT-MOST DOTTED LINES - aligned to specific content rows */}
                            <div style={{ width: "60px", textAlign: "right", display: "flex", flexDirection: "column", color: "#666", fontSize: "9pt" }}>
                                {/* 1. Aligns with Date line */}
                                <span style={{ marginTop: "2px" }}>..............</span>
                                {/* 2. Aligns with Boxed amount */}
                                <span style={{ marginTop: "18px" }}>..............</span>
                                {/* 3. Aligns with 1st line of paragraph (address) */}
                                <span style={{ marginTop: "30px" }}>..............</span>
                                {/* 4. Aligns with 2nd line of paragraph (customer name) */}
                                <span style={{ marginTop: "0px" }}>..............</span>
                                {/* 5. Aligns with loan amount line in paragraph */}
                                <span style={{ marginTop: "26px" }}>..............</span>
                                {/* 6. Aligns with interest rate line in paragraph */}
                                <span style={{ marginTop: "34px" }}>..............</span>
                            </div>
                        </div>
                    </div>

                    {/* Tear-off dashed line */}
                    <div style={{ margin: "35px 0", borderTop: "1px dashed #000", width: "100%", position: "relative" }}>
                        <div style={{ position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)", background: "white", padding: "0 10px", fontSize: "12pt" }}>
                            ✂
                        </div>
                    </div>

                    {/* ---- CHECKLIST TABLE ---- */}
                    <div style={{ marginTop: "20px" }}>
                        <p style={{ ...CENTER, ...BOLD, fontSize: "9pt", marginBottom: "8px" }}>
                            BMS Capital Solutions - Micro Loan Documentation Check List
                        </p>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8pt", marginBottom: "5px", padding: "0 3px" }}>
                            <span style={{ marginBottom: "18px" }}>Contract No : {spacedContractNumber}</span>
                            <span>Landing Specialist : {fieldOfficer}</span>
                        </div>

                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8pt" }}>
                            <thead>
                                <tr style={{ background: "#f5f5f5", textTransform: "uppercase" }}>
                                    <th style={{ border: "1px solid #000", padding: "5px 5px", width: "30px" }}>No</th>
                                    <th style={{ border: "1px solid #000", padding: "5px 5px", textAlign: "left" }}>Description</th>
                                    <th style={{ border: "1px solid #000", padding: "5px 5px", width: "120px" }}>Status</th>
                                    <th style={{ border: "1px solid #000", padding: "5px 5px", width: "80px" }}>Remark</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { desc: "Loan Application", status: "Available In The File" },
                                    { desc: "Loan Request Letter, Loan Estimate", status: "Available In The File" },
                                    { desc: "NIC Copy Of The Borrower", status: "Available In The File / System" },
                                    { desc: "NIC Copy Of The Joint Borrower", status: "Available In The File / System" },
                                    { desc: "Copy Of Proof Of The Permanent Address", status: "Available In The File / System" },
                                    { desc: "Bank Book Copy", status: "Available In The File" },
                                    { desc: "Promissory Note", status: "Available In The File" },
                                    { desc: "Loan Agreement", status: "Available In The File" },
                                    { desc: "Deduction Letter", status: "Available In The File" },
                                    { desc: "Product Statement", status: "Available In The File" },
                                    { desc: "Business Place 2 Photographs", status: "Available In The System" },
                                    { desc: "Crib Of The Borrower, Joint Borrower", status: "Available In The System" },
                                ].map((item, idx) => (
                                    <tr key={idx}>
                                        <td style={{ border: "1px solid #000", padding: "4px 5px", textAlign: "center", ...BOLD }}>{idx + 1}</td>
                                        <td style={{ border: "1px solid #000", padding: "4px 5px" }}>{item.desc}</td>
                                        <td style={{ border: "1px solid #000", padding: "4px 5px", textAlign: "center", whiteSpace: "nowrap" }}>{item.status}</td>
                                        <td style={{ border: "1px solid #000", padding: "4px 5px", textAlign: "center", ...BOLD, whiteSpace: "nowrap" }}>( YES / NO )</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "28px", fontSize: "8pt", padding: "0 5px" }}>
                            <span>CHECKED BY (SIGNATURE) ........................................</span>
                            <span>Name ........................................</span>
                            <span>Date .................</span>
                        </div>
                    </div>
                </div>
            </>)}

            {/* ============================================================ */}
            {/* PAGE 2: English Loan Agreement - Party Definitions            */}
            {/* ============================================================ */}
            {(printSection === "agreement" || printSection === "all") && (<>
                <div className="print-page" style={PAGE_STYLE}>
                    {/* Title */}
                    <div style={{ ...CENTER, marginBottom: "25px" }}>
                        <p style={{ ...BOLD, textTransform: "uppercase", fontSize: "12pt" }}>
                            LOAN AGREEMENT {contractNumber}
                        </p>
                    </div>

                    <div style={{ ...JUSTIFIED, lineHeight: "1.5" }}>
                        {/* Company */}
                        <p>
                            <span style={BOLD}>BMS CAPITAL SOLUTIONS (PVT) LTD</span> bearing Registration No. PV 00315823 a company duly-incorporated in Sri Lanka and having its registered office at Chankanai in the Democratic Socialist Republic of Sri Lanka (hereinafter sometimes referred as the Company, which term or expression as herein used shall where the context so requires or admits mean and include the said BMS CAPITAL SOLUTIONS (PVT) LTD its successors in office and assigns)
                        </p>

                        <p style={{ ...CENTER, ...BOLD, margin: "15px 0" }}>AND</p>

                        {/* Borrower */}
                        <p>
                            <span style={BOLD}>{customerName}</span> (Holder of National Identity Card No <span style={BOLD}>{customerNIC}</span>) of <span style={BOLD}>{customerAddress}</span> in the Democratic Socialist Republic of Sri Lanka, (hereinafter sometimes referred to as the Debtor. which term or expression as herein used shall where the context so requires or admits mean and include the said Debtor his /her/its heirs executors, administrators and grantees.
                        </p>

                        <p style={{ ...CENTER, ...BOLD, margin: "15px 0" }}>AND</p>

                        {/* Joint Borrower */}
                        <p>
                            <span style={BOLD}>{guardianName}</span> (Holder of National Identity Card No <span style={BOLD}>{guardianNIC}</span>) of <span style={BOLD}>{guardianAddress}</span> in the Democratic Socialist Republic of Sri Lanka, (hereinafter sometimes referred to as the Join Borrower. which term or expression as herein used shall where the context so requires or admits mean and include the said Join Borrower his/her/its heirs executors, administrators and grantees.
                        </p>

                        <p style={{ ...CENTER, ...BOLD, margin: "15px 0" }}>AND</p>

                        {/* Guarantor 1 */}
                        <p>
                            <span style={BOLD}>{g1Name}</span> (Holder of National Identity Card No <span style={BOLD}>{g1NIC}</span>) of <span style={BOLD}>{g1Address}</span> in the Democratic Socialist Republic of Sri Lanka, (hereinafter sometimes referred to as the First Guarantor. which term or expression as herein used shall where the context so requires or admits mean and include the said First Guarantor his/her heirs executors, administrators and grantees.
                        </p>

                        <p style={{ ...CENTER, ...BOLD, margin: "15px 0" }}>AND</p>

                        {/* Guarantor 2 */}
                        <p>
                            <span style={BOLD}>{g2Name}</span> (Holder of National Identity Card No <span style={BOLD}>{g2NIC}</span>) of <span style={BOLD}>{g2Address}</span> in the Democratic Socialist Republic of Sri Lanka, (hereinafter sometimes referred to as the Second Guarantor. which term or expression as herein used shall where the context so requires or admits mean and include the said Second Guarantor his / her heirs executors, administrators and grantees bind among themselves into a Loan Agreement on this <span style={BOLD}>{formattedDate}</span>
                        </p>
                    </div>
                </div>

                {/* ============================================================ */}
                {/* PAGE 3: Terms & Conditions (a-g)                              */}
                {/* ============================================================ */}
                <div className="print-page" style={PAGE_STYLE}>
                    <div style={{ ...JUSTIFIED, lineHeight: "1.5" }}>
                        <p>
                            <span style={BOLD}>{customerName}</span> of <span style={BOLD}>{customerAddress}</span> being the Debtor has requested of Loan Sum of Rupees <span style={BOLD}>{loanAmountWords}</span> from the Company and the Company has agreed to grant this request under the terms and conditions set out fully hereinafter and under the Guarantee set out hereinafter. Therefore, the parties mentioned in this Agreement have mutually agreed on this, under the terms and condition mentioned below.
                        </p>

                        <div style={{ marginLeft: "30px", marginTop: "15px" }}>
                            <p style={{ marginBottom: "10px", paddingLeft: "25px", textIndent: "-25px" }}>
                                <span style={BOLD}>a.</span>&nbsp;&nbsp;&nbsp;The Company agrees to grant this loan sum of Rupees <span style={BOLD}>{loanAmountWords}</span> (Rs <span style={BOLD}>{formatAmount(loanAmount)}</span>) to the Debtor under and terms and conditions of this legal document, the Debtor agrees to pay to the Company above mentioned capital amount and the accrued interest thereon as detailed below. (the receipt whereof the debtor doth hereby admit and acknowledge) as par the schedule hereto. as per
                            </p>

                            <p style={{ marginBottom: "10px", paddingLeft: "25px", textIndent: "-25px" }}>
                                <span style={BOLD}>b.</span>&nbsp;&nbsp;The Debtor agrees promises and accepts to repay the said loan and interest thereon in Weekly installments as per the Schedule hereof. The Debtor should pay to the Company the installments, every Weekly regularly commencing from <span style={BOLD}>{formattedDate}</span> on the day the office is opened or on the previous day as per the schedule hereto.
                            </p>

                            <p style={{ marginBottom: "10px", paddingLeft: "25px", textIndent: "-25px" }}>
                                <span style={BOLD}>c.</span>&nbsp;&nbsp;&nbsp;&nbsp;If the Debtor fails to pay the said Weekly installment during the period the agreement is operative, as per the schedule hereto an {defaultInterestMonthly}% per month of an additional interest should be paid to the Company as a default interest for default of installments.
                            </p>

                            <p style={{ marginBottom: "10px", paddingLeft: "25px", textIndent: "-25px" }}>
                                <span style={BOLD}>d.</span>&nbsp;&nbsp;&nbsp;The Debtor should undertake to pay all dues, such as registration fee, tax insurance premium, penalty payments etc to relevant local government institution, as levied by them.
                            </p>

                            <p style={{ marginBottom: "10px", paddingLeft: "25px", textIndent: "-25px" }}>
                                <span style={BOLD}>e.</span>&nbsp;&nbsp;&nbsp;&nbsp;If the Debtor contravenes the terms and the conditions in the agreement, the Company will abrogate the agreement, after giving seven (07) days notice, in writing
                            </p>

                            <p style={{ marginBottom: "10px", paddingLeft: "25px", textIndent: "-25px" }}>
                                <span style={BOLD}>f.</span>&nbsp;&nbsp;&nbsp;After the abrogation of the agreement by the Company, the Debtor should pay all payments due, inclusive of the interest, penalties etc, within 14 days from the date of abrogation of the agreement.
                            </p>

                            <p style={{ marginBottom: "10px", paddingLeft: "25px", textIndent: "-25px" }}>
                                <span style={BOLD}>g.</span>&nbsp;&nbsp;&nbsp;The Debtor and the Guarantors have agreed to act in the following manner with regard to the said Loan.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ============================================================ */}
                {/* PAGE 4: Guarantor Obligations (I, II, III) + h, i, j + Schedule */}
                {/* ============================================================ */}
                <div className="print-page" style={PAGE_STYLE}>
                    <div style={{ ...JUSTIFIED, lineHeight: "1.5" }}>
                        {/* Roman numeral sections */}
                        <div style={{ marginLeft: "30px" }}>
                            <div style={{ display: "flex", marginBottom: "10px" }}>
                                <span style={{ ...BOLD, minWidth: "30px", flexShrink: 0 }}>I.</span>
                                <span>The said Debtor and his/her/their Guarantors, should sign a promissory note, promising and accepting to repay the amount, interest and the defaulted interest, if any and hand it over to the Company.</span>
                            </div>

                            <div style={{ display: "flex", marginBottom: "10px" }}>
                                <span style={{ ...BOLD, minWidth: "30px", flexShrink: 0 }}>II.</span>
                                <span>The Guarantors unconditionally and irrevocably hereby guarantees the repayment of the aforesaid loan by the Debtor on the due date together with interest thereon as afore stated and the performance of the terms and conditions herein. In no circumstances shall the guarantee stand discharged unless the repayment of the loan amount together with agreed interest thereon is made in full.</span>
                            </div>

                            <div style={{ display: "flex", marginBottom: "8px" }}>
                                <span style={{ ...BOLD, minWidth: "30px", flexShrink: 0 }}>III.</span>
                                <span>In order to give effect to the guarantee hereby given the Guarantors hereby expressly declares and agrees with the Company.</span>
                            </div>

                            {/* Sub-items of III */}
                            <div style={{ marginLeft: "30px" }}>
                                <div style={{ display: "flex", marginBottom: "8px" }}>
                                    <span style={{ minWidth: "20px", flexShrink: 0 }}>1.</span>
                                    <span>that the Guarantors will be liable in all respects as principle debtor to the extent aforementioned including the liability to be sued before recourse is had against the debtor.</span>
                                </div>
                                <div style={{ display: "flex", marginBottom: "8px" }}>
                                    <span style={{ minWidth: "20px", flexShrink: 0 }}>2.</span>
                                    <span>that the Company shall be at liberty either in one action to sue the debtor and the Guarantors jointly and severally or to proceed against the debtor in the First instance.</span>
                                </div>
                                <div style={{ display: "flex", marginBottom: "8px" }}>
                                    <span style={{ minWidth: "20px", flexShrink: 0 }}>3.</span>
                                    <span>to renounce the rights to claim that the Guarantors should be excused and the debtor should be proceeded against by action in the first instance.</span>
                                </div>
                                <div style={{ display: "flex", marginBottom: "8px" }}>
                                    <span style={{ minWidth: "20px", flexShrink: 0 }}>4.</span>
                                    <span>That the said guarantee shall not or become in any way prejudiced affected or unenforceable either wholly or any part by reason of any fact matter or circumstances concerning the debtor or any other person or concerning the account or conduct or any transaction of or with the debtor or any other person whether such fact matter or circumstances be known to or at any time come to the knowledge of the Company or not and whether or not the same be disclosed by the Company to the Guarantors.</span>
                                </div>
                                <div style={{ display: "flex", marginBottom: "8px" }}>
                                    <span style={{ minWidth: "20px", flexShrink: 0 }}>5.</span>
                                    <span>That the said guarantee shall be in addition and shall not in any way be prejudiced or affected by any collateral or other security then or thereafter held by the Company for all or any part of the monies herein mentioned.</span>
                                </div>
                            </div>

                            <p style={{ marginBottom: "10px", paddingLeft: "25px", textIndent: "-25px" }}>
                                <span style={BOLD}>h.</span>&nbsp;&nbsp;&nbsp;If for any reason, the Debtor defaults the payments of one installment, and by reason of that fact, the agreement stands cancelled. Accordingly, on this agreement, the Company is entitled to take legal action for the recovery of capital amount, interest and defaulted amounts, if any, from the Debtor and the or Guarantors.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ============================================================ */}
                {/* PAGE 5: Clauses i, j + Witness + Schedule                     */}
                {/* ============================================================ */}
                <div className="print-page" style={PAGE_STYLE}>
                    <div style={{ ...JUSTIFIED, lineHeight: "1.5" }}>
                        <div style={{ marginLeft: "30px" }}>
                            <p style={{ marginBottom: "10px", paddingLeft: "25px", textIndent: "-25px" }}>
                                <span style={BOLD}>i.</span>&nbsp;&nbsp;&nbsp;  The Guarantors binds themselves through this document, to ensure proper carrying out of the terms and conditions incorporated in this Legal Document.
                            </p>

                            <p style={{ marginBottom: "10px", paddingLeft: "25px", textIndent: "-25px" }}>
                                <span style={BOLD}>j.</span>&nbsp;&nbsp;&nbsp;The terms and conditions of this agreement are mandatory and the benefit shall be the protection of Company, its successors and assigns, Debtor, Guarantors, their heirs, executors, administrators and assigns.
                            </p>
                        </div>

                        {/* IN WITNESS */}
                        <p style={{ marginTop: "20px" }}>
                            IN WITNESS WHERE OF the Company Seal of BMS CAPITAL SOLUTIONS (PVT) LTD has been placed hereto and all the parties signed at Chankanai on this <span style={BOLD}>{formattedDate}</span>
                        </p>

                        {/* Schedule */}
                        <p style={{ ...CENTER, ...BOLD, textTransform: "uppercase", marginTop: "15px" }}>
                            SCHEDULE ABOVE REFERRED TO
                        </p>
                        <p style={{ ...CENTER, fontSize: "10pt", marginBottom: "15px" }}>
                            The installments payable and the period for payment of the said installments
                        </p>

                        <div style={{ maxWidth: "500px", marginLeft: "40px", marginBottom: "20px" }}>
                            {[
                                { label: "Loan amount", value: `${formatAmount(loanAmount)}/=` },
                                { label: "Interest rate (Annual)", value: `${interestRate} %` },
                                { label: "Installment (Weekly)", value: `${formatAmount(rental)}/=` },
                                { label: "Commencement of repayment of installments", value: formattedDate },
                                { label: "Repayment Period (Weeks)", value: `${terms}` },
                                { label: "Date completion of payment of installments", value: endDate },
                                { label: "Default Interest (Monthly)", value: `${defaultInterestMonthly}%` },
                            ].map((item, idx) => (
                                <div key={idx} style={{ display: "flex", padding: "4px 0", borderBottom: "1px solid #eee" }}>
                                    <span style={{ width: "310px", flexShrink: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                                        ➤ {item.label}
                                    </span>
                                    <span style={BOLD}>:- {item.value}</span>
                                </div>
                            ))}
                        </div>

                        <p style={{ marginTop: "25px" }}>Signed after getting everything given above understood</p>
                        <p style={{ marginTop: "8px" }}>
                            Signed after affixing the Stamp of BMS CAPITAL SOLUTIONS (PVT) LTD in the presence of authorized officer of the above Company.
                        </p>
                    </div>
                </div>

                {/* ============================================================ */}
                {/* PAGE 6: Signature Blocks                                      */}
                {/* ============================================================ */}
                <div className="print-page" style={PAGE_STYLE}>
                    <div style={{ lineHeight: "2.2" }}>
                        {/* Debtor */}
                        <div style={{ marginBottom: "15px" }}>
                            <p style={{ margin: 0 }}>Debtor</p>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={BOLD}>{customerName}</span>
                                <span>:- ........................................</span>
                            </div>
                        </div>

                        {/* Joint Borrower */}
                        <div style={{ marginBottom: "15px" }}>
                            <p style={{ margin: 0 }}>Join Borrower</p>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={BOLD}>{guardianName}</span>
                                <span>:- ........................................</span>
                            </div>
                        </div>

                        <div style={{ height: "15px" }}></div>

                        {/* 1st Guarantor */}
                        <div style={{ marginBottom: "15px" }}>
                            <p style={{ margin: 0 }}>1st Guarantor</p>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={BOLD}>{g1Name}</span>
                                <span>:- ........................................</span>
                            </div>
                        </div>

                        {/* 2nd Guarantor */}
                        <div style={{ marginBottom: "15px" }}>
                            <p style={{ margin: 0 }}>2nd Guarantor</p>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={BOLD}>{g2Name}</span>
                                <span>:-........................................</span>
                            </div>
                        </div>

                        <div style={{ height: "25px" }}></div>

                        {/* Witnesses */}
                        <div>
                            <p style={BOLD}>Witnesses</p>

                            {/* Witness 1 */}
                            <div style={{ marginTop: "10px" }}>
                                <div style={{ display: "flex", gap: "20px" }}>
                                    <span style={BOLD}>1.&nbsp;&nbsp;Signature</span>
                                    <span>:- ........................................</span>
                                </div>
                                <div style={{ marginLeft: "30px", marginTop: "10px" }}>
                                    <div style={{ display: "flex", gap: "20px" }}>
                                        <span style={{ ...BOLD, minWidth: "160px" }}>Full Name</span>
                                        <span>:- {w1Name}</span>
                                    </div>
                                    <div style={{ display: "flex", gap: "20px", marginTop: "5px" }}>
                                        <span style={{ minWidth: "160px" }}>National Identity Card</span>
                                        <span>:- {w1NIC}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Witness 2 */}
                            <div style={{ marginTop: "20px" }}>
                                <div style={{ display: "flex", gap: "20px" }}>
                                    <span style={BOLD}>2.&nbsp;&nbsp;Signature</span>
                                    <span>:- ........................................</span>
                                </div>
                                <div style={{ marginLeft: "30px", marginTop: "10px" }}>
                                    <div style={{ display: "flex", gap: "20px" }}>
                                        <span style={{ ...BOLD, minWidth: "160px" }}>Full Name</span>
                                        <span>:- {w2Name}</span>
                                    </div>
                                    <div style={{ display: "flex", gap: "20px", marginTop: "5px" }}>
                                        <span style={{ minWidth: "160px" }}>National Identity Card</span>
                                        <span>:- {w2NIC}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ============================================================ */}
                {/* PAGE 7: Deduction Letter (Last Page)                          */}
                {/* ============================================================ */}
                <div className="print-page" style={LAST_PAGE_STYLE}>
                    {/* Header Information: Name and CustomerNo on one line */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: "30px", marginBottom: "5px" }}>
                        <span style={{ ...BOLD, textTransform: "uppercase" }}>{customerName}</span>
                        <span style={BOLD}>CustomerNo : {csuCode}</span>
                    </div>

                    {/* Address */}
                    <div style={{ marginBottom: "25px" }}>
                        <p style={{ margin: 0 }}>{customerAddress},</p>
                    </div>

                    {/* Date */}
                    <p style={{ ...BOLD, marginBottom: "20px" }}>{formattedDate}</p>

                    {/* To */}
                    <div style={{ marginBottom: "15px" }}>
                        <p>The Manager</p>
                        <p style={{ ...BOLD, textTransform: "uppercase" }}>BMS CAPITAL SOLUTIONS (PVT) LTD</p>
                    </div>

                    <p style={BOLD}>Dear Sir.</p>

                    {/* Subject */}
                    <p style={{ ...CENTER, ...BOLD, textDecoration: "underline", margin: "15px 0" }}>
                        Service charges Deduction with consent to deduct Document charges at BMS
                    </p>

                    {/* Body */}
                    <div style={{ ...JUSTIFIED, lineHeight: "1.5" }}>
                        <p>
                            Further to my Agreement No <span style={{ ...BOLD, textDecoration: "underline" }}>{contractNumber}</span> entered in to by me with you on <span style={BOLD}>{formattedDate}</span> to obtain a loan of sum Rupees <span style={BOLD}>{loanAmountWords}</span> (Rs <span style={BOLD}>{formatAmount(loanAmount)}</span> /=)
                        </p>

                        <p style={{ marginTop: "10px" }}>
                            I do hereby give my consent and request to deduct a sum of Rupees <span style={BOLD}>{serviceChargeWords}</span> <span style={BOLD}>{formatAmount(serviceCharge)}</span> from the loan amount as a Service charges and sum of Rs.{formatAmount(docCharges)}/= as documentation charges
                        </p>
                    </div>

                    {/* Bottom section: Thank you + Breakdown */}
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px" }}>
                        {/* Left: Thank you */}
                        <div>
                            <p style={{ marginBottom: "8px" }}>Thank you</p>
                            <p>Yours Faith fully</p>
                        </div>

                        {/* Right: Breakdown table */}
                        <div style={{ fontSize: "11pt" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: "15px", marginBottom: "3px" }}>
                                <span>Loan Amount</span>
                                <span>:- {formatAmount(loanAmount)}/=</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: "15px", marginBottom: "3px" }}>
                                <span>Service Charges</span>
                                <span>:- {formatAmount(serviceCharge)}/=</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: "15px", marginBottom: "3px" }}>
                                <span>Document Charges</span>
                                <span>:- {formatAmount(docCharges)}/=</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: "15px", marginBottom: "3px", borderTop: "1px solid #000", paddingTop: "3px", ...BOLD }}>
                                <span>Less(-)</span>
                                <span>:- {formatAmount(lessAmount)}/=</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: "15px", ...BOLD }}>
                                <span>Cash Amount</span>
                                <span>:- {formatAmount(bankTransferAmount)}/=</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom signature area */}
                    <div style={{ marginTop: "30px" }}>
                        <p>........................</p>
                        <p style={{ marginTop: "10px" }}>NIC No. <span style={BOLD}>{customerNIC}</span></p>
                    </div>
                </div>
            </>)}
        </div>
    );
}
