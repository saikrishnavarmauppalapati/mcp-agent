import axios from "axios";

export const youtubeAPI = {
  // Search videos with optional maxResults
  search: async (token, query, maxResults = 5) => {
    const res = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          q: query,
          type: "video",
          maxResults
        },
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return res.data;
  },

  // Recent channel activity (uploads, likes, etc.)
  history: async (token, maxResults = 10) => {
    const res = await axios.get(
      "https://www.googleapis.com/youtube/v3/activities",
      {
        params: {
          part: "snippet,contentDetails",
          mine: true,
          maxResults
        },
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return res.data;
  },

  // ✅ NEW: videos you have liked (myRating=like)
  likedVideos: async (token, maxResults = 10) => {
    const res = await axios.get(
      "https://www.googleapis.com/youtube/v3/videos",
      {
        params: {
          part: "snippet,contentDetails,statistics",
          myRating: "like",
          maxResults
        },
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return res.data;
  },

  // Trending videos by region
  trending: async (token, regionCode = "IN", maxResults = 10) => {
    const res = await axios.get(
      "https://www.googleapis.com/youtube/v3/videos",
      {
        params: {
          part: "snippet,contentDetails,statistics",
          chart: "mostPopular",
          regionCode,
          maxResults
        },
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return res.data;
  },

  // Like a video
  likeVideo: async (token, videoId) => {
    await axios.post(
      "https://www.googleapis.com/youtube/v3/videos/rate",
      {},
      {
        params: { id: videoId, rating: "like" },
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return { success: true };
  }
};
