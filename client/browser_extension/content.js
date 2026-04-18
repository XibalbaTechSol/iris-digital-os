/**
 * IRIS Digital OS - WISITS Sideload Content Script (Task 8.4)
 * Goal: Inject AI-generated content into the state portal's DOM.
 */

console.log("[IRIS_SIDELOAD] Content Script Active on WISITS.");

// 1. Exact WISITS Field IDs found during research
const WISITS_FIELDS = {
    NARRATIVE: 'ctl00_MainContent_txtNote',
    DATE: 'ctl00_MainContent_txtDate',
    TIME: 'ctl00_MainContent_txtTime',
    CATEGORY: 'ctl00_MainContent_ddlCategory',
    SAVE_BTN: 'ctl00_MainContent_btnSave'
};

/**
 * Listens for messages from the IRIS Digital OS App or Extension Popup.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "SIDELOAD_NOTE") {
        console.log("[IRIS_SIDELOAD] Received note for injection...");
        
        try {
            const noteEl = document.getElementById(WISITS_FIELDS.NARRATIVE);
            const dateEl = document.getElementById(WISITS_FIELDS.DATE);
            
            if (!noteEl) {
                alert("WISITS Case Note field not found. Please navigate to the entry screen.");
                return;
            }

            // 2. Inject the AI-generated structured note
            noteEl.value = request.data.structuredNote;
            
            // 3. Set standard defaults if empty
            if (dateEl && !dateEl.value) {
                dateEl.value = new Date().toLocaleDateString('en-US'); // MM/DD/YYYY
            }

            // 4. Highlight the field to show the user it worked
            noteEl.style.backgroundColor = "#e8f0fe";
            noteEl.style.border = "2px solid #4285f4";

            sendResponse({ success: true });
        } catch (e) {
            console.error("[IRIS_SIDELOAD] Injection error:", e);
            sendResponse({ success: false, error: e.message });
        }
    }
    return true; 
});
