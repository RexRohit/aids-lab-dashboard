# AI&DS Laboratory Audit Dashboard 📊🏫

A modern, real-time full-stack web application for college AI & DS (Artificial Intelligence & Data Science) department laboratory audit management.

The application uses an Excel workbook (`AI&DS Lab Audit sheet 2026-27.xlsx`) as its primary data source. When the Excel file is modified and saved, **Chokidar** detects the change, **ExcelJS** re-parses the data, and **Socket.IO** emits an event to instantly update the React dashboard without requiring a browser refresh.

---

## 🚀 Tech Stack

### Frontend
- **React 18** with **Vite**
- **Tailwind CSS** (Light & Dark mode support)
- **Recharts** (Bar & Donut status charts)
- **Lucide React Icons**
- **Axios** (API requests)
- **Socket.IO Client** (Real-time excel updates)

### Backend
- **Node.js** & **Express.js**
- **ExcelJS** (Primary Excel file parsing & data extraction)
- **Chokidar** (File watching & auto-detecting modifications)
- **Socket.IO** (Websocket broadcasting)
- **CORS**

---

## 📁 Project Structure

```
aids-lab-dashboard/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── KPICard.jsx
│   │   │   ├── Charts.jsx
│   │   │   ├── LabHealthCard.jsx
│   │   │   ├── EquipmentTable.jsx
│   │   │   ├── RecentIssuesTable.jsx
│   │   │   └── NotificationToast.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── LabPage.jsx
│   │   │   ├── EquipmentPage.jsx
│   │   │   └── ReportsPage.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── socket.js
│   │   ├── hooks/
│   │   │   └── useAuditData.js
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── backend/
│   ├── data/
│   │   └── AI&DS Lab Audit sheet 2026-27.xlsx
│   ├── routes/
│   │   └── api.js
│   ├── services/
│   │   └── excelService.js
│   ├── utils/
│   │   ├── generateExcel.js
│   │   └── watcher.js
│   ├── server.js
│   └── package.json
│
└── README.md
```

---

## 🏛️ Laboratories Covered

- **SWL** – Software Laboratory (Room 202)
- **AR/VR** – AR/VR Laboratory (Room 234)
- **DSL** – Data Science Laboratory (Room 235)
- **AIL** – AI Laboratory (Room 236)
- **OSL** – Operating Systems Laboratory (Room 238)
- **PL** – Programming Laboratory (Room 239)

---

## ⚡ Setup & Installation

### 1. Backend Setup

```bash
cd backend
npm install
npm run generate-excel # Generates initial AI&DS Lab Audit sheet 2026-27.xlsx
npm start
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

## 🔄 Real-Time Live Sync Demonstration

1. Open `http://localhost:5173` in your browser.
2. Edit `backend/data/AI&DS Lab Audit sheet 2026-27.xlsx` using Microsoft Excel, LibreOffice, or run `node backend/utils/generateExcel.js`.
3. As soon as the Excel file is saved, **Chokidar** will detect the change.
4. The dashboard header will flash "Last synced: Just now", a toast notification will pop up, and all KPI cards, charts, and audit tables will update automatically!
