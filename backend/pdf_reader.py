from pypdf import PdfReader
import sys

pdf_path = sys.argv[1]

reader = PdfReader(pdf_path)

print("Pages:", len(reader.pages))

for i, page in enumerate(reader.pages):
    text = page.extract_text()

    print(f"\n--- PAGE {i + 1} ---")

    if text:
        print(text[:500])
    else:
        print("NO TEXT FOUND")
