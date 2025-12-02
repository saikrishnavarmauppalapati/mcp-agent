# 📘 YouTube MCP Agent.

### AI-powered YouTube Assistant using Model Context Protocol (MCP)

This project is a fully functional **AI-driven YouTube Assistant** that integrates:

✔ **Model Context Protocol (MCP)**
✔ **YouTube Data API**
✔ **OpenAI GPT models**
✔ **Custom MCP tools for search, history, liking videos, and analytics**
✔ **Frontend (Vercel) + Backend (Render) deployment**

Users can log in with YouTube, explore history, ask AI to fetch videos, get insights, like videos, and generate personalized recommendations.

---

## 🚀 Features

### 🔐 Authentication

* Sign in with Google / YouTube OAuth 2.0
* Secure token exchange
* Scoped to:

  * `youtube.readonly`
  * `youtube.force-ssl`

### 🔎 AI-Powered Search

Users can type natural language requests such as:

* “I want **4 BMW car videos**”
* “Show me 3 Kubernetes tutorials”
* “Recommend comedy videos”

The MCP agent interprets the prompt, queries YouTube, and returns exactly the requested count.

### ❤️ Like Videos (Real YouTube Action)

* Perform **real likes** on the user’s YouTube account
* Likes instantly sync into the “Recent Activity”

### 🎬 Recent Activity Viewer

Loads:

* Videos watched today
* Videos liked today
* Uploads from channels the user follows
* Shorts / long videos
* Mixed activity summary

### 📊 Daily Insights & Analytics

The agent automatically summarizes:

* Number of videos watched
* How many liked
* What topics you consumed
* Top channels

### 🔧 MCP Tools

Custom MCP tools exposed from the backend:

* `youtube.search`
* `youtube.likeVideo`
* `youtube.getRecentHistory`
* `youtube.naturalSearch`
* `youtube.getActivitySummary`

---

## 🧩 Architecture

```
┌─────────────────────┐        ┌──────────────────────┐
│       FRONTEND       │        │       BACKEND         │
│  React + Vercel      │ <----> │ Node.js + Express     │
│                      │        │ Custom MCP Server     │
│ - Login Button       │        │ - OAuth2 handler      │
│ - AI Search UI       │        │ - MCP tools           │
│ - Video Grid         │        │ - YouTube API client  │
│ - Analytics UI       │        │ - OpenAI Integration  │
└─────────────────────┘        └──────────────────────┘
                                      │
                                      ▼
                             YouTube Data API
                             OpenAI GPT Models
```

---

## 🌍 Live Deployment

**Frontend (Vercel):**
🔗 [https://mcp-youtube-agent.vercel.app/](https://mcp-youtube-agent.vercel.app/)

**Backend (Render):**
🔗 [https://mcp-youtube-agent-kzx6.onrender.com/](https://mcp-youtube-agent-kzx6.onrender.com/)

---

## 📦 Project Structure

```
mcp-youtube-agent/
│
├── backend/
│   ├── index.js              # Express server + MCP endpoint
│   ├── auth.js               # Google OAuth2 login + callback
│   ├── youtube.js            # YouTube API tools
│   ├── mcp.js                # MCP tool routing logic
│   ├── package.json
│   └── .env
│
└── frontend/
    ├── src/
    │   ├── App.jsx           # Full UI + Logic
    │   ├── api.js            # MCP backend caller
    │   └── App.css
    ├── vite.config.js
    ├── package.json
    └── .env
```

---

## 🛠️ Local Setup

### 1️⃣ Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/mcp-youtube-agent
cd mcp-youtube-agent
```

---

## 🖥️ Backend Setup

### 2️⃣ Set environment variables

Create `backend/.env`:

```
PORT=3000
CLIENT_ID=your-google-client-id
CLIENT_SECRET=your-google-secret
REDIRECT_URI=http://localhost:3000/auth/callback
OPENAI_API_KEY=your-openai-key
```

### 3️⃣ Install & start

```bash
cd backend
npm install
node index.js
```

Backend runs at:

```
http://localhost:3000
```

---

## 🎨 Frontend Setup

### 4️⃣ Create `frontend/.env`

```
VITE_BACKEND_URL=http://localhost:3000
```

### 5️⃣ Install & start

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

---

## 🚀 Deployment

### Backend on Render

* Create new **Web Service**
* Set build command:

  ```
  npm install
  ```
* Set start command:

  ```
  node index.js
  ```
* Add Render Environment Variables:

  * CLIENT_ID
  * CLIENT_SECRET
  * OPENAI_API_KEY
  * REDIRECT_URI (Render URL)
  * PORT=3000

### Frontend on Vercel

* Import GitHub repo
* Add environment variable:

  ```
  VITE_BACKEND_URL=https://YOUR_RENDER_URL.onrender.com
  ```
* Deploy

---

## 🤖 MCP Tools (Technical Details)

### `youtube.search`

Search YouTube by keyword.

### `youtube.naturalSearch`

AI interprets natural language to generate search results.

### `youtube.likeVideo`

Likes a video on behalf of the user.

### `youtube.getActivitySummary`

Aggregates daily watch + like activity.

### `youtube.history`

Gets watch history (where permitted).

---

## 🧪 Example AI Queries

| User Input                   | Result                       |
| ---------------------------- | ---------------------------- |
| “I want 4 BMW videos”        | Returns exactly 4 BMW videos |
| “Give me 2 funny cat shorts” | Returns 2 shorts             |
| “What did I watch today?”    | Shows all watched videos     |
| “Show trends in India”       | Trending-IN results          |
| “Like this video for me”     | Performs YouTube Like        |

---

## 📄 License

MIT License – free to use, modify, and distribute.

---

## ✨ Author

**Shreeshail H**
YouTube MCP Agent Developer
Terralogic — AI Engineering Challenge

---
