/**
 * IRIS Digital OS - Wisconsin Tax Engine (Task 3.2)
 * Goal: Automate payroll tax exemptions based on family relationship (F-01201A).
 * Compliant with IRS Publication 926 and Wisconsin DWD Domestic Employee rules.
 */

const TAX_RATES = {
    FICA_EMPLOYER: 0.0765, // 6.2% SS + 1.45% Medicare
    FUTA_EMPLOYER: 0.006,  // Federal Unemployment (Effective rate after credit)
    SUTA_EMPLOYER_AVG: 0.030 // Wisconsin State Unemployment (Estimated average for domestic)
};

/**
 * Calculates the total cost of a shift to the participant's budget.
 * Includes Gross Wage + Employer-side taxes (if not exempt).
 */
const calculateTotalCost = (grossWage, relationshipCode, workerAge) => {
    let taxes = {
        fica: 0,
        futa: 0,
        suta: 0
    };

    // logic based on F-01201A Relationship Identification
    switch (relationshipCode.toUpperCase()) {
        case 'SPOUSE':
        case 'PARENT':
            // Exempt from ALL: FICA, FUTA, SUTA
            break;

        case 'CHILD':
            if (workerAge && workerAge < 21) {
                // Exempt from ALL if under 21
                break;
            } else {
                // Exempt from SUTA only if 21 or over (Wisconsin Rule)
                taxes.fica = grossWage * TAX_RATES.FICA_EMPLOYER;
                taxes.futa = grossWage * TAX_RATES.FUTA_EMPLOYER;
            }
            break;

        case 'GRANDPARENT':
        case 'GRANDCHILD':
            // Exempt from SUTA only in Wisconsin
            taxes.fica = grossWage * TAX_RATES.FICA_EMPLOYER;
            taxes.futa = grossWage * TAX_RATES.FUTA_EMPLOYER;
            break;

        case 'NONE':
        default:
            // Standard non-exempt household employee
            taxes.fica = grossWage * TAX_RATES.FICA_EMPLOYER;
            taxes.futa = grossWage * TAX_RATES.FUTA_EMPLOYER;
            taxes.suta = grossWage * TAX_RATES.SUTA_EMPLOYER_AVG;
            break;
    }

    const totalTaxes = taxes.fica + taxes.futa + taxes.suta;
    const totalCostToBudget = grossWage + totalTaxes;

    return {
        grossWage: parseFloat(grossWage.toFixed(2)),
        taxBreakdown: {
            fica: parseFloat(taxes.fica.toFixed(2)),
            futa: parseFloat(taxes.futa.toFixed(2)),
            suta: parseFloat(taxes.suta.toFixed(2))
        },
        totalTaxes: parseFloat(totalTaxes.toFixed(2)),
        totalCostToBudget: parseFloat(totalCostToBudget.toFixed(2))
    };
};

module.exports = {
    calculateTotalCost,
    TAX_RATES
};
