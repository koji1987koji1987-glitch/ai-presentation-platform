import sys
from pypdf import PdfReader

def read_pdf(file_path):
    reader = PdfReader(file_path)
    full_text = []
    
    for page in reader.pages:
        text = page.extract_text()
        if text:
            full_text.append(text)
            
    return '\n'.join(full_text)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 pdf_reader.py <pdf_path>", file=sys.stderr)
        sys.exit(1)
        
    path = sys.argv[1]
    try:
        content = read_pdf(path)
        print(content)
    except Exception as e:
        print(f"Error reading pdf: {e}", file=sys.stderr)
        sys.exit(1)
