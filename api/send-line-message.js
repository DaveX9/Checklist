const axios = require("axios");
require("dotenv").config();

const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;

// 📌 API for Sending Messages to LINE
module.exports = async (req, res) => {
    const { userId, message } = req.body;

    if (!userId || !message) {
        return res.status(400).json({ error: "Missing userId or message" });
    }

    try {
        // ✅ Send Message via LINE API
        const response = await axios.post(
            "https://api.line.me/v2/bot/message/push",
            {
                to: userId,
                messages: [{ type: "text", text: message }],
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
                },
            }
        );

        res.status(200).json({ success: true, response: response.data });
    } catch (error) {
        console.error("❌ Error sending LINE message:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to send message" });
    }
};
