"""
IRIS Digital OS - Smart PDF Burner (Task 2.4)
Goal: Generate state-compliant IRIS forms using the P-01032 naming convention.
"""

import os
from datetime import datetime
from pypdf import PdfReader, PdfWriter

class IRISDocumentGenerator:
    def __init__(self, template_dir="templates"):
        self.template_dir = template_dir
        self.output_dir = "data/generated_forms"
        os.makedirs(self.output_dir, exist_ok=True)

    def generate_worker_setup(self, worker_data):
        """
        Populates F-01201A: Relationship Identification
        """
        template_path = os.path.join(self.template_dir, "F-01201A.pdf")
        
        # P-01032 Naming Convention: [DocumentType]_[Initials]_[MMDDYYYY]
        initials = "".join([n[0] for n in worker_data['full_name'].split()]).upper()
        date_str = datetime.now().strftime("%m%d%Y")
        filename = f"RelID_{initials}_{date_str}.pdf"
        output_path = os.path.join(self.output_dir, filename)

        reader = PdfReader(template_path)
        writer = PdfWriter()

        # Copy pages and fill form fields
        page = reader.pages[0]
        writer.add_page(page)

        fields = {
            "WorkerName": worker_data['full_name'],
            "Relationship": worker_data['relationship_code'],
            "IsLiveIn": "Yes" if worker_data['is_live_in'] else "No",
            "EffectiveDate": datetime.now().strftime("%Y-%m-%d")
        }

        writer.update_page_form_field_values(writer.pages[0], fields)

        with open(output_path, "wb") as output_stream:
            writer.write(output_stream)
        
        print(f"[PDF_ENGINE] Generated: {filename}")
        return output_path

# Example Microservice Listener (Pseudocode)
# listen_for_event('CAREGIVER_SUBMITTED', lambda data: generator.generate_worker_setup(data))
