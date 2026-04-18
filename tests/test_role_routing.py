from playwright.sync_api import sync_playwright

def test_roles():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000")
        
        # Give it a moment to render
        page.wait_for_selector(".user-profile select")
        
        roles = [
            'ADMIN', 
            'FEA_SPECIALIST', 
            'ICA_CONSULTANT', 
            'SDPC_NURSE', 
            'ADRC_AGENT', 
            'DHS_AUDITOR'
        ]
        
        results = {}
        for role in roles:
            # Change role
            page.select_option(".user-profile select", role)
            page.wait_for_timeout(500) # Small wait for react state update
            
            # Extract sidebar nav items
            nav_items = page.locator(".sidebar-nav .nav-item").all_inner_texts()
            # Clean up newlines from the icon + label
            nav_items = [item.replace("\n", " ").strip() for item in nav_items]
            results[role] = nav_items
            
        browser.close()
        
        # Print report
        print("======== ROLE VALIDATION REPORT ========")
        for role, items in results.items():
            print(f"\nRole: {role}")
            print(f"Modules Visible: {len(items)}")
            for item in items:
                print(f"  - {item}")

if __name__ == "__main__":
    test_roles()
