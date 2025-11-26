// src/api.js

const API_URL = import.meta.env.VITE_BACKEND_URL;

// Call backend MCP endpoint
export async function callMcp(tool, input) {
  const response = await fetch(`${API_URL}/mcp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ tool, input })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Backend error: ${message}`);
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
