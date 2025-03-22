const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const path = require("path");
require("dotenv").config();
console.log("🔑 LINE Access Token:", process.env.LINE_ACCESS_TOKEN ? "Loaded" : "Not Found!");

// เพิ่ม
const mysql = require("mysql2/promise");

const db = mysql.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection()
    .then(() => console.log("✅ Connected to Railway MySQL"))
    .catch((err) => console.error("❌ MySQL Connection Failed:", err));
// หมด


const app = express();
// const PORT = process.env.PORT || 3000;
const PORT = process.env.PORT || 8080; // ✅ Use Railway-assigned PORT


app.use(bodyParser.json());
app.use(express.static("views"));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// 📌 Vehicle License Plates
const cars = {
    "นง 3": { plateNumber: "นง 3", year: 2022 },
    "9กษ1153": { plateNumber: "9กษ1153", year: 2021 },
    "5กก7884": { plateNumber: "5กก7884", year: 2023 }
};



// 📌 Vehicle Inspection Checklists
const checklists = {
    "นง 3": [
        {
            category: "1.อุปกรณ์ไฟฟ้า", details: [
                { id: "lan", name: "ชุด LAN เครื่อง (1) (Adapter 8)", expected: 1 },
                { id: "tv-tel", name: "ชุด TV-TEL (Splitter)", expected: 1 },
                { id: "adt", name: "ชุด Adapter เช็ค TV-TEL (สำรอง)", expected: 1 },
                { id: "rpc", name: "ชุดเต้ารับ (เครื่อง 1 สาย 1)", expected: 1 },
                { id: "3p", name: "ชุดวัด 3 เฟส (1 เครื่อง)", expected: 1 },
                { id: "hvd", name: "ชุดวัดแรงดันไฟ (1 เครื่อง)", expected: 1 },
                { id: "pdmt", name: "ชุดวัดกาว (1 ชุด)", expected: 1 },
                { id: "scdv", name: "ชุดไขควง (ธรรมดา 1 ไฟฟ้า 1)", expected: 1 },
                { id: "anm", name: "เครื่องวัดแรงลม (1 ชุด)", expected: 1 },
                { id: "wwck", name: "เครื่องเช็คน้ำอุ่น (1 ชุด)", expected: 1 },
                { id: "glo", name: "ถุงมือ (1 คู่)", expected: 1 },
                { id: "scb", name: "สายช็อต (1 สาย)", expected: 1 },
                { id: "and", name: "อุปกรณ์อื่นๆ" }// ไม่มีจำนวนที่กำหนด
            ]
        },
        {
            category: "2.อุปกรณ์สุขาภิบาล", details: [
                { id: "tank", name: "ถัง", expected: 3 },
                { id: "cloth", name: "ผ้า", expected: 9 },
                { id: "psc", name: "ดินน้ำมัน", expected: 1 },
                { id: "rbt", name: "สายยาง", expected: 5 },
                { id: "bgs", name: "เกตุ", expected: 1 },
                { id: "bread", name: "ขนมปัง", expected: 1 }
            ]
        },
        {
            category: "3.อุปกรณ์สำหรับหลังคา", details: [
                { id: "gst", name: "บันไดใหญ่", expected: 1 },
                { id: "sst", name: "บันไดเล็ก", expected: 1 },
                { id: "fld", name: "บันไดลิง", expected: 1 },
                { id: "tch", name: "ไฟฉาย", expected: 1 }
            ]
        },
        {
            category: "4.อุปกรณ์กล่องตรวจสอบ", details: [
                { id: "ifc", name: "กล้องอินฟาเรด", expected: 2 },
                { id: "mtmt", name: "เครื่องวัดความชื้น", expected: 2 },
                { id: "tms", name: "ตลับเมตร", expected: 1 },
                { id: "msrdv", name: "เครื่องวัดฝ้า", expected: 1 },
                { id: "mnmwt", name: "ระดับน้ำเล็ก", expected: 1 },
                { id: "tip", name: "ตัวทิป", expected: 1 },
                { id: "bct", name: "ปี๊ป", expected: 1 },
                { id: "dmr", name: "กระจกส่องประตู", expected: 1 },
                { id: "astc", name: "ฝอยดูดอากาศ", expected: 1 }
            ]
        },
        {
            category: "5.อุปกรณ์กล่องย่อย", details: [
                { id: "tape", name: "เทป", expected: 1 },
                { id: "asts", name: "ป้ายทุกระบบ", expected: 1 },
                { id: "btr", name: "ถ่าน", expected: 1 },
                { id: "plug", name: "ปลั๊ก", expected: 2 },
                { id: "clc", name: "ผ้า + แอลกอฮอล์", expected: 1 }
            ]
        },
        {
            category: "6.อุปกรณ์อื่นๆ", details: [
                { id: "kns", name: "ไม้เคาะ", expected: 5 },
                { id: "lle", name: "ระดับยาว", expected: 1 },
                { id: "shl", name: "ระดับน้ำสั้น", expected: 1 },
                { id: "brcb", name: "กล้องงูใหญ่" },// ไม่มีจำนวนที่กำหนด
                { id: "brcs", name: "กล้องงูเล็ก", expected: 1 },
                { id: "brccd", name: "กล้องงูคอนโด" },// ไม่มีจำนวนที่กำหนด
                { id: "tbct", name: "ที่ตัดท่อ", expected: 1 },
                { id: "chair", name: "เก้าอี้", expected: 2 },
                { id: "pipe", name: "ท่อ", expected: 1 },
                { id: "grille", name: "ตะแกรง", expected: 1 },
                { id: "hmer", name: "ค้อน", expected: 2 },
                { id: "raincoat", name: "เสื้อกันฝน", expected: 1 },
                { id: "hpsw", name: "เครื่องฉีดน้ำแรงดันสูง" },// ไม่มีจำนวนที่กำหนด
                { id: "rope", name: "เชือก", expected: 1 },
                { id: "wktk", name: "วอ", expected: 2 },
                { id: "stc", name: "สีเทสระบบ", expected: 1 },
                { id: "pliers", name: "คีม", expected: 1 }
            ]
        }
    ],
    "9กษ1153": [ // ✅ Fixed incorrect plate number
        {
            category: "1.อุปกรณ์ไฟฟ้า", details: [
                { id: "lan", name: "ชุด LAN เครื่อง (1) (Adapter 8)", expected: 1 },
                { id: "tv-tel", name: "ชุด TV-TEL (Splitter)" }, // ไม่มีจำนวนที่กำหนด
                { id: "adt", name: "ชุด Adapter เช็ค TV-TEL (สำรอง)", expected: 1 },
                { id: "rpc", name: "ชุดเต้ารับ (เครื่อง 1 สาย 1)", expected: 1 },
                { id: "3p", name: "ชุดวัด 3 เฟส (1 เครื่อง)", expected: 1 },
                { id: "hvd", name: "ชุดวัดแรงดันไฟ (1 เครื่อง)", expected: 1 },
                { id: "pdmt", name: "ชุดวัดกาว (1 ชุด)", expected: 1 },
                { id: "scdv", name: "ชุดไขควง (ธรรมดา 1 ไฟฟ้า 1)", expected: 2 },
                { id: "anm", name: "เครื่องวัดแรงลม (1 ชุด)", expected: 1 },
                { id: "wwck", name: "เครื่องเช็คน้ำอุ่น (1 ชุด)" }, // ไม่มีจำนวนที่กำหนด
                { id: "glo", name: "ถุงมือ (1 คู่)", expected: 1 },
                { id: "scb", name: "สายช็อต (1 สาย)", expected: 1 },
                { id: "and", name: "อุปกรณ์อื่นๆ" } // ไม่มีจำนวนที่กำหนด
            ]
        },
        {
            category: "2.อุปกรณ์สุขาภิบาล", details: [
                { id: "tank", name: "ถัง", expected: 5 },
                { id: "cloth", name: "ผ้า", expected: 10 },
                { id: "psc", name: "ดินน้ำมัน", expected: 1 },
                { id: "rbt", name: "สายยาง", expected: 2 },
                { id: "bgs", name: "เกตุ", expected: 1 },
                { id: "bread", name: "ขนมปัง", expected: 1 }
            ]
        },
        {
            category: "3.อุปกรณ์สำหรับหลังคา", details: [
                { id: "gst", name: "บันไดใหญ่", expected: 1 },
                { id: "sst", name: "บันไดเล็ก", expected: 1 },
                { id: "fld", name: "บันไดลิง", expected: 1 },
                { id: "tch", name: "ไฟฉาย", expected: 1 }
            ]
        },
        {
            category: "4.อุปกรณ์กล่องตรวจสอบ", details: [
                { id: "ifc", name: "กล้องอินฟาเรด", expected: 2 },
                { id: "mtmt", name: "เครื่องวัดความชื้น", expected: 1 },
                { id: "tms", name: "ตลับเมตร", expected: 1 },
                { id: "msrdv", name: "เครื่องวัดฝ้า", expected: 1 },
                { id: "mnmwt", name: "ระดับน้ำเล็ก", expected: 1 },
                { id: "tip", name: "ตัวทิป", expected: 2 },
                { id: "bct", name: "ปี๊ป", expected: 1 },
                { id: "dmr", name: "กระจกส่องประตู" }, // ไม่มีจำนวนที่กำหนด
                { id: "astc", name: "ฝอยดูดอากาศ", expected: 1 }
            ]
        },
        {
            category: "5. อุปกรณ์กล่องย่อย", details: [
                { id: "tape", name: "เทป", expected: 1 },
                { id: "asts", name: "ป้ายทุกระบบ", expected: 1 },
                { id: "btr", name: "ถ่าน", expected: 1 },
                { id: "plug", name: "ปลั๊ก", expected: 2 },
                { id: "clc", name: "ผ้า + แอลกอฮอล์", expected: 1 }
            ]
        },
        {
            category: "6.อุปกรณ์อื่นๆ", details: [
                { id: "kns", name: "ไม้เคาะ", expected: 4 },
                { id: "lle", name: "ระดับยาว", expected: 1 },
                { id: "shl", name: "ระดับน้ำสั้น", expected: 1 },
                { id: "brcb", name: "กล้องงูใหญ่" }, // ไม่มีจำนวนที่กำหนด
                { id: "brcs", name: "กล้องงูเล็ก", expected: 1 },
                { id: "brccd", name: "กล้องงูคอนโด" }, // ไม่มีจำนวนที่กำหนด
                { id: "tbct", name: "ที่ตัดท่อ", expected: 1 },
                { id: "chair", name: "เก้าอี้", expected: 1 },
                { id: "pipe", name: "ท่อ", expected: 1 },
                { id: "grille", name: "ตะแกรง", expected: 1 },
                { id: "hmer", name: "ค้อน", expected: 3 },
                { id: "raincoat", name: "เสื้อกันฝน", expected: 1 },
                { id: "hpsw", name: "เครื่องฉีดน้ำแรงดันสูง" }, // ไม่มีจำนวนที่กำหนด
                { id: "rope", name: "เชือก", expected: 1 },
                { id: "wktk", name: "วอ", expected: 2 },
                { id: "stc", name: "สีเทสระบบ", expected: 1 },
                { id: "pliers", name: "คีม", expected: 1 }
            ]
        }
    ],
    "5กก7884": [
        {
            category: "1. อุปกรณ์ไฟฟ้า", details: [
                { id: "lan", name: "ชุด LAN เครื่อง (1) (Adapter 8)", expected: 1 },
                { id: "tv-tel", name: "ชุด TV-TEL (Splitter)", expected: 1 },
                { id: "adt", name: "ชุด Adapter เช็ค TV-TEL (สำรอง)", expected: 1 },
                { id: "rpc", name: "ชุดเต้ารับ (เครื่อง 1 สาย 1)", expected: 1 },
                { id: "3p", name: "ชุดวัด 3 เฟส (1 เครื่อง)", expected: 1 },
                { id: "hvd", name: "ชุดวัดแรงดันไฟ (1 เครื่อง)", expected: 1 },
                { id: "pdmt", name: "ชุดวัดกาว (1 ชุด)", expected: 1 },
                { id: "scdv", name: "ชุดไขควง (ธรรมดา 1 ไฟฟ้า 1)", expected: 1 },
                { id: "anm", name: "เครื่องวัดแรงลม (1 ชุด)", expected: 1 },
                { id: "wwck", name: "เครื่องเช็คน้ำอุ่น (1 ชุด)", expected: 1 },
                { id: "glo", name: "ถุงมือ (1 คู่)", expected: 1 },
                { id: "scb", name: "สายช็อต (1 สาย)", expected: 1 },
                { id: "and", name: "อุปกรณ์อื่นๆ" } // ไม่มีจำนวนที่กำหนด
            ]
        },
        {
            category: "2. อุปกรณ์สุขาภิบาล", details: [
                { id: "tank", name: "ถัง", expected: 5 },
                { id: "cloth", name: "ผ้าเช็ดเท้า", expected: 13 },
                { id: "psc", name: "ดินน้ำมัน", expected: 1 },
                { id: "rbt", name: "สายยาง", expected: 3 },
                { id: "bgs", name: "เกตุ", expected: 1 },
                { id: "bread", name: "ขนมปัง", expected: 1 }
            ]
        },
        {
            category: "3. อุปกรณ์สำหรับหลังคา", details: [
                { id: "gst", name: "บันไดใหญ่", expected: 1 },
                { id: "sst", name: "บันไดเล็ก", expected: 1 },
                { id: "fld", name: "บันไดลิง", expected: 1 },
                { id: "tch", name: "ไฟฉาย", expected: 1 }
            ]
        },
        {
            category: "4. อุปกรณ์กล่องตรวจสอบ", details: [
                { id: "ifc", name: "กล้องอินฟาเรด", expected: 2 },
                { id: "mtmt", name: "เครื่องวัดความชื้น", expected: 1 },
                { id: "tms", name: "ตลับเมตร", expected: 1 },
                { id: "msrdv", name: "เครื่องวัดฝ้า", expected: 1 },
                { id: "mnmwt", name: "ระดับน้ำเล็ก", expected: 1 },
                { id: "tip", name: "ตัวทิป", expected: 1 },
                { id: "bct", name: "ปี๊ป", expected: 1 },
                { id: "dmr", name: "กระจกส่องประตู", expected: 1 },
                { id: "astc", name: "ฝอยดูดอากาศ", expected: 1 }
            ]
        },
        {
            category: "5. อุปกรณ์กล่องย่อย", details: [
                { id: "tape", name: "เทป", expected: 1 },
                { id: "asts", name: "ป้ายทุกระบบ", expected: 1 },
                { id: "btr", name: "ถ่าน", expected: 1 },
                { id: "plug", name: "ปลั๊ก", expected: 2 },
                { id: "clc", name: "ผ้า + แอลกอฮอล์", expected: 1 }
            ]
        },
        {
            category: "6. อุปกรณ์อื่นๆ", details: [
                { id: "kns", name: "ไม้เคาะ", expected: 5 },
                { id: "lle", name: "ระดับยาว", expected: 1 },
                { id: "shl", name: "ระดับน้ำสั้น", expected: 1 },
                { id: "brcb", name: "กล้องงูใหญ่" }, // ไม่มีจำนวนที่กำหนด
                { id: "brcs", name: "กล้องงูเล็ก", expected: 1 },
                { id: "brccd", name: "กล้องงูคอนโด" }, // ไม่มีจำนวนที่กำหนด
                { id: "tbct", name: "ที่ตัดท่อ", expected: 1 },
                { id: "chair", name: "เก้าอี้", expected: 2 },
                { id: "pipe", name: "ท่อ", expected: 1 },
                { id: "grille", name: "ตะแกรง", expected: 1 },
                { id: "hmer", name: "ค้อน", expected: 1 },
                { id: "raincoat", name: "เสื้อกันฝน", expected: 1 },
                { id: "hpsw", name: "เครื่องฉีดน้ำแรงดันสูง" }, // ไม่มีจำนวนที่กำหนด
                { id: "rope", name: "เชือก", expected: 1 },
                { id: "wktk", name: "วอ", expected: 2 },
                { id: "stc", name: "สีเทสระบบ", expected: 1 },
                { id: "pliers", name: "คีม", expected: 1 }
            ]
        }
    ]
};

// ✅ Render Home Page
app.get("/", (req, res) => {
    res.render("index", { cars });
});

// เพิม
app.get("/history", (req, res) => {
    res.render("history", { checklists }); // ไม่ต้องใส่นามสกุล .ejs
});
// หมด

// ✅ Fetch Checklist Based on License Plate
app.get("/get-checklist-form/:plateNumber", (req, res) => {
    const checklist = checklists[req.params.plateNumber];
    if (!checklist) {
        return res.status(404).json({ error: "Checklist not found" });
    }
    res.json({ plateNumber: req.params.plateNumber, checklist });
});

// เพิม
app.get("/checklist-history/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
        const [rows] = await db.query(
            `SELECT * FROM vehicle_checklists WHERE user_id = ? AND submitted_at >= NOW() - INTERVAL 7 DAY ORDER BY submitted_at DESC`,
            [userId]
        );
        res.json(rows);
    } catch (error) {
        console.error("❌ ดึงข้อมูลล้มเหลว:", error);
        res.status(500).json({ error: "ไม่สามารถดึงข้อมูลได้" });
    }
});
//  หมด





// ✅ LINE Webhook Route
app.post("/webhook", (req, res) => {
    console.log("📩 Received Webhook:", JSON.stringify(req.body, null, 2));

    // Acknowledge receipt of webhook
    res.sendStatus(200);

    // Process the event (e.g., responding to messages)
    const events = req.body.events;
    events.forEach(async (event) => {
        if (event.type === "message" && event.message.type === "text") {
            const userMessage = event.message.text;
            const replyToken = event.replyToken;

            // ✅ กรณี "ดูข้อมูลย้อนหลัง"
            if (userMessage === "ดูข้อมูลย้อนหลัง") {
                const userId = event.source.userId;

                try {
                    const [rows] = await db.query(
                        `SELECT plate_number, inspector, submitted_at FROM vehicle_checklists 
                            WHERE user_id = ? AND submitted_at >= NOW() - INTERVAL 7 DAY
                            ORDER BY submitted_at DESC LIMIT 10`, [userId]
                    );

                    let responseText;
                    if (rows.length === 0) {
                        responseText = "❌ ไม่พบข้อมูลย้อนหลังใน 7 วันที่ผ่านมา";
                    } else {
                        responseText = "📋 ข้อมูลย้อนหลัง 7 วัน:\n";
                        rows.forEach(row => {
                            const date = new Date(row.submitted_at).toLocaleString("th-TH", {
                                dateStyle: "short",
                                timeStyle: "short",
                                timeZone: "Asia/Bangkok"
                            });
                            responseText += `\n📅 ${date}\n👷‍♂️ ${row.inspector}\n🚗 ${row.plate_number}\n`;
                        });
                    }

                    await axios.post("https://api.line.me/v2/bot/message/reply", {
                        replyToken,
                        messages: [{ type: "text", text: responseText }]
                    }, {
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${process.env.LINE_ACCESS_TOKEN}`
                        }
                    });

                } catch (err) {
                    console.error("❌ ดึงข้อมูลย้อนหลังล้มเหลว:", err);
                    await axios.post("https://api.line.me/v2/bot/message/reply", {
                        replyToken,
                        messages: [{ type: "text", text: "⚠️ ไม่สามารถดึงข้อมูลย้อนหลังได้" }]
                    }, {
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${process.env.LINE_ACCESS_TOKEN}`
                        }
                    });
                }

                return; // ✅ หยุดเพื่อไม่ให้ไปตอบ default
            }

            
            // ✅ กันข้อความที่ admin ตั้ง auto-response ไว้ใน LINE OA
            const reservedKeywords = ["1", "2", "เมนู", "ดูข้อมูลย้อนหลัง"];
            if (reservedKeywords.includes(userMessage.trim())) {
                console.log("⏩ ข้ามข้อความที่จัดการผ่าน LINE OA:", userMessage);
                return; // ❗ หยุดที่นี่ ไม่ให้ bot ตอบข้อความนี้ซ้ำ
            }
            
            // ✅ เงื่อนไขปกติสำหรับพิมพ์ทะเบียน
            let responseText = "🚗 กรุณาพิมพ์ป้ายทะเบียนเพื่อตรวจสอบ!";
            if (cars[userMessage]) {
                responseText = `🔎 รายการตรวจสอบสำหรับ ${userMessage}:\n\n`;
                const checklist = checklists[userMessage] || [];
                checklist.forEach(cat => {
                    responseText += ` ${cat.category}\n`;
                    cat.details.forEach(item => {
                        responseText += `- ${item.name} ${item.expected ? `(ต้องมี ${item.expected})` : ""}\n`;
                    });
                    responseText += "\n";
                });
            }
            

            await axios.post("https://api.line.me/v2/bot/message/reply", {
                replyToken,
                messages: [{ type: "text", text: responseText }]
            }, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.LINE_ACCESS_TOKEN}`
                }
            });
        }
    });

});

// ✅ Submit Checklist & Notify LINE
app.post("/submit-checklist", async (req, res) => {
    try {
        console.log("📩 Received Data from Frontend:", req.body);

        const { userId, inspector, plateNumber, equipment } = req.body;
        if (!userId || !inspector || !plateNumber || !equipment) {
            return res.status(400).json({ error: "Incomplete data received!" });
        }

        // เพิม
        try {
            await db.query(
                `INSERT INTO vehicle_checklists (user_id, inspector, plate_number, equipment) VALUES (?, ?, ?, ?)`,
                [userId, inspector, plateNumber, JSON.stringify(equipment)] // ← ต้อง JSON.stringify!
            );

            // res.status(200).json({ message: "✅ บันทึกข้อมูลสำเร็จ!" });

        } catch (error) {
            console.error("❌ เกิดข้อผิดพลาดในการบันทึก:", error);
            res.status(500).json({ error: "บันทึกไม่สำเร็จ" });
        }

        // หมด

        console.log("📤 Sending Message to LINE User:", userId);

        // ✅ ตรวจสอบว่า LINE Access Token ถูกต้อง
        if (!process.env.LINE_ACCESS_TOKEN) {
            console.error("❌ Missing LINE Access Token!");
            return res.status(500).json({ error: "Missing LINE Access Token!" });
        }

        console.log("🔑 Using LINE Access Token (First 10 chars):", process.env.LINE_ACCESS_TOKEN.substring(0, 10) + "...");


        // ✅ สร้างวันที่และเวลาปัจจุบัน
        const now = new Date();
        const thaiDateTime = new Intl.DateTimeFormat('th-TH', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            timeZone: 'Asia/Bangkok'
        }).format(now);

        let message = `📋 ตรวจสอบโดย: ${inspector}\n📅 วันที่: ${thaiDateTime}\n🚗 ป้ายทะเบียน: ${plateNumber}\n\n`;
        let categories = {};
        let errorMessages = [];

        equipment.forEach(item => {
            let category = checklists[plateNumber]?.find(c => c.details.some(d => d.id === item.name));
            if (category) {
                if (!categories[category.category]) categories[category.category] = [];
                let equipData = category.details.find(d => d.id === item.name);
                let qty = item.quantity || 0;
                let expectedQty = equipData.expected || 0;
                let remark = item.remark ? ` ${item.remark}` : "";

                if (expectedQty > 0 && qty > expectedQty) {
                    errorMessages.push(`${equipData.name} ห้ามใส่มากกว่า ${expectedQty}`);
                }

                let statusText = qty > 0 ? `มี ${qty}` : "ไม่มี";
                if (expectedQty > 0) {
                    if (qty === expectedQty) statusText += " ครบ";
                    else if (qty < expectedQty) statusText += ` ขาด ${expectedQty - qty}`;
                }

                categories[category.category].push(`- ${equipData.name}: ${statusText}${remark}`);
            }
        });

        if (errorMessages.length > 0) {
            return res.status(400).json({ error: errorMessages.join("\n") });
        }

        Object.entries(categories).forEach(([category, items]) => {
            message += ` ${category}\n${items.join("\n")}\n\n`;
        });

        console.log("🔑 Using LINE Access Token:", process.env.LINE_ACCESS_TOKEN);

        const response = await axios.post("https://api.line.me/v2/bot/message/push", {
            to: userId, // ✅ ใช้ userId ที่ได้รับจาก LIFF
            messages: [{ type: "text", text: message }]
        }, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.LINE_ACCESS_TOKEN}`
            }
        });

        console.log("✅ LINE Message Sent Successfully:", response.data);
        res.status(200).json({ success: true, message: "Checklist sent to LINE!" });

    } catch (error) {
        console.error("❌ Failed to Send:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to send checklist", details: error.response?.data });
    }
});


// ✅ Start Server
// app.listen(PORT, () => {
//     console.log(`🚀 Server running on http://localhost:${PORT}`);
// });
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});