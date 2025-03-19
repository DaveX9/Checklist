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
                { id: "and", name: "อุปกรณ์อื่นๆ"}// ไม่มีจำนวนที่กำหนด
            ]
        },
        {
            category: "2.อุปกรณ์สุขาภิบาล", details: [
                { id: "tank", name: "ถัง", expected: 4 },
                { id: "cloth", name: "ผ้า", expected: 9 },
                { id: "psc", name: "ดินน้ำมัน", expected: 1 },
                { id: "rbt", name: "สายยาง", expected: 3 },
                { id: "bgs", name: "เกตุ", expected: 1 },
                { id: "bgs", name: "ขนมปัง", expected: 1 }
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
                { id: "plug", name: "ปลั๊ก", expected: 1 },
                { id: "clc", name: "ผ้า + แอลกอฮอล์", expected: 1 }
            ]
        },
        {
            category: "6.อุปกรณ์อื่นๆ", details: [
                { id: "kns", name: "ไม้เคาะ", expected: 5 },
                { id: "lle", name: "ระดับยาว", expected: 1 },
                { id: "shl", name: "ระดับน้ำสั้น", expected: 10 },
                { id: "brcb", name: "กล้องงูใหญ่"},// ไม่มีจำนวนที่กำหนด
                { id: "brcs", name: "กล้องงูเล็ก", expected: 1 },
                { id: "brccd", name: "กล้องงูคอนโด"},// ไม่มีจำนวนที่กำหนด
                { id: "tbct", name: "ที่ตัดท่อ", expected: 1 },
                { id: "chair", name: "เก้าอี้", expected: 2 },
                { id: "pipe", name: "ท่อ", expected: 1 },
                { id: "grille", name: "ตะแกรง", expected: 1 },
                { id: "hmer", name: "ค้อน", expected: 2 },
                { id: "raincoat", name: "เสื้อกันฝน", expected: 1 },
                { id: "hpsw", name: "เครื่องฉีดน้ำแรงดันสูง"},// ไม่มีจำนวนที่กำหนด
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
                { id: "bgs", name: "ขนมปัง", expected: 1 }
            ]
        },
        {
            category: "3.อุปกรณ์สำหรับหลังคา", details: [
                { id: "gst", name: "บันไดใหญ่", expected: 1 },
                { id: "sst", name: "บันไดเล็ก", expected: 1 },
                { id: "fld", name: "บันไดลิง", expected: 1 },
                { id: "tch", name: "ไฟฉาย", expected: 2 }
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
                { id: "tbct", name: "ที่ตัดท่อ", expected: 2 },
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
                { id: "lan", name: "ชุด LAN เครื่อง (1) (Adapter 8)", expected: 10 },
                { id: "tv-tel", name: "ชุด TV-TEL (Splitter)", expected: 5 },
                { id: "adt", name: "ชุด Adapter เช็ค TV-TEL (สำรอง)", expected: 3 },
                { id: "rpc", name: "ชุดเต้ารับ (เครื่อง 1 สาย 1)", expected: 2 },
                { id: "3p", name: "ชุดวัด 3 เฟส (1 เครื่อง)", expected: 1 },
                { id: "hvd", name: "ชุดวัดแรงดันไฟ (1 เครื่อง)", expected: 1 },
                { id: "pdmt", name: "ชุดวัดกาว (1 ชุด)", expected: 1 },
                { id: "scdv", name: "ชุดไขควง (ธรรมดา 1 ไฟฟ้า 1)", expected: 2 },
                { id: "anm", name: "เครื่องวัดแรงลม (1 ชุด)", expected: 1 },
                { id: "wwck", name: "เครื่องเช็คน้ำอุ่น (1 ชุด)", expected: 1 },
                { id: "glo", name: "ถุงมือ (1 คู่)", expected: 1 },
                { id: "scb", name: "สายช็อต (1 สาย)", expected: 1 },
                { id: "and", name: "อุปกรณ์อื่นๆ" } // ไม่มีจำนวนที่กำหนด
            ]
        },
        {
            category: "2. อุปกรณ์สุขาภิบาล", details: [
                { id: "tank", name: "ถัง", expected: 3 },
                { id: "cloth", name: "ผ้าเช็ดเท้า", expected: 9 },
                { id: "psc", name: "ดินน้ำมัน", expected: 1 },
                { id: "rbt", name: "สายยาง", expected: 5 },
                { id: "bgs", name: "เกตุ", expected: 1 },
                { id: "bgs", name: "ขนมปัง", expected: 1 }
            ]
        },
        {
            category: "3. อุปกรณ์สำหรับหลังคา", details: [
                { id: "gst", name: "บันไดใหญ่", expected: 1 },
                { id: "sst", name: "บันไดเล็ก", expected: 2 },
                { id: "fld", name: "บันไดลิง" }, // ไม่มีจำนวนที่กำหนด
                { id: "tch", name: "ไฟฉาย", expected: 1 }
            ]
        },
        {
            category: "4. อุปกรณ์กล่องตรวจสอบ", details: [
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
            category: "5. อุปกรณ์กล่องย่อย", details: [
                { id: "tape", name: "ทป", expected: 1 },
                { id: "asts", name: "ป้ายทุกระบบ", expected: 1 },
                { id: "btr", name: "ถ่าน", expected: 1 },
                { id: "plug", name: "ปลั๊ก", expected: 2 },
                { id: "clc", name: "ผ้า + แอลกอฮอล์" } // ไม่มีจำนวนที่กำหนด
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
                { id: "hpsw", name: "เครื่องฉีดน้ำแรงดันสูง", expected: 1 },
                { id: "rope", name: "เชือก", expected: 1 },
                { id: "wktk", name: "วอ", expected: 2 },
                { id: "stc", name: "สีเทสระบบ", expected: 1 },
                { id: "pliers", name: "คีม", expected: 1 }
            ]
        }
    ]
};
// 📌 Render Home Page
app.get("/", (req, res) => {
    res.render("index", { cars });
});

// 📌 Fetch Checklist Based on License Plate
app.get("/get-checklist-form/:plateNumber", (req, res) => {
    const checklist = checklists[req.params.plateNumber];
    if (!checklist) {
        return res.status(404).json({ error: "Checklist not found" });
    }
    res.json({ plateNumber: req.params.plateNumber, checklist });
});

// 📌 Send Checklist to LINE
app.post("/submit-checklist", async (req, res) => {
    try {
        console.log("📌 Received Data from Frontend:", req.body);

        const { inspector, plateNumber, equipment } = req.body;
        if (!inspector || !plateNumber || !equipment) {
            throw new Error("Incomplete data received!");
        }

        if (!checklists[plateNumber]) {
            throw new Error("No checklist found for this plate number!");
        }

        // ✅ Check if any quantity exceeds the expected limit
        let errorMessages = [];
        equipment.forEach(item => {
            let category = checklists[plateNumber].find(c => c.details.some(d => d.id === item.name));
            if (category) {
                let equipmentData = category.details.find(d => d.id === item.name);
                if (!equipmentData) return;

                let expectedQty = equipmentData.expected || 0;
                let quantity = item.quantity;

                if (expectedQty > 0 && quantity > expectedQty) {
                    errorMessages.push(`⚠️ ${equipmentData.name} ห้ามใส่เกิน ${expectedQty} ชิ้น`);
                }
            }
        });

        if (errorMessages.length > 0) {
            return res.status(400).json({ error: errorMessages.join("\n") });
        }

        // ✅ Construct the checklist message
        let message = `📋 Checklist ตรวจสอบโดย: ${inspector}\n`;
        message += `📅 วันที่: ${new Date().toLocaleDateString("th-TH", {
            year: "numeric", month: "long", day: "numeric"
        })} ${new Date().toLocaleTimeString("th-TH", {
            hour: "2-digit", minute: "2-digit", second: "2-digit"
        })}\n`;
        message += `🚗 ป้ายทะเบียน: ${plateNumber}\n\n`;

        // ✅ Organizing equipment by category
        let categories = {};
        equipment.forEach(item => {
            let category = checklists[plateNumber].find(c => c.details.some(d => d.id === item.name));
            if (category) {
                if (!categories[category.category]) {
                    categories[category.category] = [];
                }

                let equipmentData = category.details.find(d => d.id === item.name);
                if (!equipmentData) return;

                let expectedQty = equipmentData.expected || 0;
                let quantity = item.quantity;
                let remark = item.remark ? ` ${item.remark}` : "";
                let statusText = "ไม่มี";

                if (quantity > 0) {
                    statusText = `มี ${quantity}`;
                    if (expectedQty > 0) {
                        if (quantity === expectedQty) {
                            statusText += " ครบ";
                        } else if (quantity < expectedQty) {
                            statusText += ` ขาด ${expectedQty - quantity}`;
                        }
                    }
                }

                categories[category.category].push(`- ${equipmentData.name} ${statusText}${remark}`);
            }
        });

        // ✅ Formatting output with a blank line after each category
        Object.entries(categories).forEach(([category, items]) => {
            message += `${category}\n${items.join("\n")}\n\n`;  // <<<<< Added a blank line at the end
        });

        // ✅ Sending message to LINE
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

        console.log("✅ LINE Message Sent Successfully:", message);
        res.status(200).json({ success: true, message: "Checklist sent to LINE!" });
    } catch (error) {
        console.error("❌ Failed to Send:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to send checklist" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});