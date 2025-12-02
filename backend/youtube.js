import axios from "axios";

export const youtubeAPI = {
  // Standard search with count
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
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return res.data;
  },
  // Recent activities (watch / like)
  history: async (token) => {
    const res = await axios.get(
      "https://www.googleapis.com/youtube/v3/activities",
      {
        params: {
          part: "snippet,contentDetails",
          mine: true,
          maxResults: 25
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return res.data;
  },

  // Liked videos (for better “activity”)
  likedVideos: async (token) => {
    const res = await axios.get(
      "https://www.googleapis.com/youtube/v3/videos",
      {
        params: {
          part: "snippet,contentDetails",
          myRating: "like",
          maxResults: 25
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return res.data;
  },

  // Like a specific video
  likeVideo: async (videoId, token) => {
    await axios.post(
      "https://www.googleapis.com/youtube/v3/videos/rate",
      {},
      {
        params: { id: videoId, rating: "like" },
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return { success: true };
  }
};
