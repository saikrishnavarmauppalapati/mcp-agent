// src/api.js

// Use deployed backend if VITE_BACKEND_URL is set, otherwise localhost
const API_URL =
  (import.meta.env.VITE_BACKEND_URL &&
    import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "")) ||
  "http://localhost:3000";

// Generic helper to call MCP tools on backend
export async function callMcp(tool, input = {}) {
  const response = await fetch(`${API_URL}/mcp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ tool, input })
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || `Backend error (status ${response.status})`);
  }

  try {
    return JSON.parse(text);
  } catch {
    // Some tools return plain text (e.g. AI summary)
    return text;
  }
}
