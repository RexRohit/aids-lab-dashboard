# AI&DS Laboratory Audit Dashboard 📊🏫

A modern, real-time full-stack web application for college AI & DS (Artificial Intelligence & Data Science) department laboratory audit management, featuring a secure **Admin Panel** with **Google Sheets persistent cloud synchronization** and **instant Socket.IO real-time dashboard updates**.

Whenever an administrator adds, edits, deletes, or changes the operational status of computers in the Admin Panel, changes are saved to Google Sheets and instantly broadcast to all public dashboards without requiring a manual page refresh.

---

## 🚀 Key Features

1. **Public Laboratory Audit Dashboard**:
   - Live KPI Counters: Total Laboratories (6), Total Computers (175), Working Units, Faulty Units, and Health Index %.
   - Interactive Recharts analytics: Facility status comparison and hardware operational distribution.
   - Dedicated views for all six laboratories (`SWL`, `AR/VR`, `DSL`, `AIL`, `OSL`, `PL`) with laboratory specs, hardware configuration, and faculty in-charge.
   - Master cross-laboratory asset directory and printable official audit report.

2. **Secure Admin Management Panel (`/admin/login`, `/admin/dashboard`, `/admin/excel`)**:
   - Secure authentication with `bcryptjs` password hashing and HttpOnly session cookies.
   - Protected routes and endpoints.
   - View, add, edit, and delete equipment records in an editable spreadsheet-style table.
   - One-click toggle between Working and Faulty status with instant recalculation.
   - Edit laboratory information & specifications (Faculty In-Charge, Assistant, Room No, Area, Cost, OS, Tools, Hardware).
   - Drag-and-drop Excel file upload (`.xlsx`) with automated cloud sync.
   - Sticky **Save Changes** button with dirty tracking.

3. **Persistent Cloud Storage (Google Sheets API v4)**:
   - Uses Google Sheets as the persistent cloud spreadsheet, eliminating reliance on ephemeral Render disks.
   - Preserves the exact multi-sheet workbook structure (Summary sheet + 6 individual laboratory worksheets).
   - Seamless local fallback for offline/development environments.

4. **Instant Synchronization (Socket.IO)**:
   - Dual Socket.IO event broadcasting: `dashboard:updated` and `excel-updated`.
   - Real-time React state updates across all open clients within seconds.
   - Auto-reconnection and instant refetch logic tailored for Render sleeping dynos.

---

## 🛠️ Tech Stack

### Frontend
- **React 18** with **Vite**
- **Tailwind CSS** (Light & Dark theme)
- **Recharts** (Interactive charts)
- **Lucide React** (Modern iconography)
- **Axios** (API with credentials & JWT interceptors)
- **Socket.IO Client** (Real-time websocket events)

### Backend
- **Node.js** & **Express.js**
- **Google Sheets API v4** (`googleapis`)
- **ExcelJS** (Excel workbook parser & generator)
- **Socket.IO** (Real-time websocket server)
- **bcryptjs** (Admin password hashing)
- **jsonwebtoken** & **cookie-parser** (Secure HttpOnly session management)
- **multer** (Excel spreadsheet file upload handling)
- **chokidar** (File watching for local modifications)

---

## 🏛️ Laboratories Covered

- **SWL** – Software Laboratory (Room 202)
- **CL-II (AR/VR)** – Computer Laboratory-II / AR/VR (Room 234)
- **DSL** – Data Science Laboratory (Room 235)
- **AIL** – Artificial Intelligence Laboratory (Room 236)
- **OSL** – Open Source Laboratory (Room 238)
- **PL** – Project Laboratory (Room 239)

---

## 🔑 Administrator Authentication

- **Admin Login Route**: `/admin/login`
- **Username**: `admin` (configured via `ADMIN_USERNAME`)
- **Password**: Configured securely via `ADMIN_PASSWORD_HASH` using bcrypt.

### 🛠️ Setting Your Admin Password Locally

To set your own password securely without writing plaintext to source code or git:
```bash
cd backend
npm run set-admin-password
```
The script prompts you for your desired password, generates a cost-factor 12 bcrypt hash, updates `backend/.env` automatically, and outputs the exact `ADMIN_PASSWORD_HASH` value to paste into Render.

---

## 📋 Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
NODE_ENV=production

# Admin Authentication (bcrypt hash)
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=your_bcrypt_hash_here
JWT_SECRET=your_jwt_secret_key_here

# Frontend Origin for CORS (e.g. Vercel domain in production)
FRONTEND_URL=https://aids-lab-dashboard.vercel.app

# Google Sheets Persistent Storage (Google Sheets API v4)
GOOGLE_SHEET_ID=1Wspnmg2nURjlA9R0Bh76jAepyW9hjaDNpwj9y1f_iD0
# Configure service account via Render Secret File (/etc/secrets/google-service-account.json)
# or via GOOGLE_SERVICE_ACCOUNT_KEY / GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY
```

### Frontend (`frontend/.env`)

```env
# URL of your Express Backend
VITE_API_URL=http://localhost:5000
```

---

## ☁️ Google Cloud & Google Sheets Setup Guide

Follow these steps to set up Google Sheets persistent cloud storage:

### Step 1: Create a Google Cloud Project & Enable Google Sheets API
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., `AIDS-Lab-Audit`).
3. In the left navigation, go to **APIs & Services** > **Library**.
4. Search for **Google Sheets API** and click **Enable**.

### Step 2: Create a Service Account & Generate Key
1. Go to **APIs & Services** > **Credentials**.
2. Click **Create Credentials** > **Service account**.
3. Enter a name (e.g., `sheets-sync-agent`) and click **Create and Continue**.
4. In the role dropdown, select **Editor** (or Basic > Editor), then click **Done**.
5. Click on the newly created Service Account email.
6. Go to the **Keys** tab > **Add Key** > **Create new key**.
7. Choose **JSON** and download the file.

### Step 3: Create Google Spreadsheet & Share with Service Account
1. Open [Google Sheets](https://sheets.google.com) and create a **Blank Spreadsheet**.
2. Name it `AI&DS Laboratory Audit 2026-27`.
3. Click the **Share** button at the top-right.
4. Paste the Service Account email (from the downloaded JSON file, e.g., `sheets-sync-agent@...iam.gserviceaccount.com`).
5. Set permission to **Editor** and click **Send** (uncheck "Notify people" if prompted).
6. Copy the **Spreadsheet ID** from the browser URL:
   `https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`

### Step 4: Add Credentials to Backend `.env`
Add the values to `backend/.env` (or Render Environment Variables):
- `GOOGLE_SHEET_ID=<SPREADSHEET_ID>`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL=<client_email from JSON>`
- `GOOGLE_PRIVATE_KEY="<private_key from JSON>"`

### Step 5: Initial Push of Audit Data to Google Sheets
Run the built-in sync command:
```bash
cd backend
npm run sync-sheets
```
This automatically formats and populates the `Summary` worksheet and all 6 laboratory worksheets into Google Sheets!

---

## 💻 Local Development Setup

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```
*Backend runs on: `http://localhost:5000`*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on: `http://localhost:5173`*

---

## 🚀 Deployment Instructions

### Deploying Backend on Render
1. Create a new **Web Service** on Render connected to your repository.
2. Root Directory: `backend`
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Under **Environment Variables**, add:
   - `PORT`: `10000`
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: `https://your-frontend-app.vercel.app`
   - `ADMIN_USERNAME`: `admin`
   - `ADMIN_PASSWORD_HASH`: `<bcrypt-hash-of-your-secure-password>`
   - `JWT_SECRET`: `<your-random-jwt-secret>`
   - `GOOGLE_SHEET_ID`: `<your-google-sheet-id>`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`: `<service-account-email>`
   - `GOOGLE_PRIVATE_KEY`: `"<private-key-with-\n>"`

### Deploying Frontend on Vercel
1. Create a new Project on Vercel connected to your repository.
2. Root Directory: `frontend`
3. Framework Preset: **Vite**
4. Under **Environment Variables**, add:
   - `VITE_API_URL`: `https://your-backend-app.onrender.com`
5. Deploy!
