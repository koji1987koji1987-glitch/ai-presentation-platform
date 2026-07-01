# AI Presentation Platform (PrismAI)

A dynamic widescreen presentation platform (Gamma-style) that automatically parses input documents (PDF, Word DOCX) or prompt ideas, generates visual presentation structures using Gemini / OpenAI APIs, allows live interactive inline editing of slide outlines, and supports exporting slides to native, fully editable PowerPoint (.pptx) templates.

---

## Technical Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Vanilla CSS
- **Backend (Python)**: python-pptx, google-genai, openai, pypdf, python-docx

---

## Quick Start Guide

To run this project locally, you need to set up both the **Python Backend** dependencies and the **Next.js Frontend** environment.

### 1. Backend Setup (Python)

Ensure you have Python 3 installed. It is recommended to use a virtual environment:

```bash
# Navigate to the backend folder
cd backend

# Create a virtual environment
python3 -m venv venv

# Activate the virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install the Python dependencies
pip install -r requirements.txt
```

#### API Keys Configuration
1. Copy the template `.env` file inside the `backend` folder:
   ```bash
   cp .env.example .env
   ```
2. Open the newly created `backend/.env` file and insert your API keys:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   ```

*(Note: The application will run a local rule-based fallback generator if no API keys are configured, but an API key is highly recommended for full AI features).*

### 2. Frontend Setup (Next.js)

Open a new terminal window at the project root and navigate to the `frontend` folder:

```bash
# Navigate to the frontend folder
cd frontend

# Install Node dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## Project Structure

```
├── backend/                  # Python scripts handling text extraction and generation
│   ├── docx_reader.py        # Extracts text from Word documents
│   ├── pdf_reader.py         # Extracts text from PDF documents
│   ├── slide_generator.py    # Analyzes content & structures slides via Gemini/OpenAI
│   ├── ppt_exporter.py       # Exposes native PowerPoint shape drawing layout tools
│   ├── requirements.txt      # Python package declarations
│   └── .env.example          # Backend configuration template
│
└── frontend/                 # Next.js App Router workspace
    ├── app/
    │   ├── api/
    │   │   ├── upload/       # Receives document payloads, calls python processing
    │   │   ├── export/       # Calls python ppt_exporter to compile PPTX download
    │   │   └── images/       # Proxies public Unsplash APIs to search photos
    │   ├── presentation/     # Split-pane slide previewer and visual editor UI
    │   ├── upload/           # Drag-and-drop file upload landing page
    │   └── page.tsx          # Marketing home page and simulation sandbox
    └── package.json
```

---

## Troubleshooting

- **Python Execution Error**: If your terminal uses `python` instead of `python3` (common on Windows systems), the application dynamically checks for available executables in the system PATH and falls back to `python` automatically. Make sure Python is in your Environment Variables.
- **Virtual Environment Packages**: When running `npm run dev`, make sure you have activated your virtual environment in the terminal context, or that the required packages are installed globally, so the sub-processes can locate libraries like `google-genai` and `pptx`.
- **API Key Relocation Warning**: Do not add keys to `frontend/.env.local` — for security, the frontend runs python files in isolated processes that read configurations strictly from `backend/.env`.
