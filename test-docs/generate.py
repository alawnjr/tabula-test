"""
Generate fake financial PDFs for testing the data intake tab.

These are FAKE — names, account numbers, balances, addresses are invented.
Each document is shaped to exercise one of the extractor "kind" branches in
src/lib/integrations/extractor.ts so /case/.../review surfaces realistic patches.

Run:
    /tmp/pdfvenv/bin/python3 test-docs/generate.py
"""

from pathlib import Path
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)

OUT = Path(__file__).parent

styles = getSampleStyleSheet()
H1 = ParagraphStyle("H1", parent=styles["Heading1"], fontSize=16, spaceAfter=8)
H2 = ParagraphStyle("H2", parent=styles["Heading2"], fontSize=11, spaceAfter=4)
P = ParagraphStyle("P", parent=styles["BodyText"], fontSize=9.5, leading=13)
SMALL = ParagraphStyle("S", parent=styles["BodyText"], fontSize=8, leading=11, textColor=colors.grey)


def build(filename, story):
    doc = SimpleDocTemplate(
        str(OUT / filename),
        pagesize=LETTER,
        topMargin=0.6 * inch,
        bottomMargin=0.6 * inch,
        leftMargin=0.6 * inch,
        rightMargin=0.6 * inch,
        title=filename,
    )
    doc.build(story)
    print(f"  wrote {filename}")


def kv_table(rows):
    t = Table(rows, colWidths=[2.0 * inch, 4.5 * inch])
    t.setStyle(
        TableStyle(
            [
                ("FONT", (0, 0), (-1, -1), "Helvetica", 9.5),
                ("FONT", (0, 0), (0, -1), "Helvetica-Bold", 9.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("LINEBELOW", (0, 0), (-1, -1), 0.25, colors.lightgrey),
            ]
        )
    )
    return t


def amount_table(rows, col1=3.0, col2=1.5):
    t = Table(rows, colWidths=[col1 * inch, col2 * inch])
    t.setStyle(
        TableStyle(
            [
                ("FONT", (0, 0), (-1, -1), "Helvetica", 9.5),
                ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 9.5),
                ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("LINEBELOW", (0, 0), (-1, 0), 0.5, colors.black),
                ("LINEBELOW", (0, -1), (-1, -1), 0.5, colors.black),
            ]
        )
    )
    return t


# 1. Bank statement — depositAccount x2 ----------------------------------
def bank_statement():
    s = []
    s.append(Paragraph("JPMorgan Chase Bank, N.A.", H1))
    s.append(Paragraph("Personal Account Statement", H2))
    s.append(Paragraph("Statement period: March 1, 2026 – March 31, 2026", SMALL))
    s.append(Spacer(1, 14))

    s.append(Paragraph("Customer", H2))
    s.append(
        kv_table(
            [
                ["Name", "Jordan A. Reyes"],
                ["Address", "418 Linden St Apt 2B, Springfield, IL 62701"],
                ["Customer #", "CHASE-9928401"],
            ]
        )
    )
    s.append(Spacer(1, 14))

    s.append(Paragraph("Account 1 — Total Checking", H2))
    s.append(
        kv_table(
            [
                ["Account number", "************4821"],
                ["Account type", "Checking"],
                ["Beginning balance (03/01)", "$1,032.18"],
                ["Deposits & credits", "+$4,820.00"],
                ["Withdrawals & debits", "-$4,604.63"],
                ["Ending balance (03/31)", "$1,247.55"],
            ]
        )
    )
    s.append(Spacer(1, 14))

    s.append(Paragraph("Account 2 — Chase Premier Savings", H2))
    s.append(
        kv_table(
            [
                ["Account number", "************9134"],
                ["Account type", "Savings"],
                ["Beginning balance (03/01)", "$8,210.74"],
                ["Interest earned", "+$1.26"],
                ["Deposits & credits", "+$200.00"],
                ["Ending balance (03/31)", "$8,412.00"],
            ]
        )
    )
    s.append(Spacer(1, 18))
    s.append(
        Paragraph(
            "Total relationship balance across all Chase accounts: $9,659.55",
            P,
        )
    )

    build("01-bank-statement-chase.pdf", s)


# 2. Pay stub — payStub (debtor 1) ---------------------------------------
def pay_stub():
    s = []
    s.append(Paragraph("Acme Logistics LLC", H1))
    s.append(Paragraph("Earnings Statement", H2))
    s.append(Spacer(1, 8))
    s.append(
        kv_table(
            [
                ["Employee", "Jordan A. Reyes"],
                ["Occupation", "Warehouse Coordinator"],
                ["Employee ID", "EMP-44218"],
                ["Pay frequency", "Bi-weekly (every 2 weeks)"],
                ["Pay period", "March 16, 2026 – March 29, 2026"],
                ["Pay date", "April 3, 2026"],
            ]
        )
    )
    s.append(Spacer(1, 14))

    s.append(Paragraph("Earnings (this pay period)", H2))
    s.append(
        amount_table(
            [
                ["Description", "Amount"],
                ["Regular wages (80 hrs @ $30.00)", "$2,400.00"],
                ["Overtime (4 hrs @ $45.00)", "$180.00"],
                ["Gross pay this period", "$2,580.00"],
            ]
        )
    )
    s.append(Spacer(1, 12))

    s.append(Paragraph("Deductions (this pay period)", H2))
    s.append(
        amount_table(
            [
                ["Description", "Amount"],
                ["Federal income tax", "$258.00"],
                ["Social Security (FICA)", "$159.96"],
                ["Medicare", "$37.41"],
                ["State income tax (IL)", "$127.71"],
                ["401(k) employee contribution (mandatory)", "$129.00"],
                ["401(k) voluntary additional", "$77.40"],
                ["Health insurance premium", "$92.50"],
                ["Union dues — Local 705", "$24.00"],
                ["Charitable contribution (United Way)", "$10.00"],
                ["Total deductions", "$915.98"],
                ["Net pay this period", "$1,664.02"],
            ]
        )
    )
    s.append(Spacer(1, 14))
    s.append(
        Paragraph(
            "Note: Bi-weekly figures. Multiply by 2.167 for monthly equivalents.",
            SMALL,
        )
    )

    build("02-pay-stub-acme.pdf", s)


# 3. Mortgage statement — securedDebt + realEstate -----------------------
def mortgage_statement():
    s = []
    s.append(Paragraph("Wells Fargo Home Mortgage", H1))
    s.append(Paragraph("Monthly Mortgage Statement", H2))
    s.append(Paragraph("Statement date: April 5, 2026  ·  Payment due: May 1, 2026", SMALL))
    s.append(Spacer(1, 14))

    s.append(Paragraph("Borrower & property", H2))
    s.append(
        kv_table(
            [
                ["Borrower", "Jordan A. Reyes"],
                ["Property address", "1284 Maple Avenue, Springfield, IL 62701"],
                ["Property type", "Single-family residence"],
                ["Estimated current market value", "$292,000.00"],
                ["Loan account number", "****-****-****-7782"],
                ["Loan origination date", "June 15, 2018"],
                ["Original loan amount", "$240,000.00"],
                ["Interest rate", "4.125% fixed"],
                ["Loan type", "Conventional 30-year mortgage (1st lien)"],
            ]
        )
    )
    s.append(Spacer(1, 14))

    s.append(Paragraph("Current loan balance", H2))
    s.append(
        amount_table(
            [
                ["Description", "Amount"],
                ["Principal balance (unpaid)", "$214,512.40"],
                ["Accrued interest", "$734.92"],
                ["Escrow balance", "$1,820.00"],
                ["Total amount owed (payoff estimate)", "$217,067.32"],
            ]
        )
    )
    s.append(Spacer(1, 14))

    s.append(Paragraph("This month's payment", H2))
    s.append(
        amount_table(
            [
                ["Description", "Amount"],
                ["Principal & interest", "$1,163.42"],
                ["Escrow (taxes + insurance)", "$412.10"],
                ["Total payment due May 1, 2026", "$1,575.52"],
            ]
        )
    )

    build("03-mortgage-statement-wellsfargo.pdf", s)


# 4. Auto loan statement — securedDebt (vehicle) + vehicle ---------------
def auto_loan_statement():
    s = []
    s.append(Paragraph("Ally Financial — Auto Loan Statement", H1))
    s.append(Paragraph("Statement date: April 8, 2026", SMALL))
    s.append(Spacer(1, 14))

    s.append(Paragraph("Account & vehicle", H2))
    s.append(
        kv_table(
            [
                ["Borrower", "Jordan A. Reyes"],
                ["Loan account number", "************3344"],
                ["Loan origination date", "March 12, 2020"],
                ["Original loan amount", "$22,400.00"],
                ["Interest rate", "5.49% fixed"],
                ["Vehicle", "2019 Toyota Camry SE"],
                ["VIN", "4T1B11HK5KU000000 (last 6: 000000)"],
                ["Mileage as of last service", "62,300 miles"],
                ["Estimated retail value (KBB)", "$14,500.00"],
                ["Lien holder", "Ally Financial — first lien"],
            ]
        )
    )
    s.append(Spacer(1, 14))

    s.append(Paragraph("Balance summary", H2))
    s.append(
        amount_table(
            [
                ["Description", "Amount"],
                ["Principal balance", "$11,184.07"],
                ["Accrued interest", "$54.18"],
                ["Total payoff (good through 04/30/2026)", "$11,238.25"],
                ["Next payment due (05/05/2026)", "$412.66"],
            ]
        )
    )

    build("04-auto-loan-ally.pdf", s)


# 5. Credit card statement — unsecuredDebt -------------------------------
def credit_card_statement():
    s = []
    s.append(Paragraph("Capital One Platinum Mastercard", H1))
    s.append(Paragraph("Account statement", H2))
    s.append(Paragraph("Closing date: March 28, 2026  ·  Payment due: April 24, 2026", SMALL))
    s.append(Spacer(1, 14))

    s.append(Paragraph("Account information", H2))
    s.append(
        kv_table(
            [
                ["Cardholder", "Jordan A. Reyes"],
                ["Account number", "****-****-****-5577"],
                ["Account opened", "September 4, 2017"],
                ["Credit limit", "$6,000.00"],
                ["Available credit", "$1,167.90"],
                ["APR (purchases)", "26.99%"],
            ]
        )
    )
    s.append(Spacer(1, 14))

    s.append(Paragraph("Balance summary", H2))
    s.append(
        amount_table(
            [
                ["Description", "Amount"],
                ["Previous balance", "$4,612.55"],
                ["Payments & credits", "-$200.00"],
                ["Purchases", "+$298.45"],
                ["Interest charged", "+$121.10"],
                ["New balance", "$4,832.10"],
                ["Minimum payment due", "$118.00"],
            ]
        )
    )
    s.append(Spacer(1, 14))
    s.append(
        Paragraph(
            "This is a general-purpose unsecured revolving credit account. "
            "Charges include groceries, fuel, online retail, and utilities.",
            SMALL,
        )
    )

    build("05-credit-card-capitalone.pdf", s)


# 6. Student loan statement — unsecuredDebt (studentLoans) ---------------
def student_loan_statement():
    s = []
    s.append(Paragraph("Nelnet — Federal Student Loan Servicing", H1))
    s.append(Paragraph("Quarterly account statement", H2))
    s.append(Paragraph("Statement date: April 1, 2026", SMALL))
    s.append(Spacer(1, 14))

    s.append(Paragraph("Borrower & loan", H2))
    s.append(
        kv_table(
            [
                ["Borrower", "Jordan A. Reyes"],
                ["Account number", "**********2299"],
                ["Loan program", "Federal Direct Unsubsidized Stafford Loan"],
                ["First disbursement", "August 25, 2014"],
                ["Final disbursement", "January 14, 2018"],
                ["Original principal (combined)", "$32,000.00"],
                ["Interest rate (weighted avg)", "5.05%"],
                ["Servicer", "Nelnet, Inc."],
                ["Repayment plan", "Standard 10-year"],
            ]
        )
    )
    s.append(Spacer(1, 14))

    s.append(Paragraph("Current balance", H2))
    s.append(
        amount_table(
            [
                ["Description", "Amount"],
                ["Outstanding principal", "$28,402.16"],
                ["Accrued interest", "$214.67"],
                ["Total amount owed", "$28,616.83"],
                ["Monthly payment", "$334.12"],
            ]
        )
    )

    build("06-student-loan-nelnet.pdf", s)


# 7. Retirement statement — retirement -----------------------------------
def retirement_statement():
    s = []
    s.append(Paragraph("Fidelity NetBenefits — Workplace Retirement", H1))
    s.append(Paragraph("Quarterly Statement: Q1 2026 (Jan 1 – Mar 31)", H2))
    s.append(Spacer(1, 14))

    s.append(Paragraph("Plan participant", H2))
    s.append(
        kv_table(
            [
                ["Participant", "Jordan A. Reyes"],
                ["Plan sponsor", "Acme Logistics LLC 401(k) Plan"],
                ["Plan #", "78340-001"],
                ["Account number", "************6611"],
                ["Account type", "Traditional 401(k) — pre-tax"],
                ["Vesting", "100% vested"],
            ]
        )
    )
    s.append(Spacer(1, 14))

    s.append(Paragraph("Account value", H2))
    s.append(
        amount_table(
            [
                ["Description", "Amount"],
                ["Beginning balance (Jan 1, 2026)", "$39,488.21"],
                ["Employee contributions (Q1)", "+$1,344.00"],
                ["Employer match (Q1)", "+$672.00"],
                ["Net investment gain", "+$645.79"],
                ["Ending balance (Mar 31, 2026)", "$42,150.00"],
            ]
        )
    )
    s.append(Spacer(1, 14))

    s.append(Paragraph("Holdings (top 3)", H2))
    s.append(
        amount_table(
            [
                ["Fund", "Allocation"],
                ["Fidelity 500 Index (FXAIX)", "60.0%"],
                ["Fidelity Total Bond (FTBFX)", "25.0%"],
                ["Fidelity International Index (FSPSX)", "15.0%"],
            ]
        )
    )

    build("07-retirement-401k-fidelity.pdf", s)


def main():
    print("Generating test PDFs in test-docs/ ...")
    bank_statement()
    pay_stub()
    mortgage_statement()
    auto_loan_statement()
    credit_card_statement()
    student_loan_statement()
    retirement_statement()
    print("Done.")


if __name__ == "__main__":
    main()
