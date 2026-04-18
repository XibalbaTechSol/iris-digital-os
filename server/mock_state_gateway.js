/**
 * IRIS Digital OS - Virtual State Gateway (Task 7.5 Refined)
 * Goal: Identical emulation of Wisconsin State Systems (MCI, LTCFS, Sandata v7.6, LTC-IES).
 * All field names and data types are based on DHS P-00708 manuals and Sandata v7.6 specs.
 */

const express = require('express');
const app = express();
const PORT = 4000;

app.use(express.json());

// --- MODULE 1: ForwardHealth Portal (ASP.NET WebForms Mock) ---
// Exact form selector: ctl00$MainContent$txtProviderId
app.get('/WIPortal/Subsystem/Public/WPIProviderSearch.aspx', (req, res) => {
    res.send(`
        <html><body>
            <form method="post" action="./WPIProviderSearch.aspx">
                <input type="hidden" name="__VIEWSTATE" value="765432109876543210" />
                <input type="hidden" name="__EVENTVALIDATION" value="123456789012345678" />
                <input type="text" name="ctl00$MainContent$txtProviderId" placeholder="NPI" />
                <input type="submit" name="ctl00$MainContent$btnSearch" value="Search" />
            </form>
        </body></html>
    `);
});

// --- MODULE 2: Master Customer Index (MCI) - Identical 10-digit Protocol ---
app.get('/api/v1/mci/search', (req, res) => {
    const { ssn, dob } = req.query;
    console.log(`[MCI_MATCH] Verifying SSN: ${ssn.replace(/.(?=.{4})/g, '*')}`);
    
    // State Rule: MCI is ALWAYS a 10-digit numeric ID.
    res.json({
        "MCI_ID": "1000567890", 
        "First_Name": "JOHN",
        "Last_Name": "DOE",
        "Date_Of_Birth": dob, // MM/DD/YYYY or YYYY-MM-DD
        "Status": "MATCH_FOUND",
        "Source": "MCI_MASTER_TABLE"
    });
});

// --- MODULE 3: LTCFS Functional Screen - Identical Data Dictionary Headers ---
app.get('/api/v1/ltcfs/screen/:mci_id', (req, res) => {
    const { mci_id } = req.params;
    console.log(`[LTCFS_EXTRACT] Fetching FSIA record for ${mci_id}`);

    // Exact headers from Wisconsin FSIA extract layouts
    res.json({
        "Applicant_ID": mci_id,
        "Screen_Type": "002", // Annual
        "ADL_Bathing_Score": 1,
        "ADL_Eating_Score": 0,
        "IADL_Med_Mgmt_Score": 2,
        "Target_Group_PD": 1, // Physical Disability
        "Target_Group_FE": 0,
        "Level_Of_Care": "Nursing Home",
        "Eligibility_Result": "ELIGIBLE"
    });
});

// --- MODULE 4: Sandata v7.6 REST API - Identical JSON Keys & Validation ---
app.post('/interfaces/intake/visits/rest/api/v1.1', (req, res) => {
    const visits = req.body; // Array of objects
    
    // Exact schema check: Sandata v7.6 is case-sensitive
    const firstVisit = visits[0];
    if (!firstVisit.StaffOtherID || !firstVisit.PatientOtherID || !firstVisit.SequenceID) {
        return res.status(400).json({
            "status": "FAILED",
            "error_details": [{ "message": "Missing mandatory v7.6 fields (StaffOtherID/SequenceID)" }]
        });
    }

    res.status(200).json({
        "status": "SUCCESS",
        "batch_id": `SND_${Date.now()}`,
        "accepted_count": visits.length,
        "rejected_count": 0
    });
});

// --- MODULE 5: LTC-IES Encounter Response - Identical XML Body ---
app.post('/LTCareIES/SubmitEncounter', (req, res) => {
    res.set('Content-Type', 'text/xml');
    res.send(`
        <?xml version="1.0" encoding="UTF-8" ?>
        <submission_response>
            <status>ACCEPTED</status>
            <submission_id>${Date.now()}</submission_id>
            <mco_id>001</mco_id>
            <received_date>${new Date().toISOString().split('T')[0]}</received_date>
        </submission_response>
    `);
});

app.listen(PORT, () => {
    console.log(`[STATE_MOCK] All IRIS State Interfaces initialized on port ${PORT}`);
});
