# Quiz SPA (T/F) — Static (No Build)
- นำ `questions.json` (ที่ผมสร้างจากไฟล์ของคุณแล้ว) วางไว้ในโฟลเดอร์นี้
- อัปโหลดทั้งโฟลเดอร์ขึ้น Netlify/Vercel เป็น static site ได้ทันที
- ถ้าใน `questions.json` มีฟิลด์ `answer` เป็น 'T' หรือ 'F' ระบบจะตรวจให้อัตโนมัติ
- ถ้า `answer` เว้นว่าง จะเป็นโหมด self-mark (เหมาะกับฝึกฝนพร้อมคำอธิบาย)

## โครงสร้าง
- index.html
- style.css
- app.js
- questions.json

## Deploy (Netlify)
- ลากโฟลเดอร์นี้ไปวางใน Netlify หรือเชื่อม Git repo แล้วเลือกโฟลเดอร์เป็น Publish directory
- ไม่ต้อง build

## Deploy (Vercel)
- เลือกโปรเจคแบบ static
- root เป็นโฟลเดอร์นี้
