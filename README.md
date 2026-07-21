# Explain My Bill

Explain My Bill is a full-stack demo built for the OpenAI Build Week hackathon, Apps for Your Life track. A user uploads a phone, utility, or insurance bill as an image or PDF, and the app uses a Groq-hosted multimodal model to extract line items, explain each charge in plain English, and flag anything that looks like a hidden fee, overcharge, or suspicious billing anomaly. The result is shown in a polished dashboard with a summary, chart, item-by-item explanations, and a dedicated flagged-items view.

## Tech Stack

- Frontend: Next.js (App Router), TypeScript, Tailwind CSS
- Backend: FastAPI (Python)
- LLM integration: Groq API through the OpenAI-compatible Python SDK
- Charts: Recharts
- PDF parsing: pdfplumber

## Project Structure

```text
.
|-- backend
|   |-- app
|   |   |-- main.py
|   |   |-- schemas.py
|   |   |-- services
|   |   |   `-- gpt_service.py
|   |   `-- utils
|   |       `-- file_processing.py
|   |-- .env.example
|   `-- requirements.txt
|-- frontend
|   |-- app
|   |-- components
|   |-- lib
|   |-- types
|   |-- .env.local.example
|   `-- package.json
`-- README.md
```

## What It Does

1. The user uploads a bill as a PDF or image.
2. The backend accepts the file through `POST /api/analyze-bill`.
3. If the file is a PDF, the backend extracts readable text with `pdfplumber`.
4. If the file is an image, the backend sends it to Groq as a base64 vision input.
5. The Groq-hosted model returns strict JSON describing:
   - total bill amount
   - currency
   - line items
   - plain-English explanations
   - flagged charges
   - anomalies
   - a short summary
6. The frontend renders the output as a visual dashboard.

## Prerequisites

- Python 3.10+
- Node.js 18.18+ or 20+
- npm
- A Groq API key with available quota

## Backend Setup

From the project root:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Set your API key for the current terminal session:

```powershell
$env:GROQ_API_KEY="your_groq_api_key_here"
```

Optional: choose a different Groq model for the backend session:

```powershell
$env:GROQ_MODEL="qwen/qwen3.6-27b"
```

Optional hardening configuration:

```powershell
$env:ALLOWED_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
$env:MAX_UPLOAD_SIZE_BYTES="10485760"
$env:MAX_PDF_PAGES="12"
```

Start the backend:

```powershell
uvicorn app.main:app --reload --port 8000
```

Backend endpoints:

- `GET http://127.0.0.1:8000/`
- `GET http://127.0.0.1:8000/api/health`
- `POST http://127.0.0.1:8000/api/analyze-bill`

## Frontend Setup

Open a second terminal from the project root:

```powershell
cd frontend
npm install
Copy-Item .env.local.example .env.local
npm run dev
```

The frontend runs at:

- `http://localhost:3000`

By default it expects the backend at:

- `http://127.0.0.1:8000`

If you want to point the frontend somewhere else, edit `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

## How to Run the Full App Locally

1. Start the backend in one terminal.
2. Make sure `GROQ_API_KEY` is set in that backend terminal.
3. Start the frontend in a second terminal.
4. Open `http://localhost:3000`.
5. Upload a bill image or PDF.
6. Review the generated dashboard.

## Manual API Test

If you want to test the backend directly in PowerShell:

```powershell
curl.exe -X POST http://127.0.0.1:8000/api/analyze-bill `
  -F "file=@C:\Users\DeLL\Downloads\my-bill.jpg"
```

Or:

```powershell
curl.exe -X POST http://127.0.0.1:8000/api/analyze-bill `
  -F "file=@C:\Users\DeLL\Downloads\electric-bill.pdf"
```

## Environment Variables

### Backend

Required:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=qwen/qwen3.6-27b
```

### Frontend

Optional:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

## Error Handling

The app includes basic MVP error handling for:

- unsupported file types
- empty uploads
- PDFs with no readable extracted text
- malformed model JSON
- Groq API failures
- Groq quota or rate-limit failures
- oversized uploads
- mismatched file signatures or spoofed content types
- PDFs that exceed the configured page limit

If your Groq account has no available quota, the frontend will show a user-friendly error banner and the backend will return a `429` response.

## Demo Flow for Judges

1. Open the app and drag in a phone, electricity, or insurance bill.
2. Show the loading state while analysis runs.
3. Walk through the total amount and one-line summary.
4. Use the chart to show how the bill is distributed across line items.
5. Open the flagged-items section to highlight suspicious charges or hidden fees.
6. Scroll through the plain-English explanations to show how technical billing language is translated into something understandable.

## Notes

- This MVP does not require a database.
- No files are persisted after request handling.
- Prompt logic is isolated in `backend/app/services/gpt_service.py` for easy tuning.
- The app is optimized for a short live demo and local development setup.
- The backend now enforces file-signature validation, upload size limits, and PDF page-count limits.

## Troubleshooting

### PowerShell `curl` issue

PowerShell aliases `curl` to `Invoke-WebRequest`, so use `curl.exe` for multipart upload examples.

### `Could not connect to server`

Make sure the FastAPI backend is running on port `8000`.

### `Groq quota or rate limit exceeded`

Your Groq API key is valid but does not currently have available quota, or your account is being rate-limited. Check your Groq plan and billing details, then retry.
