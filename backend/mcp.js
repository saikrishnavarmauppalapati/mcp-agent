import OpenAI from "openai";
import { youtubeAPI } from "./youtube.js";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Simple fallback parser for natural language search
function simpleParsePrompt(prompt) {
  if (!prompt) return { topic: "popular videos", maxResults: 5 };

  const m = prompt.match(/(\d+)\s+videos?\s+(of|about)\s+(.+)/i);
  let maxResults = 5;
  let topic = prompt;

  if (m) {
    maxResults = parseInt(m[1], 10);
    topic = m[3].trim();
  }

  if (Number.isNaN(maxResults)) maxResults = 5;
  if (maxResults < 1) maxResults = 1;
  if (maxResults > 10) maxResults = 10;

  return { topic, maxResults };
}

export async function handleMcpRequest(body) {
  const { tool, input } = body || {};

  if (!global.ACCESS_TOKEN) {
    return { error: "User must authenticate via /auth/login first." };
  }

  console.log("MCP request:", tool, input);

  try {
    // ---------------------------
    // 1) Plain search
    // ---------------------------
    if (tool === "youtube.search") {
      if (!input?.query) {
        return { error: "Missing 'query' for youtube.search." };
      }
      return youtubeAPI.search(global.ACCESS_TOKEN, input.query);
    }

    // ---------------------------
    // 2) Natural language search:
    //    e.g. "I want 4 videos of bmw"
    // ---------------------------
    if (tool === "youtube.naturalSearch") {
      if (!input?.prompt) {
        return { error: "Missing 'prompt' for youtube.naturalSearch." };
      }

      let topic;
      let maxResults;

      try {
        // Try OpenAI first
        const completion = await client.chat.completions.create({
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "user",
              content:
                `You are a parser. The user prompt is:\n` +
                input.prompt +
                `\n\nExtract:\n{"topic":"bmw cars","maxResults":4}\n` +
                `Return ONLY valid JSON.`
            }
          ]
        });

        const raw = completion.choices[0]?.message?.content || "{}";
        let parsed;
        try {
          parsed = JSON.parse(raw);
        } catch {
          parsed = {};
        }

        ({ topic, maxResults } = simpleParsePrompt(parsed.topic || input.prompt));
        if (parsed.maxResults) {
          const n = parseInt(parsed.maxResults, 10);
          if (!Number.isNaN(n)) maxResults = Math.min(Math.max(n, 1), 10);
        }
        console.log("Natural search (OpenAI) parsed:", { topic, maxResults });
      } catch (err) {
        // Fallback when OpenAI quota is over / error
        console.warn(
          "OpenAI failed for naturalSearch, using fallback:",
          err?.message || err
        );
        ({ topic, maxResults } = simpleParsePrompt(input.prompt));
      }

      return youtubeAPI.search(global.ACCESS_TOKEN, topic, maxResults);
    }

    // ---------------------------
    // 3) Like a video
    // ---------------------------
    if (tool === "youtube.likeVideo") {
      if (!input?.videoId) {
        return { error: "Missing 'videoId' for youtube.likeVideo." };
      }
      await youtubeAPI.likeVideo(global.ACCESS_TOKEN, input.videoId);
      return { success: true, videoId: input.videoId };
    }

    // ---------------------------
    // 4) Trending
    // ---------------------------
    if (tool === "youtube.trending") {
      const regionCode = input?.regionCode || "IN";
      return youtubeAPI.trending(global.ACCESS_TOKEN, regionCode);
    }

    // -----------------------------------------------------
    // 5) 🔥 MAIN FEATURE:
    //    Load recent watched + liked videos + DAY SUMMARY
    //    Used by "Load Recent Activity" button in the UI
    // -----------------------------------------------------
    if (tool === "youtube.getActivitySummary") {
      // Recent channel activity (watched/uploaded/likes/etc.)
      const history = await youtubeAPI.history(global.ACCESS_TOKEN, 50);
      const historyItems = history.items || [];

      // Videos explicitly liked by you
      const liked = await youtubeAPI.likedVideos(global.ACCESS_TOKEN, 50);
      const likedItems = liked.items || [];

      // Merge, avoid duplicates by videoId
      const map = new Map();

      const add = (list, type) => {
        for (const item of list) {
          const details = item.contentDetails || {};
          const vid =
            details.upload?.videoId ||
            details.recommendation?.resourceId?.videoId ||
            details.like?.resourceId?.videoId ||
            item.id; // fallback

          if (!vid) continue;

          if (!map.has(vid)) {
            map.set(vid, {
              ...item,
              videoId: vid,
              sources: new Set([type])
            });
          } else {
            map.get(vid).sources.add(type);
          }
        }
      };

      add(historyItems, "watched");
      add(likedItems, "liked");

      const combined = Array.from(map.values()).map((item) => ({
        ...item,
        sources: Array.from(item.sources)
      }));

      // Create titles list for AI or fallback summary
      const titles = combined
        .map((i) => i.snippet?.title)
        .filter(Boolean)
        .slice(0, 40);

      let daySummary;

      try {
        const completion = await client.chat.completions.create({
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "user",
              content:
                "These are the titles of videos the user watched or liked recently:\n" +
                titles.join("\n") +
                "\n\nWrite a DAY SUMMARY with:\n" +
                "- How many videos watched\n" +
                "- How many liked\n" +
                "- Main topics / interests\n" +
                "- 3–5 types of videos to watch next.\n" +
                "Keep it under 200 words."
            }
          ]
        });

        daySummary =
          completion.choices[0]?.message?.content?.trim() ||
          "Summary not available.";
      } catch (err) {
        console.warn(
          "OpenAI failed for activity summary, using simple fallback:",
          err?.message || err
        );
        daySummary = `Today you interacted with ${
          combined.length
        } videos. You watched around ${
          historyItems.length
        }, and liked about ${likedItems.length}.`;
      }

      return {
        summary: daySummary,
        watchedCount: historyItems.length,
        likedCount: likedItems.length,
        videos: combined
      };
    }

    return { error: `Unknown MCP tool: ${tool}` };
  } catch (err) {
    console.error("MCP error:", err);
    return { error: err.message || String(err) };
  }
}
