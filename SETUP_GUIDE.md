# Setup and Testing Guide: TAT Monitoring System

This guide provides a comprehensive, step-by-step walkthrough to get the Automated TAT and Batch Monitoring system up and running from scratch.

---

## 1. Prerequisites

Before starting, ensure you have the following installed on your machine:

- **Node.js**: Version 18 or higher. [Download here](https://nodejs.org/).
- **npm**: Installed automatically with Node.js.
- **Git**: To clone/manage the repository.

---

## 2. Setting up MongoDB Atlas (Cloud)

MongoDB Atlas is the cloud-hosted version of MongoDB. Follow these steps to set it up:

1.  **Create an Account**: Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and sign up for a free account.
2.  **Create a New Project**: Give it a name like "TAT-Monitoring".
3.  **Deploy a Cluster**: Choose the **FREE** (Shared) tier. Select a provider (e.g., AWS) and a region close to you.
4.  **Database User**: 
    - Go to **Security > Database Access**.
    - Click **Add New Database User**.
    - Use "Password" authentication. Choose a username (e.g., `tat_user`) and a strong password. **Save these credentials.**
5.  **Network Access**:
    - Go to **Security > Network Access**.
    - Click **Add IP Address**.
    - Click **Allow Access from Anywhere** (0.0.0.0/0) for development purposes, or add your specific IP.
6.  **Get Connection String**:
    - Go to **Deployment > Database**.
    - Click **Connect** on your cluster.
    - Choose **Drivers** under "Connect to your application".
    - Copy the connection string. It will look like this:
      `mongodb+srv://tat_user:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority`
    - **Note**: Replace `<password>` with the actual password you created.

---

## 3. Setting up Redis

The system uses Redis for its queue (BullMQ) and transient caching.

### Redis Cloud (Free)
1.  Sign up at [Redis.io](https://redis.io/cloud/).
2.  Create a free subscription.
3.  Copy the Redis URL (e.g., `redis://default:TOKEN@redis-12345.c1.us-east-1-2.ec2.cloud.redislabs.com:12345`).

---

## 4. Local Project Configuration

### Step 1: Install Dependencies
Open your terminal in the `node-service` folder and run:
```bash
npm install
```

### Step 2: Configure Environment Variables
1.  Duplicate the `.env.example` file and rename it to `.env`.
2.  Open `.env` and update the values:
    - `MONGO_URI`: Paste your MongoDB Atlas connection string here.
    - `REDIS_URL`: Use `redis://localhost:6379` if running locally, or your cloud URL.
    - `PORT`: Default is `3001`.
    - `SMTP_...`: (Optional) Fill these if you want email alerts. Otherwise, leave them blank.

---

## 5. Ingesting EDOS Data

The system needs the test rules (schedules and TATs) to function.

1.  Ensure the `Edos List.csv` file is present (the system currently looks for it in the project root).
2.  Run the parser script:
    ```bash
    npm run parse-edos
    ```
3.  This will generate a `node-service/data/edos.json` file. The system will use this as a fast lookup for all 1000+ tests.

---

## 6. Running the System

You need both the **API Server** and the **Queue Worker** running simultaneously.

### Option 1: Development Mode (Concurrent)
This runs both in a single terminal window:
```bash
npm run dev
```

### Option 2: Separate Terminals (Production style)
**Terminal 1 (Server):**
```bash
npm start
```

**Terminal 2 (Worker):**
```bash
npm run worker
```

---

## 8. Frontend Setup

The system includes a Next.js-based frontend dashboard for visualizing the TAT monitoring data.

### Step 1: Install Frontend Dependencies
Navigate to the frontend directory and install dependencies:
```bash
cd frontend
npm install
```

### Step 2: Configure Frontend Environment
The frontend needs to know where to reach the backend API. Create a `.env.local` file in the frontend directory:
```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Step 3: Start the Frontend Development Server
```bash
npm run dev
```

The frontend will be available at `http://localhost:3001` (Next.js default port).

### Frontend Features
- **Real-time Dashboard**: Live updates using Socket.io
- **Sample Management**: View and filter samples
- **Batch Monitoring**: Track batch queues and metrics
- **Alert System**: Visual alerts for missed batches and SLA breaches
- **Analytics**: Charts and statistics using Recharts

---

## 9. Running the Complete System

For the full experience, you'll need three services running:

### Option 1: All Services (Recommended for Development)
**Terminal 1 (Backend API + Worker):**
```bash
cd node-service
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

### Option 2: Production Style
**Terminal 1 (Backend API):**
```bash
cd node-service
npm start
```

**Terminal 2 (Backend Worker):**
```bash
cd node-service
npm run worker
```

**Terminal 3 (Frontend):**
```bash
cd frontend
npm run dev
```

---

## 10. Testing the System

### Step 1: Health Check
Verify the server is up:
```bash
curl http://localhost:3001/health
```

### Step 2: Submit a Test Sample
Use `curl` or a tool like Postman to send a webhook.

**Scenario A: Normal Sample (On time)**
```bash
curl -X POST http://localhost:3001/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "sample_id": "SAP-001",
    "received_at": "2026-03-31T14:00:00+05:30",
    "test_name": "test_1",
    "method": "EIA",
    "specimen_type": "Serum",
    "agreed_tat_hours": 30,
    "priority_tat": "NORMAL"
  }'
```

**Scenario B: Missed Batch (Late arrival)**
Receive a sample after the 6:00 PM cutoff for `test_1`:
```bash
curl -X POST http://localhost:3001/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "sample_id": "SAP-002",
    "received_at": "2026-03-31T21:00:00+05:30",
    "test_name": "test_1",
    "agreed_tat_hours": 12
  }'
```

---

## 11. Verifying Results

### 1. Check Console Logs
Look at the terminal where your **Worker** is running. You should see:
- `Job completed` messages.
- Color-coded alert boxes:
  - **RED**: Missed Batch Alert.
  - **YELLOW**: SLA Breach Alert.

### 2. Check MongoDB
Open **MongoDB Atlas > Database > Browse Collections**.
- Look at the `samples` collection: You should see the computed `batch_id`, `eta`, `sla_deadline`, and `breach_flag`.
- Look at the `alerts` collection: You should see entries for every missed batch or breach.

### 3. Use the Backend APIs
- **List Samples**: `GET http://localhost:3001/api/samples`
- **View Stats**: `GET http://localhost:3001/api/stats`
- **View Recent Alerts**: `GET http://localhost:3001/api/alerts`

### 4. Test the Frontend Dashboard
Open your browser and navigate to `http://localhost:3001`:
- **Dashboard Overview**: See real-time statistics and charts
- **Samples Tab**: View and filter sample data
- **Batches Tab**: Monitor batch queues and metrics
- **Alerts Tab**: View system alerts and notifications
- **Real-time Updates**: The dashboard should automatically refresh when new samples are processed

### 5. Test End-to-End Workflow
1. With all services running, submit a test sample via curl or the frontend
2. Watch the console logs for processing
3. Check the frontend dashboard for real-time updates
4. Verify the data appears correctly in MongoDB

---

## Troubleshooting

### Backend Issues
- **Redis Connection Error**: Ensure the Redis server is running and the `REDIS_URL` in `.env` matches.
- **MongoDB Authentication Error**: Ensure your username/password in the URI are correct and your IP is whitelisted in Atlas.
- **EDOS Load Failure**: Ensure you've run `npm run parse-edos` at least once to generate the JSON cache.

### Frontend Issues
- **Frontend won't start**: Ensure you're in the `frontend` directory and have run `npm install`.
- **API Connection Error**: Verify the backend is running on `http://localhost:3001` and the `NEXT_PUBLIC_API_URL` in `frontend/.env.local` is correct.
- **Real-time updates not working**: Check that Socket.io is properly configured and the backend WebSocket connection is established.
- **Blank pages or errors**: Check the browser console for JavaScript errors and ensure all dependencies are installed.

### Port Conflicts
- If port 3001 is occupied: Change the backend `PORT` in `node-service/.env`
- If port 3001 is occupied: Start the frontend with `npm run dev -- -p 3002` and update `NEXT_PUBLIC_API_URL` accordingly
