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
    "นง3": { plateNumber: "นง3", year: 2022 },
    "9กษ1153": { plateNumber: "9กษ1153", year: 2021 },
    "5กก7884": { plateNumber: "5กก7884", year: 2023 }
};



// 📌 Vehicle Inspection Checklists
const checklists = {
    "นง3": [
        {
            category: "1.อุปกรณ์ไฟฟ้า", details: [
                { id: "lan", name: "ชุด LAN (เครื่อง1Aapter8)", expected: 1 },
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
                { id: "bgs", name: "เกจวัดแรงดัน", expected: 1 },
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
                { id: "astc", name: "ฟอยล์ดูดอากาศ", expected: 1 }
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
                { id: "lan", name: "ชุด LAN (เครื่อง1Aapter8)", expected: 1 },
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
                { id: "bgs", name: "เกจวัดแรงดัน", expected: 1 },
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
                { id: "astc", name: "ฟอยล์ดูดอากาศ", expected: 1 }
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
                { id: "lan", name: "ชุด LAN (เครื่อง1Aapter8)", expected: 1 },
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
                { id: "bgs", name: "เกจวัดแรงดัน", expected: 1 },
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
                { id: "astc", name: "ฟอยล์ดูดอากาศ", expected: 1 }
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
                { id: "tbct", name: "ที่ตัดท่อ", expected: 3 },
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

// app.get("/checklist-history/:userId", async (req, res) => {
//     const { userId } = req.params;

//     try {
//         const [rows] = await db.query(`
//             SELECT vc.*
//             FROM vehicle_checklists vc
//             INNER JOIN (
//                 SELECT DATE(submitted_at) AS date, plate_number, MAX(submitted_at) AS latest_time
//                 FROM vehicle_checklists
//                 WHERE user_id = ?
//                 AND submitted_at >= NOW() - INTERVAL 7 DAY
//                 GROUP BY DATE(submitted_at), plate_number
//             ) latest
//             ON DATE(vc.submitted_at) = latest.date
//             AND vc.submitted_at = latest.latest_time
//             AND vc.plate_number = latest.plate_number
//             WHERE vc.user_id = ?
//             ORDER BY vc.submitted_at DESC
//         `, [userId, userId]);

//         res.json(rows);
//     } catch (error) {
//         console.error("❌ ดึงข้อมูลล้มเหลว:", error);
//         res.status(500).json({ error: "ไม่สามารถดึงข้อมูลได้" });
//     }
// });
app.get("/checklist-history-latest", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT vc.*
            FROM vehicle_checklists vc
            INNER JOIN (
                SELECT DATE(submitted_at) AS date, plate_number, user_id, MAX(submitted_at) AS latest_time
                FROM vehicle_checklists
                WHERE submitted_at >= NOW() - INTERVAL 7 DAY
                GROUP BY DATE(submitted_at), plate_number, user_id
            ) latest
            ON DATE(vc.submitted_at) = latest.date
            AND vc.submitted_at = latest.latest_time
            AND vc.plate_number = latest.plate_number
            AND vc.user_id = latest.user_id
            ORDER BY vc.submitted_at DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error("❌ ดึงข้อมูลล่าสุดล้มเหลว:", err);
        res.status(500).json({ error: "ไม่สามารถดึงข้อมูลล่าสุดได้" });
    }
});

//  หมด
app.post("/broadcast", async (req, res) => {
    const { message } = req.body;

    try {
        const [users] = await db.query(`SELECT user_id FROM line_users`);
        const userIds = users.map(u => u.user_id);

        for (let userId of userIds) {
            try {
                await axios.post("https://api.line.me/v2/bot/message/push", {
                    to: userId,
                    messages: [{ type: "text", text: message }]
                }, {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${process.env.LINE_ACCESS_TOKEN}`
                    }
                });
                console.log(`✅ Broadcast sent to ${userId}`);
            } catch (err) {
                console.error(`❌ Failed to send to ${userId}:`, err.response?.data || err.message);
            }
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        res.status(200).json({ success: true, message: "Broadcast sent to all users!" });
    } catch (error) {
        console.error("❌ Broadcast failed:", error);
        res.status(500).json({ error: "Broadcast failed" });
    }
});
// finish

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

            // เพิม
            if (event.source?.userId) {
                const userId = event.source.userId;
                try {
                    const [existingUsers] = await db.query(
                        `SELECT id FROM line_users WHERE user_id = ?`,
                        [userId]
                    );

                    if (existingUsers.length === 0) {
                        await db.query(
                            `INSERT INTO line_users (user_id) VALUES (?)`,
                            [userId]
                        );
                        console.log(`✅ New user added: ${userId}`);
                    }
                } catch (err) {
                    console.error("❌ Failed to save userId to DB:", err);
                }
            }
            // 🟨 ส่งข้อความที่ผู้ใช้พิมพ์ไปยังทุกคน
            if (event.type === "message" && event.message.type === "text") {
                const inputMessage = event.message.text;

                const [allUsers] = await db.query(`SELECT user_id FROM line_users`);
                const allUserIds = allUsers.map(u => u.user_id);

                for (let uid of allUserIds) {
                    await axios.post("https://api.line.me/v2/bot/message/push", {
                        to: uid,
                        messages: [{ type: "text", text: `📢 มีข้อความใหม่: ${inputMessage}` }]
                    }, {
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${process.env.LINE_ACCESS_TOKEN}`
                        }
                    });

                    await new Promise(resolve => setTimeout(resolve, 300)); // delay
                }
            }

            // หมด            

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

            // เพิ่ม message สำหรับวิธีการใช้งานระบบ Checklists
            if (userMessage === "1") {
                const howToText = "📝 วิธีการใช้งานแบบฟอร์มเช็กของบนรถ\n" +
                    "1. กดเมนู แบบฟอร์ม\n" +
                    "2. ระบบจะแสดงแบบฟอร์มเช็กลิสต์\n" +
                    "3. ใส่ชื่อผู้ตรวจ และเลือกทะเบียนรถที่ต้องการเช็ก (วันและเวลา อัตโนมัติ)\n" +
                    "4. กดบันทึกข้อมูล และเริ่มทำแบบฟอร์มกันเลย!";

                await axios.post("https://api.line.me/v2/bot/message/reply", {
                    replyToken,
                    messages: [{ type: "text", text: howToText }]
                }, {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${process.env.LINE_ACCESS_TOKEN}`
                    }
                });

                return; // ✅ จบที่นี่
            }
            // เพิ่ม message สำหรับวิธีการใช้งานระบบ Checklists
            if (userMessage === "2") {
                const howToText =
                    "📜 วิธีใช้งาน \"ดูข้อมูลย้อนหลัง 7 วัน\"\n" +
                    "1. เลือกรถยนต์ที่ต้องการดูข้อมูลย้อนหลัง\n" +
                    "2. ระบบจะแสดงผลการตรวจสอบย้อนหลัง 7 วัน ของรถคันนั้นโดยอัตโนมัติ (อาจต้องรอโหลดและประมวลผล)";

                await axios.post("https://api.line.me/v2/bot/message/reply", {
                    replyToken,
                    messages: [{ type: "text", text: howToText }]
                }, {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${process.env.LINE_ACCESS_TOKEN}`
                    }
                });

                return; // ✅ จบที่นี่
            }

            //หมด

            // ✅ เงื่อนไขปกติสำหรับพิมพ์ทะเบียน
            let responseText = "🚗 กรุณาพิมพ์ป้ายทะเบียนเพื่อดูจำนวนของสินค้า!";
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
                // let remark = item.remark ? ` ${item.remark}` : "";

                if (expectedQty > 0 && qty > expectedQty) {
                    errorMessages.push(`${equipData.name} ห้ามใส่มากกว่า ${expectedQty}`);
                }

                let statusText = qty > 0 ? `มี ${qty}` : "ไม่มี";
                if (expectedQty > 0) {
                    if (qty === expectedQty) statusText += " ครบ";
                    else if (qty < expectedQty) statusText += ` ขาด ${expectedQty - qty}`;
                }

                // categories[category.category].push(`- ${equipData.name}: ${statusText}${remark}`);

                // ✅ ถ้ามี remark จริงค่อยแสดง
                let remarkText = item.remark?.trim();
                if (remarkText === "-") remarkText = ""; // ลบกรณีที่ใส่แค่ - มา
                let line = `- ${equipData.name}: ${statusText}${remarkText ? ` ${remarkText}` : ""}`;

                categories[category.category].push(line);
            }
        });

        if (errorMessages.length > 0) {
            return res.status(400).json({ error: errorMessages.join("\n") });
        }

        Object.entries(categories).forEach(([category, items]) => {
            message += ` ${category}\n${items.join("\n")}\n\n`;
        });

        console.log("🔑 Using LINE Access Token:", process.env.LINE_ACCESS_TOKEN);

        //เพิ่ม
        // ✅ ดึง user_id ทั้งหมดจาก line_users
        const [users] = await db.query(`SELECT user_id FROM line_users`);
        const userIds = users.map(u => u.user_id);

        // ✅ ส่ง message ไปยังผู้ใช้ทุกคนที่เป็นเพื่อนกับบอท
        for (let uid of userIds) {
            try {
                await axios.post("https://api.line.me/v2/bot/message/push", {
                    to: uid,
                    messages: [{ type: "text", text: message }]
                }, {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${process.env.LINE_ACCESS_TOKEN}`
                    }
                });
                console.log(`✅ Message sent to ${uid}`);
            } catch (err) {
                console.error(`❌ Failed to send to ${uid}:`, err.response?.data || err.message);
            }

            // 🔄 เพิ่ม delay เล็กน้อยเพื่อป้องกัน rate limit
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        // หมด
// 
        // console.log("✅ LINE Message Sent Successfully:", response.data);
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