import express from "express";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();


export const youtubeAuthRouter = express.Router();

export const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

youtubeAuthRouter.get("/login", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/youtube.force-ssl"
    ]
  });

  res.redirect(url);
});

youtubeAuthRouter.get("/callback", async (req, res) => {
  try {
    const { code } = req.query;

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    global.ACCESS_TOKEN = tokens.access_token;
    global.REFRESH_TOKEN = tokens.refresh_token;

    console.log("Tokens received:", tokens);

    res.send("<h1>Authentication successful! You may close this window.</h1>");
  } catch (err) {
    console.error("Callback error:", err);
    res.status(500).send("Authentication failed.");
  }
});
