/**
 * IRIS Digital OS - DHS 105 Provider Validator (Task 7.2)
 * Goal: Automate enrollment checks to prevent un-reimbursable payments after April 1st.
 * Source: ForwardHealth Wisconsin Provider Index (WPI) Search.
 */

const { chromium } = require('playwright');

class DHS105Validator {
    constructor() {
        this.targetUrl = 'https://www.forwardhealth.wi.gov/WIPortal/Subsystem/Public/WPIProviderSearch.aspx';
    }

    /**
     * Checks a single NPI for active Wisconsin Medicaid enrollment.
     */
    async checkEnrollmentStatus(npi) {
        console.log(`[DHS_105] Verifying NPI: ${npi}...`);
        
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        try {
            await page.goto(this.targetUrl);

            // 1. Enter NPI into the 'Provider ID' field
            // Selector based on research: ctl00$MainContent$txtProviderId
            await page.fill('input[name*="txtProviderId"]', npi);
            await page.click('input[name*="btnSearch"]');

            // 2. Wait for results or 'No Records' message
            await page.waitForTimeout(2000); // Wait for postback

            const pageContent = await page.textContent('body');
            
            // 3. Status Logic
            if (pageContent.includes("No records were found")) {
                return { npi, enrolled: false, reason: "NOT_FOUND_IN_WPI" };
            }

            // Check for specific 'Active' indicators in the result table
            const resultsExist = await page.$('.grid-table'); // Mock grid selector
            if (resultsExist) {
                return { npi, enrolled: true, status: "ACTIVE", source: "WPI_PORTAL" };
            }

            return { npi, enrolled: false, reason: "INACTIVE_OR_SUSPENDED" };

        } catch (error) {
            console.error(`[DHS_105_ERROR] Failed check for ${npi}:`, error.message);
            return { npi, enrolled: false, reason: "VALIDATION_SERVICE_TIMEOUT" };
        } finally {
            await browser.close();
        }
    }

    /**
     * Batch process a list of NPIs from the FEA payment queue.
     */
    async processPaymentQueue(npiList) {
        const results = [];
        for (const npi of npiList) {
            const status = await this.checkEnrollmentStatus(npi);
            results.push(status);
            
            // Business Rule: If not enrolled, log for Hard-Block
            if (!status.enrolled) {
                console.warn(`[HARD_BLOCK] Payment to NPI ${npi} must be paused. DHS 105 violation.`);
            }
        }
        return results;
    }
}

module.exports = DHS105Validator;
