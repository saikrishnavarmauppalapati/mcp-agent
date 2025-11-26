import { useState } from "react";
import { callMcp } from "./api";
import "./App.css";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

function App() {
  const [query, setQuery] = useState("");
  const [output, setOutput] = useState(
    '{\n  "info": "Use a button to start."\n}'
  );
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [videos, setVideos] = useState([]);

  const handleLogin = () => {
    // ✅ now goes to your Render backend in production
    window.location.href = `${BACKEND_URL}/auth/login`;
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    try {
      setLoading(true);
      setStatus("Searching YouTube…");

      const data = await callMcp("youtube.search", { query });
      setOutput(JSON.stringify(data, null, 2));

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

        setVideos(mapped);
      } else {
        setVideos([]);
      }

      setStatus("Search complete.");
    } catch (err) {
      console.error(err);
      setOutput(
        JSON.stringify(
          { error: "Request failed. Check backend." },
          null,
          2
        )
      );
      setVideos([]);
      setStatus("Error while searching.");
    } finally {
      setLoading(false);
    }
  };

  const handleHistory = async () => {
    try {
      setLoading(true);
      setStatus("Loading watch history…");
      const data = await callMcp("youtube.getHistory", {});
      setOutput(JSON.stringify(data, null, 2));
      setVideos([]);
      setStatus("History loaded.");
    } catch (err) {
      console.error(err);
      setOutput(
        JSON.stringify(
          { error: "Request failed. Check backend." },
          null,
          2
        )
      );
      setVideos([]);
      setStatus("Error while loading history.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendations = async () => {
    try {
      setLoading(true);
      setStatus("Asking AI for recommendations…");
      const data = await callMcp("youtube.recommendFromHistory", {});

      if (typeof data === "string") {
        setOutput(data);
      } else {
        setOutput(JSON.stringify(data, null, 2));
      }
      setVideos([]);
      setStatus("Recommendations ready.");
    } catch (err) {
      console.error(err);
      setOutput(
        JSON.stringify(
          { error: "Request failed. Check backend." },
          null,
          2
        )
      );
      setVideos([]);
      setStatus("Error while generating recommendations.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-root">
      <div className="app-shell">
        <header className="app-header">
          <div className="app-title-block">
            <h1>YouTube MCP Agent</h1>
            <p>Sign in, explore your watch history, and let AI suggest videos.</p>
          </div>
          <div className="app-logo">YT</div>
        </header>

        <section className="section">
          <div className="section-title">
            <span className="icon">🔐</span>
            <span>Authentication</span>
          </div>
          <p className="section-sub">
            Start by logging into your YouTube (Google) account so the agent can
            read your watch history.
          </p>
          <button
            className="btn btn-primary"
            onClick={handleLogin}
            disabled={loading}
          >
            Login with YouTube
          </button>
        </section>

        <section className="section">
          <div className="section-title">
            <span className="icon">🔍</span>
            <span>Search YouTube</span>
          </div>
          <div className="search-row">
            <input
              className="search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search anything (e.g. IIT, DevOps, Kubernetes)"
            />
            <button
              className="btn btn-secondary"
              onClick={handleSearch}
              disabled={loading}
            >
              Search
            </button>
          </div>
        </section>

        <section className="section">
          <div className="section-title">
            <span className="icon">📜</span>
            <span>Get Watch History</span>
          </div>
          <button
            className="btn btn-secondary"
            onClick={handleHistory}
            disabled={loading}
          >
            Load History
          </button>
        </section>

        <section className="section">
          <div className="section-title">
            <span className="icon">🤖</span>
            <span>AI Recommendations</span>
          </div>
          <p className="section-sub">
            The agent reads your recent watch history and asks OpenAI to suggest
            new videos you might like.
          </p>
          <button
            className="btn btn-primary"
            onClick={handleRecommendations}
            disabled={loading}
          >
            {loading ? "Thinking…" : "Get Recommendations"}
          </button>
        </section>

        <section className="section">
          <div className="section-title">
            <span className="icon">📤</span>
            <span>Output</span>
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

          {videos.length > 0 && (
            <div className="video-grid">
              {videos.map((video) => (
                <a
                  key={video.id}
                  className="video-card"
                  href={`https://www.youtube.com/watch?v=${video.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {video.thumbnail && (
                    <img src={video.thumbnail} alt={video.title} />
                  )}
                  <div className="video-info">
                    <h4>{video.title}</h4>
                    <p>{video.channel}</p>
                  </div>
                </a>
              ))}
            </div>
          )}

          <div className="output-box">{output}</div>
        </section>
      </div>
    </div>
  );
}

export default App;
