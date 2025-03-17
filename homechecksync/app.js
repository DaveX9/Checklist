const express = require('express'); 
const axios = require('axios');
const { google } = require('googleapis');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public')); // ให้บริการไฟล์ Static เช่น index.html

const LINE_CHANNEL_ACCESS_TOKEN = 'Z7S3H1z1jfuJ2YpYef8OCO7gnbwt2m948ZMNj1ZroyUqOJe4sY5jZUMrIjIy3hE4TvMcTE3NTde4uhz8i2XvcqLBuKhz9cDJx+qWu/TZn6KkFX7JQnfmkyUpDYL3jmnzK52koo4KT2YGmffcUetaPQdB04t89/1O/w1cDnyilFU=';
const GOOGLE_CALENDAR_ID = '2002mantra1998@gmail.com';

// ฟังก์ชันสำหรับแสดงข้อผิดพลาด
function logError(message, error) {
    console.error(message, error.response?.data || error.message || error);
}

function parseInput(userInput) {
    const cleanedInput = userInput.trim().replace(/\s+/g, ' ');
    // ปรับการจับคู่ให้รองรับ "unit 30B2B-06" และรูปแบบอื่น ๆ
    const match = cleanedInput.match(/^((unit\s*\d+\s*ชั้น\s*\d+|Unit\s*\d+\s*ชั้น\s*\d+)|unit\s*\w+\d*[\w\-\/]+|Unit\s*\w+\d*[\w\-\/]+|[A-Za-z]?\d+[A-Za-z0-9\-\/]*)(?:\s*รอบที่\s*(\d+))?$/i);

    if (match) {
        const houseNumber = match[1].trim();
        const checkRound = match[3] ? match[3].trim() : null;
        return { houseNumber, checkRound };
    }

    return { houseNumber: cleanedInput, checkRound: null };
}

// ฟังก์ชันตอบกลับข้อความไปยังผู้ใช้ LINE
async function replyToUser(replyToken, userId) {
    try {
        await axios.post(
            'https://api.line.me/v2/bot/message/reply',
            {
                replyToken: replyToken,
                messages: [
                    {
                        type: 'text',
                        text: `สวัสดี คุณผู้ใช้ ID: ${userId}`,
                    },
                ],
            },
            {
                headers: {
                    'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
                },
            }
        );
        console.log(`ส่งข้อความสำเร็จถึง ${userId}`);
    } catch (error) {
        logError('เกิดข้อผิดพลาดในการตอบกลับผู้ใช้:', error);
    }
}

// ฟังก์ชันตรวจสอบข้อมูลใน Google Calendar
async function checkCalendar(houseNumber, checkRound) {
    const auth = new google.auth.GoogleAuth({
        keyFile: './service-account.json',
        scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });
    const calendar = google.calendar({ version: 'v3', auth });

    const today = new Date();
    const timeMinToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0).toISOString();
    const timeMaxToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

    const timeMinMonth = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0).toISOString();
    const timeMaxMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59).toISOString();

    try {
        let timeMin, timeMax;

        if (checkRound) {
            timeMin = timeMinMonth;
            timeMax = timeMaxMonth;
        } else {
            timeMin = timeMinToday;
            timeMax = timeMaxToday;
        }

        const events = await calendar.events.list({
            calendarId: GOOGLE_CALENDAR_ID,
            timeMin: timeMin,
            timeMax: timeMax,
            singleEvents: true,
            orderBy: 'startTime',
        });
        console.log("จำนวนอีเวนต์ที่ดึงมา:", events.data.items.length);

        const event = events.data.items.find(event => {
            const description = event.description || '';
            const houseMatch = description.match(/(?:บ้านเลขที่|House No|House Number)\s*[:|：]?\s*(unit\s*\d*[A-Za-z0-9\-\/]+|Unit\s*\d*[A-Za-z0-9\-\/]+|[Nn]\/[Aa](?:-\d+)?|[A-Za-z]?\d+[A-Za-z0-9\-\/]*)/i);


            if (!houseMatch) return false;
        
            const houseFromDesc = houseMatch[1].trim().normalize('NFKC');
            return houseFromDesc === houseNumber;
        });

        if (event) {
            const description = event.description.replace(/<br>/g, '\n');
            const projectNameMatch = description.match(/(?:ชื่อโครงการ|Name of House Development)\s*[:|：]?\s*([\s\S]*?)(?=$|<|\n)/);
            const checkRoundMatch = description.match(/(?:ตรวจรอบที่|Inspect No.)\s*[:|：]?\s*([\s\S]*?)(?=$|<|\n)/);
            const appointmentDateMatch = description.match(/(?:วันที่นัด|Confirm Date)\s*[:|：]?\s*([\s\S]*?)(?=$|<|\n)/);

            const projectName = projectNameMatch ? projectNameMatch[1].trim() : 'ไม่พบข้อมูล';
            const checkRound = checkRoundMatch ? checkRoundMatch[1].trim() : 'ไม่พบข้อมูล';
            const appointmentDate = appointmentDateMatch ? appointmentDateMatch[1].trim() : 'ไม่พบข้อมูล';

            return {
                houseNumber,
                projectName,
                checkRound,
                appointmentDate,
                resultMessage: `โปรเจค: ${projectName}\nบ้านเลขที่: ${houseNumber}\nตรวจรอบที่: ${checkRound}\nวันที่นัด: ${appointmentDate}`,
            };
        }

    } catch (error) {
        console.error('เกิดข้อผิดพลาด:', error.message);
        return { resultMessage: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ Google Calendar' };
    }
}

async function checkQuota() {
    try {
        const response = await axios.get('https://api.line.me/v2/bot/quota/consumption', {
            headers: { Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}` },
        });
        console.log('Messages used this month:', response.data.totalUsage);
        return response.data.totalUsage;
    } catch (error) {
        logError('Error checking quota:', error);
        return null;
    }
}

app.post('/webhook', async (req, res) => {
    const events = req.body.events;
    for (const event of events) {
        if (event.type === 'message' && event.message.type === 'text') {
            const userInput = event.message.text.trim();
            let replyMessage = null;

            if (userInput === "เช็คอุปกรณ์") {
                const baseLiffUrl = "https://liff.line.me/2006773751-wNpGqEO4";
                const carList = [
                    { id: 1, name: "นง 3", image: "https://i.ibb.co/qL6cSGxQ/4261-0.jpg" },
                    { id: 2, name: "9 กษ 1153 กทม", image: "https://i.ibb.co/LDLJBBS1/4316.jpg" },
                    { id: 3, name: "5 กก 7884 กทม", image: "https://i.ibb.co/tMYPQZ9B/4260-0.jpg" }
                ];
                
                const bubbles = carList.map(car => {
                    const liffUrl = `${baseLiffUrl}?carId=${car.id}&carName=${encodeURIComponent(car.name)}`
                    console.log("Generated URL:", liffUrl);
                
                    return {
                        "type": "bubble",
                        "hero": {
                            "type": "image",
                            "url": car.image,
                            "size": "full",
                            "aspectRatio": "16:9",
                            "aspectMode": "cover",
                            "action": {
                                "type": "uri",
                                "label": "บันทึกอุปกรณ์",
                                "uri": liffUrl
                            }
                        },
                        "body": {
                            "type": "box",
                            "layout": "vertical",
                            "contents": [
                                { "type": "text", "text": car.name, "weight": "bold", "size": "md", "align": "center" }
                            ]
                        }
                    };
                });                               
                // 🔹 สร้างโครงสร้างของ Flex Message
                replyMessage = [{
                    "type": "flex",
                    "altText": "🚗 รายการรถตรวจบ้านวันนี้",
                    "contents": {
                        "type": "carousel",
                        "contents": bubbles
                    }
                }];
            } else if (userInput === "นัดวันนี้") {
                const today = new Date();
                const timeMin = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0).toISOString();
                const timeMax = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

                const auth = new google.auth.GoogleAuth({
                    keyFile: './service-account.json',
                    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
                });
                const calendar = google.calendar({ version: 'v3', auth });

                try {
                    const events = await calendar.events.list({
                        calendarId: GOOGLE_CALENDAR_ID,
                        timeMin,
                        timeMax,
                        singleEvents: true,
                        orderBy: 'startTime',
                    });

                    if (events.data.items.length > 0) {
                        const chunkedEvents = chunkArray(events.data.items, 5);
                        let bubbles = chunkedEvents
                            .flat()
                            .filter(event => event.description)
                            .map(event => {
                                const description = event.description.replace(/<br>/g, '\n');
                                const houseNumberMatch = description.match(/(?:บ้านเลขที่|House No|House Number)\s*[:|：]?\s*(unit\s*\d*[A-Za-z0-9\-\/]+|Unit\s*\d*[A-Za-z0-9\-\/]+|[Nn]\/[Aa](?:-\d+)?|[A-Za-z]?\d+[A-Za-z0-9\-\/]*)/i);
                                const houseNumber = houseNumberMatch ? houseNumberMatch[1].trim() : "ไม่ระบุ";

                                const projectName = description.match(/(?:ชื่อโครงการ|Name of House Development)\s*[:|：]?\s*(.*)/)?.[1]?.trim() || "ไม่พบข้อมูล";
                                const checkRound = description.match(/(?:รอบที่|Inspect No.)\s*[:|：]?\s*(\d+)/)?.[1] || "ไม่ระบุ";

                                const appointmentDate = new Date(event.start.dateTime || event.start.date);
                                const formattedDate = formatThaiDate(appointmentDate);

                                return {
                                    "type": "bubble",
                                    "size": "kilo",
                                    "body": {
                                        "type": "box",
                                        "layout": "vertical",
                                        "contents": [
                                            { "type": "text", "text": `🪧 บ้านเลขที่: ${houseNumber}`, "weight": "bold", "size": "sm" },
                                            { "type": "text", "text": `🏠 ${projectName}`, "size": "xs", "color": "#888888" },
                                            { "type": "text", "text": `📅 ${formattedDate}`, "size": "xs", "color": "#888888" },
                                            { "type": "text", "text": `🔄 รอบที่ ${checkRound}`, "size": "xs", "color": "#888888" }
                                        ],
                                        "spacing": "sm",
                                        "paddingAll": "13px"
                                    }
                                };
                            });

                            console.log("Bubbles:", JSON.stringify(bubbles, null, 2)); // ✅ ตรวจสอบว่ามี bubble ถูกสร้างขึ้นมา

                            let messages = []; // ✅ เพิ่มตัวแปร messages

                            if (bubbles.length > 0) { 
                                messages.push({
                                    "type": "flex",
                                    "altText": "📆 รายการนัดหมายวันนี้",
                                    "contents": {
                                        "type": "carousel",
                                        "contents": bubbles.map(bubble => ({
                                            "type": "bubble",
                                            ...bubble
                                        }))
                                    }
                                })
                            }

                        replyMessage = messages;
                    } else {
                        replyMessage = [{ type: 'text', text: '❌ ไม่มีนัดหมายสำหรับวันนี้' }];
                    }                    
                } catch (error) {
                    console.error('เกิดข้อผิดพลาดในการดึงข้อมูลนัดหมายวันนี้:', error);
                    replyMessage = [{ type: 'text', text: '⚠️ ไม่สามารถดึงข้อมูลนัดหมายได้' }];
                }
            } else if (userInput === "วิธีทำฟอร์ม") {
                replyMessage = [{
                    "type": "text",
                    "text": "1. พิมพ์บ้านเลขที่ที่ต้องการ (ถ้าไม่รู้บ้านเลขที่ ก็กดตรงปุ่ม 'นัดวันนี้'เพื่อดูนัดของวันนี้ )\n\n2. หรือจะพิมพ์ บ้านเลขที่ + รอบที่ เพื่อจะทำแบบฟอร์มข้อมูลบ้านย้อนหลัง (ภายในเดือนปัจจุบันเท่านั้น)\n\n3. จะได้ปุ่มตอบกลับมา แล้วคลิกทำแบบฟอร์มได้\n\n** หมายเหตุ\n- ถ้าพิมพ์แล้วกดส่งไปแต่บอทไม่ส่งปุ่มกลับมา อาจมีสาเหตุมาจาก ผู้ใช้อาจจะพิมพ์ผิด หรือไม่ตรงตามเงื่อนไข"
                }];
            } else {
                const { houseNumber, checkRound } = parseInput(userInput);
                console.log("แปลงข้อมูลแล้ว:", houseNumber, checkRound);
                const calendarEvent = await checkCalendar(houseNumber, checkRound);
                console.log("Calendar Event Data:", calendarEvent);

                if (calendarEvent) {
                    const houseNumberEncoded = encodeURIComponent(calendarEvent.houseNumber);
                    const projectNameEncoded = encodeURIComponent(calendarEvent.projectName);
                    const checkRoundEncoded = encodeURIComponent(calendarEvent.checkRound);
                    const appointmentDateEncoded = encodeURIComponent(calendarEvent.appointmentDate);
                    const url = `https://liff.line.me/2006773751-Jo3NAEby?houseNumber=${houseNumberEncoded}&projectName=${projectNameEncoded}&checkRound=${checkRoundEncoded}&appointmentDate=${appointmentDateEncoded}`;

                    replyMessage = [{
                        type: 'flex',
                        altText: 'คลิกลิงก์เพื่อดำเนินการต่อ',
                        contents: {
                            type: 'bubble',
                            size: 'kilo',
                            header: { type: "box", layout: "vertical", contents: [{ type: "text", text: "แบบฟอร์มสรุปการตรวจบ้าน", weight: "bold", color: "#00A300", size: "sm" }] },
                            body: {
                                type: "box",
                                layout: "vertical",
                                spacing: "md",
                                contents: [
                                    { type: "text", text: `บ้านเลขที่ ${calendarEvent.houseNumber}`, weight: "bold", size: "lg" },
                                    { type: "text", text: ` ${calendarEvent.projectName}`, size: "sm", color: "#888888" },
                                    { type: "text", text: `วันที่ตรวจ ${calendarEvent.appointmentDate}`, size: "sm", color: "#888888" },
                                    { type: "text", text: `ตรวจรอบที่ ${calendarEvent.checkRound}`, size: "sm", color: "#888888" }
                                ]
                            },
                            footer: { type: "box", layout: "vertical", contents: [{ type: "button", style: "primary", color: "#00B900", action: { type: "uri", label: "ทำฟอร์ม", uri: url } }] }
                        }
                    }];
                }
            }

            if (replyMessage && replyMessage.length > 0) {
                try {
                    // ดึง userId จาก event
                    const userId = event?.source?.userId;
                    if (!userId) {
                        console.error("❌ ไม่พบ userId");
                        return;
                    }
            
                    // ส่งข้อความกลับไปยัง LINE
                    await axios.post('https://api.line.me/v2/bot/message/push', {
                        to: userId,
                        messages: replyMessage,
                    }, { headers: { Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}` } });
            
                } catch (error) {
                    console.error("❌ เกิดข้อผิดพลาดในการส่งข้อความไปที่ LINE:", error.response?.data || error);
                }
            }            
    }
    res.status(200).send();
}});

function chunkArray(array, chunkSize) {
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize));
    }
    return result;
}

// ฟังก์ชันแปลงวันที่เป็นภาษาไทย
function formatThaiDate(dateObj) {
    const monthNames = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    const daysOfWeek = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

    const day = dateObj.getDate();
    const month = monthNames[dateObj.getMonth()];
    const year = dateObj.getFullYear() + 543; // แปลงเป็น พ.ศ.
    const dayOfWeek = daysOfWeek[dateObj.getDay()];

    return `วัน${dayOfWeek}ที่ ${day} ${month} พ.ศ. ${year}`;
}

app.post('/save-data', async (req, res) => {
    const data = req.body;
    console.log('รับข้อมูลจาก Frontend:', data);

    try {
        if (!data.userId) {
            return res.status(400).json({ success: false, error: 'User ID ต้องไม่ว่าง' });
        }

        const formatList = (items) => {
            if (!items || (Array.isArray(items) && items.length === 0)) {
                return " ไม่มีข้อมูล";
            }

            if (typeof items === 'string') {
                items = items.split(',').map(item => item.trim());
            }

            return Array.isArray(items) && items.length > 0
                ? ` ${items.join("\n- ")}`
                : " ไม่มีข้อมูล";
        };

        const message = `${data.projectName}\nบ้านเลขที่: ${data.houseNumber}\nตรวจรอบที่: ${data.checkRound}\nวันที่นัด: ${data.appointmentDate}
        \n✉️ email\n-${data.email}
        \n🧑‍🔧 ผู้ตรวจ\n-${data.inspector}
        \n🚽 ระบบสุขาภิบาล\n-${formatList(data.sanitation)}
        \n💧 งานรั่วซึม\n-${formatList(data.leakage)}
        \n🔦 งานหลังคา\n-${formatList(data.roof)}
        \n⚡️ ระบบไฟฟ้า\n-${formatList(data.electricity)}
        \n🏠 งานสถาปัตย์\n-${formatList(data.architecture)}
        \n${data.actionButton ? `👥 ลูกค้า\n- ${data.actionButton}` : ""}
        \nระดับ ${data.selectedColor ? data.selectedColor === "RED" 
            ? `RED ${data.redButtonLevel || ""}`
             : data.selectedColor : ""}
        \nหมายเหตุ\n- ${data.notes}`;

        await axios.post('https://api.line.me/v2/bot/message/push', {
            to: data.userId,
            messages: [{ type: 'text', text: message }],
        }, {
            headers: { Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}` },
        });

        res.status(200).json({ success: true, message: 'ข้อมูลบันทึกสำเร็จและส่งไปยัง LINE แล้ว' });
    } catch (error) {
        logError('เกิดข้อผิดพลาดในการส่งข้อมูล:', error);
        res.status(500).json({ success: false, error: 'ส่งข้อมูลไปยัง LINE ไม่สำเร็จ' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});