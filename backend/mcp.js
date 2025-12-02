import OpenAI from "openai";
import { youtubeAPI } from "./youtube.js";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function requireAuth() {
  if (!global.ACCESS_TOKEN) {
    throw new Error("User must authenticate via /auth/login first.");
  }
  return global.ACCESS_TOKEN;
}


// Simple parser: extract number + topic from natural sentence
function parseNaturalSearchPrompt(prompt) {
  const numMatch = prompt.match(/(\d+)/);
  let count = numMatch ? parseInt(numMatch[1], 10) : 5;
  if (!Number.isFinite(count) || count <= 0) count = 5;
  // Hard cap so user can’t ask “1000 videos”
  if (count > 10) count = 10;

  // Rough topic cleaning
  let topic = prompt.replace(/(\d+)/, "");
  topic = topic.replace(/videos?/gi, "");
  topic = topic.replace(/\bof\b/gi, "");
  topic = topic.trim();

  if (!topic) topic = prompt.trim();

  return { topic, count };
}

export async function handleMcpRequest(body) {
  const { tool, input } = body || {};

  try {
    switch (tool) {
      // ───────────────────────────── youtube.search (keyword) ─────────────────────────────
      case "youtube.search": {
        const token = requireAuth();
        if (!input || !input.query) {
          return { error: "Missing 'query' for youtube.search." };
        }
        const data = await youtubeAPI.search(token, input.query, 10);
        return data;
      }

      // ───────────────────── youtube.naturalSearch (AI-style text, but exact count) ───────
      case "youtube.naturalSearch": {
        const token = requireAuth();
        const prompt = input?.prompt;
        if (!prompt) {
          return { error: "Missing 'prompt' for youtube.naturalSearch." };
        }

        const { topic, count } = parseNaturalSearchPrompt(prompt);

        const data = await youtubeAPI.search(token, topic, count);

        // Enforce exact count on returned items
        const items = (data.items || []).slice(0, count);

        return {
          tool: "youtube.naturalSearch",
          originalPrompt: prompt,
          parsedTopic: topic,
          requestedCount: count,
          items
        };
      }

      // ───────────────────────────── youtube.getActivitySummary ───────────────────────────
      case "youtube.getActivitySummary": {
        const token = requireAuth();

        const [history, liked] = await Promise.all([
          youtubeAPI.history(token),
          youtubeAPI.likedVideos(token)
        ]);

        const merged = [];

        (history.items || []).forEach((item) => {
          const snippet = item.snippet || {};
          const uploadId =
            item.contentDetails?.upload?.videoId || item.id;

          merged.push({
            id: uploadId,
            snippet,
            contentDetails: item.contentDetails,
            sources: ["history"]
          });
        });

        (liked.items || []).forEach((item) => {
          const existing = merged.find((m) => m.id === item.id);
          if (existing) {
            if (!existing.sources.includes("liked")) {
              existing.sources.push("liked");
            }
          } else {
            merged.push({
              id: item.id,
              snippet: item.snippet,
              contentDetails: item.contentDetails,
              sources: ["liked"]
            });
          }
        });

        let summaryText =
          "No AI summary (OpenAI quota may be exhausted).";

        try {
          const titles = merged
            .map((v) => v.snippet?.title)
            .filter(Boolean)
            .slice(0, 20)
            .join("\n");

          if (titles && process.env.OPENAI_API_KEY) {
            const completion = await client.chat.completions.create({
              model: "gpt-4.1-mini",
              messages: [
                {
                  role: "user",
                  content: `Here are some video titles the user watched or liked today:\n${titles}\n\nWrite a short friendly summary: how many videos, what topics, and what you think the user is currently interested in.`
                }
              ]
            });

            summaryText =
              completion.choices[0].message.content || summaryText;
          }
        } catch (err) {
          // keep summaryText as fallback
          console.error("OpenAI summary error:", err.message);
        }

        return {
          summary: summaryText,
          videos: merged
        };
      }

      // ───────────────────────────── youtube.likeVideo ────────────────────────────────────
      case "youtube.likeVideo": {
        const token = requireAuth();
        const videoId = input?.videoId;
        if (!videoId) {
          return { error: "Missing 'videoId' for youtube.likeVideo." };
        }
        const res = await youtubeAPI.likeVideo(videoId, token);
        return res;
      }

      default:
        return { error: `Unknown MCP tool: ${tool}` };
    }
  } catch (err) {
    console.error("MCP error:", err);
    return { error: err.message || "Internal MCP processing error." };
  }
}
