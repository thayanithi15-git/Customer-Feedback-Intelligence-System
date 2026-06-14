# QuickCart Customer Feedback Intelligence System (CFIS)

This repository contains a full-stack system designed to process, clean, enrich, and visualize raw messy customer feedback.

## 🚀 How to Run the App

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **MongoDB** (Running locally at `mongodb://localhost:27017` or a remote Atlas connection string)
- **Gemini API Key** (Set as environment variable `GEMINI_API_KEY`)

---

### 2. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Configure your environment variables. Create or edit the `.env` file:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/feedback_intelligence
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server in watch mode:
   ```bash
   npm run dev
   ```
   The backend will run on `http://localhost:5000`.

---

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:3000`. Open it in your browser.

---

### 4. Running Ingestion
1. Go to the **Upload CSV** page on the web app.
2. You can drag and drop your `customer_feedback_raw.csv` or click **⚡ Process Local Workspace File** to run it instantly using the local file in the workspace.
3. Once completed, explore the **Dashboard** and **Feedback Explorer**.

---

## 🛠️ Key Decisions & Architecture

1. **Boilerplate and Noise Reduction (Pre-cleaning)**:
   The raw dataset contains system signatures (`Agent X was handling it`), order details (`order #123456`), and product city tags (`- my groceries order in Pune`). We stripped these out programmatically before sending the text to the LLM. This saves tokens, reduces API costs, and lets the LLM focus on the raw complaint text for summarization and sentiment analysis.
   
2. **Batch AI Ingestion**:
   To avoid rate limits and minimize cost, we batch records (25 rows per prompt) and request a structured JSON response. This reduces 1,800 network requests to only ~72 API requests, saving significant execution time and API cost.

3. **Resilient Date Parsing**:
   Instead of depending on heavy libraries, we wrote a custom date parsing utility that safely parses dates of various formats (`DD-MM-YYYY`, `MM/DD/YYYY`, text formats like `"March 18, 2024"`, and dates containing time decimals).

4. **Zero-Dependency SVG Charts**:
   To avoid compilation issues or React 19 compatibility errors with common charting libraries, we built the Dashboard trend chart using raw React-rendered responsive SVGs. This ensures high visual quality, animations, and complete build stability.

---

## ⚖️ Trade-offs & Future Improvements

1. **LLM Dependency for Translation**:
   Foreign languages (Spanish, French, Hinglish) are translated directly by the LLM during enrichment. While highly accurate, this adds slight latency compared to local translate libraries. With more time, a lightweight offline language detector (e.g. `franc`) could pre-filter rows before LLM analysis.
   
2. **Job State Memory**:
   The upload job status is stored in-memory in the Express server. If the server crashes, the current upload progress state is lost. A persistent job queue (like `BullMQ` or simple MongoDB state collections) would be more robust for production scaling.

3. **Incremental Uploads**:
   The current system deletes the previous collection during upload to prevent duplication. For a live system, we would support incremental upserts matching against unique transaction IDs.
