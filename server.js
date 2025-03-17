const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static("views")); 

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/get-car-info", (req, res) => {
    const carData = {
        plateNumber: "5กก7884" 
    };
    res.json(carData);
});

app.post("/submit-checklist", async (req, res) => {
    try {
        const { inspector, equipment, dateTime, plateNumber } = req.body;
        let message = `📋 Checklist ตรวจสอบโดย: ${inspector}\n📅 วันที่: ${dateTime}\n🚗 ป้ายทะเบียน: ${plateNumber}\n\n`;

        const categories = {
            "1. อุปกรณ์ไฟฟ้า": [],
            "2. อุปกรณ์สุขาภิบาล": [],
            "3. อุปกรณ์สำหรับหลังคา": [],
            "4. อุปกรณ์กล่องตรวจสอบ": [],
            "5. อุปกรณ์กล่องย่อย": [],
            "6. อุปกรณ์อื่นๆ": []
        };

        equipment.forEach(item => {
            let formattedText = `🔹 ${item.name} ${item.status}`;

            if (item.remark && item.remark !== "-") {
                formattedText += ` (หมายเหตุ: ${item.remark})`;
            }

            if (item.name.startsWith("1.")) {
                categories["1. อุปกรณ์ไฟฟ้า"].push(formattedText);
            } else if (item.name.startsWith("2.")) {
                categories["2. อุปกรณ์สุขาภิบาล"].push(formattedText);
            } else if (item.name.startsWith("3.")) {
                categories["3. อุปกรณ์สำหรับหลังคา"].push(formattedText);
            } else if (item.name.startsWith("4.")) {
                categories["4. อุปกรณ์กล่องตรวจสอบ"].push(formattedText);
            } else if (item.name.startsWith("5.")) {
                categories["5. อุปกรณ์กล่องย่อย"].push(formattedText);
            } else if (item.name.startsWith("6.")) {
                categories["6. อุปกรณ์อื่นๆ"].push(formattedText);
            }
        });

        for (const [category, items] of Object.entries(categories)) {
            if (items.length > 0) {
                message += `${category}\n`;
                items.forEach(item => {
                    message += `${item}\n`;
                });
                message += `\n`;
            }
        }

        await axios.post(
            "https://api.line.me/v2/bot/message/push",
            {
                to: process.env.LINE_USER_ID,
                messages: [{ type: "text", text: message }],
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.LINE_ACCESS_TOKEN}`,
                },
            }
        );

        console.log("✅ Checklist sent to LINE Chat!");
        res.status(200).json({ success: true, message: "Checklist sent to LINE Chat!" });
    } catch (error) {
        console.error("❌ Failed to send checklist:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to send checklist" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
