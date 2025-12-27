import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const app = express(); // ✅ app is created FIRST
app.use(express.json());

// Serve frontend files
app.use(express.static("public"));

// Get Zoom Access Token
async function getToken() {
  const res = await axios.post(
    "https://zoom.us/oauth/token",
    null,
    {
      params: {
        grant_type: "account_credentials",
        account_id: process.env.ZOOM_ACCOUNT_ID
      },
      auth: {
        username: process.env.ZOOM_CLIENT_ID,
        password: process.env.ZOOM_CLIENT_SECRET
      }
    }
  );
  return res.data.access_token;
}

// Create Meeting
app.post("/create-meeting", async (req, res) => {
  try {
    const token = await getToken();

    const response = await axios.post(
      "https://api.zoom.us/v2/users/me/meetings",
      {
        topic: req.body.topic || "Solo Project Meeting",
        type: 1,
        settings: {
            join_before_host: true,
            waiting_room: false
        }
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("Error creating meeting");
  }
});

app.post("/send-chat", async (req, res) => {
  try {
    const token = await getToken();

    const contacts = req.body.to_contacts || ["vizadenmesina@gmail.com", "vizaden02@gmail.com"];

    for (const email of contacts) {
      await axios.post(
        "https://api.zoom.us/v2/chat/users/me/messages",
        {
          message: req.body.message || "Hello from Zoom API👋",
          to_contact: email
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );
    }

    res.json({ status: "sent" });

  } catch (err) {
    console.error("ZOOM CHAT ERROR:");
    console.error(err.response?.data || err.message);

    res.status(err.response?.status || 500).json({
      error: "Error sending chat",
      details: err.response?.data || err.message
    });
  }
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
