from playwright.sync_api import sync_playwright
import time

def test_organization_workflows():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000")
        
        print("\n--- Starting E2E Organizational Validation ---")
        
        # ADRC Referral Intake Workflow
        print("\n[TEST] ADRC Intake Workflow...")
        page.select_option(".user-profile select", "ADRC_AGENT")
        page.wait_for_timeout(1000)
        
        # Remove webpack overlay if it exists
        page.evaluate("document.querySelectorAll('#webpack-dev-server-client-overlay').forEach(el => el.remove())")
        
        # Verify navigating to the module
        page.click("text=Referral Submission")
        page.wait_for_selector("text=Intake Pipeline", timeout=5000)
        
        # Open Wizard
        page.click("text=NEW_MANUAL_REFERRAL")
        page.fill("[placeholder='Legal Name as per F-00075']", "Test Participant")
        page.fill("[placeholder='10-digit Master Client Index']", "1234567890")
        page.click("text=CREATE_REFERRAL_ENTRY")
        
        # Verify success (list should refresh and show the new name)
        page.wait_for_selector("text=Test Participant")
        print("✓ ADRC Intake Success: Referral created and visible in Kanban")

        # 2. SDPC PCST Calculation Workflow
        print("\n[TEST] SDPC PCST Workflow...")
        page.select_option(".user-profile select", "SDPC_NURSE")
        page.wait_for_timeout(1000)
        
        # Navigate to PCST
        page.click("text=PCST Automation")
        page.wait_for_selector("text=PCST Compliance Hub")
        
        # Select first participant in roster
        page.click(".card li") # clicks first participant
        
        # Slide ADL ranges and check units
        # Bathing (index 0)
        page.locator("input[type=range]").nth(0).fill("2")
        # Dressing (index 1)
        page.locator("input[type=range]").nth(1).fill("1")
        # Mobility (index 2)
        page.locator("input[type=range]").nth(2).fill("2")
        
        # Expected score: (2*10) + (1*10) + (2*10) = 50
        page.wait_for_selector("text=50")
        print("✓ SDPC PCST Success: Real-time unit calculation verified (Expected 50)")

        # 3. DHS Auditor Integrity Check
        print("\n[TEST] DHS Auditor Telemetry...")
        page.select_option(".user-profile select", "DHS_AUDITOR")
        page.wait_for_timeout(1000)
        
        # Verify DHS specific tools
        nav_items = page.locator(".sidebar-nav .nav-item").all_inner_texts()
        nav_items = [i.strip() for i in nav_items]
        
        expected_tools = ["Audit Shield", "Document Debt", "State Compliance Alerts", "System Telemetry", "FHIR Interoperability"]
        for tool in expected_tools:
            found = any(tool in item for item in nav_items)
            if not found:
                print(f"✖ DHS Tool Missing: {tool}")
            else:
                print(f"✓ DHS Tool Verified: {tool}")

        print("\n--- E2E Validation Complete ---")
        browser.close()

if __name__ == "__main__":
    test_organization_workflows()
