import { useState } from "react";
import { callMcp } from "./api";
import "./App.css";

function App() {
  const [aiQuery, setAiQuery] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const [searchVideos, setSearchVideos] = useState([]);
  const [activityVideos, setActivityVideos] = useState([]);
  const [activitySummary, setActivitySummary] = useState("");
  const [rawOutput, setRawOutput] = useState(
    '{\n  "info": "Use the buttons above to start."\n}'
  );

  // Local "optimistic" liked state (so UI updates immediately)
  const [likedIds, setLikedIds] = useState(new Set());

  // Redirect to backend auth route
  const handleLogin = () => {
    // For local dev
    window.location.href = "http://localhost:3000/auth/login";
    // For deployed frontend, change this to:
    // window.location.href = "https://mcp-youtube-agent-kzx6.onrender.com/auth/login";
  };

  // ------------------------------------------------
  // AI-powered natural language search
  // e.g. "I want 4 videos of BMW"
  // ------------------------------------------------
  const handleAiSearch = async () => {
    if (!aiQuery.trim()) return;
    try {
      setLoading(true);
      setStatus("Running AI search...");
      setSearchVideos([]);
      // keep activity section as-is

      const data = await callMcp("youtube.naturalSearch", {
        prompt: aiQuery
      });

      setRawOutput(JSON.stringify(data, null, 2));

      if (data && data.items) {
        const mapped = data.items
          .map((item) => {
            const snippet = item.snippet || {};
            const thumbs = snippet.thumbnails || {};
            const thumbUrl =
              thumbs.medium?.url || thumbs.high?.url || thumbs.default?.url;

            const id =
              item.id?.videoId ||
              item.id?.playlistId ||
              item.id?.channelId ||
              item.id;

            if (!id || !snippet.title) return null;

            return {
              id,
              title: snippet.title,
              channel: snippet.channelTitle,
              thumbnail: thumbUrl
            };
          })
          .filter(Boolean);

        setSearchVideos(mapped);
      }
      setStatus("AI search complete.");
    } catch (err) {
      console.error(err);
      setStatus("Error: AI search failed.");
      setRawOutput(
        JSON.stringify(
          { error: err.message || "AI search failed." },
          null,
          2
        )
      );
      setSearchVideos([]);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------
  // Load recent activity (watched + liked) + day summary
  // ------------------------------------------------
  const handleLoadActivity = async () => {
    try {
      setLoading(true);
      setStatus("Loading recent activity...");
      setActivityVideos([]);
      setActivitySummary("");

      const data = await callMcp("youtube.getActivitySummary", {});

      setRawOutput(JSON.stringify(data, null, 2));

      if (typeof data.summary === "string") {
        setActivitySummary(data.summary);
      } else {
        setActivitySummary("");
      }

      if (Array.isArray(data.videos)) {
        const mapped = data.videos
          .map((item) => {
            const snippet = item.snippet || {};
            const thumbs = snippet.thumbnails || {};
            const thumbUrl =
              thumbs.medium?.url || thumbs.high?.url || thumbs.default?.url;

            const id =
              item.videoId ||
              item.contentDetails?.upload?.videoId ||
              item.id;

            if (!id || !snippet.title) return null;

            return {
              id,
              title: snippet.title,
              channel: snippet.channelTitle,
              thumbnail: thumbUrl,
              sources: item.sources || []
            };
          })
          .filter(Boolean);

        setActivityVideos(mapped);

        // Update local likedIds with anything backend says is "liked"
        const newLiked = new Set(likedIds);
        mapped.forEach((v) => {
          if (v.sources?.includes("liked")) newLiked.add(v.id);
        });
        setLikedIds(newLiked);
      } else {
        setActivityVideos([]);
      }

      setStatus("Recent activity loaded.");
    } catch (err) {
      console.error(err);
      setStatus("Error: could not load activity.");
      setRawOutput(
        JSON.stringify(
          { error: err.message || "Failed to load activity." },
          null,
          2
        )
      );
      setActivityVideos([]);
      setActivitySummary("");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------
  // Like a video
  //  - instantly mark as liked in UI
  //  - then ask backend to like on YouTube
  //  - then refresh activity so stats & list update
  // ------------------------------------------------
  const handleLike = async (videoId) => {
    // Optimistic UI: update likedIds immediately
    setLikedIds((prev) => {
      const next = new Set(prev);
      next.add(videoId);
      return next;
    });

    try {
      setStatus("Liking video on YouTube...");
      await callMcp("youtube.likeVideo", { videoId });
      setStatus("Video liked! Refreshing activity...");

      // Re-load activity so summary & list reflect new like
      await handleLoadActivity();
    } catch (err) {
      console.error(err);
      setStatus("Error: could not like video.");

      // Optional: roll back optimistic like if you want
      // setLikedIds(prev => {
      //   const next = new Set(prev);
      //   next.delete(videoId);
      //   return next;
      // });
    }
  };

  // Helper to know if a video is liked (for button label/color)
  const isVideoLiked = (id) => likedIds.has(id);

  return (
    <div className="app-root">
      <div className="app-shell">
        {/* HEADER */}
        <header className="app-header">
          <div className="app-title-block">
            <h1>YouTube MCP Agent</h1>
            <p>
              Sign in, explore what you watched & liked today, and let AI help
              you discover the next videos.
            </p>
          </div>
          <div className="app-logo">YT</div>
        </header>

        {/* AUTH */}
        <section className="section">
          <div className="section-title">
            <span className="icon">🔐</span>
            <span>Authentication</span>
          </div>
          <p className="section-sub">
            Start by logging into your YouTube (Google) account so the agent can
            read your recent activity and liked videos.
          </p>
          <button
            className="btn btn-primary"
            onClick={handleLogin}
            disabled={loading}
          >
            Login with YouTube
          </button>
        </section>

        {/* AI SEARCH */}
        <section className="section">
          <div className="section-title">
            <span className="icon">🔎</span>
            <span>Search & Discover (AI powered)</span>
          </div>
          <p className="section-sub">
            You can type natural language, e.g.{" "}
            <code>"I want 4 videos of BMW"</code> or{" "}
            <code>"3 Kubernetes beginner tutorials"</code>.
          </p>
          <div className="search-row">
            <input
              className="search-input"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="Tell the agent what you want to watch..."
            />
            <button
              className="btn btn-secondary"
              onClick={handleAiSearch}
              disabled={loading}
            >
              AI Search
            </button>
          </div>

          {searchVideos.length > 0 && (
            <div className="video-grid">
              {searchVideos.map((v) => (
                <div className="video-card" key={v.id}>
                  <a
                    href={`https://www.youtube.com/watch?v=${v.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {v.thumbnail && (
                      <img src={v.thumbnail} alt={v.title} />
                    )}
                  </a>
                  <div className="video-info">
                    <h4>{v.title}</h4>
                    <p>{v.channel}</p>
                  </div>
                  <button
                    className={`btn-like ${
                      isVideoLiked(v.id) ? "liked" : ""
                    }`}
                    onClick={() => handleLike(v.id)}
                  >
                    {isVideoLiked(v.id) ? "✅ Liked" : "❤️ Like"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* HISTORY & DAY SUMMARY */}
        <section className="section">
          <div className="section-title">
            <span className="icon">📘</span>
            <span>History & Insights</span>
          </div>
          <div className="button-row">
            <button
              className="btn btn-secondary"
              onClick={handleLoadActivity}
              disabled={loading}
            >
              Load Recent Activity
            </button>
          </div>

          {activitySummary && (
            <div className="summary-box">
              <h3>Today&apos;s Summary</h3>
              <pre>{activitySummary}</pre>
            </div>
          )}

          {activityVideos.length > 0 && (
            <>
              <h3 className="subheading">Videos you watched / liked</h3>
              <div className="video-grid">
                {activityVideos.map((v) => (
                  <div className="video-card" key={v.id}>
                    <a
                      href={`https://www.youtube.com/watch?v=${v.id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {v.thumbnail && (
                        <img src={v.thumbnail} alt={v.title} />
                      )}
                    </a>
                    <div className="video-info">
                      <h4>{v.title}</h4>
                      <p>{v.channel}</p>
                      {v.sources?.length > 0 && (
                        <small>
                          Sources: {v.sources.join(", ")}
                        </small>
                      )}
                    </div>
                    <button
                      className={`btn-like ${
                        isVideoLiked(v.id) ? "liked" : ""
                      }`}
                      onClick={() => handleLike(v.id)}
                    >
                      {isVideoLiked(v.id) ? "✅ Liked" : "❤️ Like"}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* STATUS + RAW OUTPUT */}
        <section className="section">
          <div className="section-title">
            <span className="icon">📤</span>
            <span>Output & Raw Data</span>
          </div>

          {status && (
            <div className="status-pill">
              <div
                className={`status-dot${
                  status.toLowerCase().includes("error") ? " error" : ""
                }`}
              />
              <span>{status}</span>
            </div>
          )}

          <div className="output-box">
            <pre>{rawOutput}</pre>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
