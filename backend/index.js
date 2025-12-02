import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { youtubeAuthRouter } from "./auth.js";
import { handleMcpRequest } from "./mcp.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// OAuth routes
app.use("/auth", youtubeAuthRouter);

// MCP endpoint
app.post("/mcp", async (req, res) => {
  try {
    const response = await handleMcpRequest(req.body);
    res.json(response);
  } catch (err) {
    console.error("Error in /mcp:", err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
