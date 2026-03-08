import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `คุณคือ AI Chatbot ของมหาวิทยาลัยเกษตรศาสตร์ (Kasetsart University - KU) 
หน้าที่ของคุณคือตอบคำถามและช่วยเหลือเกี่ยวกับเรื่องต่างๆ ภายในมหาวิทยาลัย เช่น:
- ข้อมูลการรับสมัคร (TCAS)
- การลงทะเบียนเรียนและปฏิทินการศึกษา
- สถานที่ต่างๆ ในวิทยาเขต (บางเขน, กำแพงแสน, ศรีราชา, เฉลิมพระเกียรติ สกลนคร)
- กิจกรรมนิสิตและชมรม
- บริการต่างๆ ของมหาวิทยาลัย (สำนักคอมพิวเตอร์, ห้องสมุด, รถตะลัย)
- ประวัติและความเป็นมาของมหาวิทยาลัย

แนวทางการตอบคำถาม:
1. ตอบเป็นภาษาไทยที่สุภาพและเป็นกันเอง (เหมือนพี่ตอบน้องหรือเจ้าหน้าที่ตอบนิสิต)
2. หากไม่แน่ใจข้อมูล ให้แนะนำให้ติดต่อหน่วยงานที่เกี่ยวข้องโดยตรง
3. ใช้ข้อมูลที่ทันสมัยที่สุดโดยใช้ Google Search Grounding
4. หากมีการอ้างอิง URL จาก Google Search ให้แสดงลิงก์ให้ชัดเจน
5. เน้นความเป็น "ศาสตร์แห่งแผ่นดิน" และอัตลักษณ์ของ KU (สีเขียวมะกอก, นนทรี)`;

export async function getChatResponse(message: string, history: any[] = []) {
  // Try to get API key from Vite's environment variables
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    console.error("Missing API Key. Ensure VITE_GEMINI_API_KEY is set in your environment variables.");
    throw new Error("ไม่พบ API Key (VITE_GEMINI_API_KEY) กรุณาตั้งค่า Environment Variable ใน Vercel/Netlify โดยใช้ชื่อ 'VITE_GEMINI_API_KEY' และทำการ Re-deploy (หรือกด Redeploy ในหน้า Deployments) อีกครั้งครับ");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const chat = ai.chats.create({
    model: "gemini-flash-latest",
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ googleSearch: {} }],
    },
    history: history,
  });

  const result = await chat.sendMessage({ message });
  return result;
}
