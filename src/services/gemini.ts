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

export const AVAILABLE_MODELS = [
  { id: "gemini-2.0-flash-lite-001", name: "Gemini 2.0 Flash Lite", description: "เบาและประหยัดโควต้า" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", description: "เร็วและฉลาด" },
  { id: "gemini-flash-lite-latest", name: "Gemini Flash Lite Latest", description: "ตัวสำรอง" },
  { id: "gemini-3-flash-preview", name: "Gemini 3 Flash", description: "ตัวมาตรฐาน" },
  { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro", description: "ตัวสุดท้าย (ฉลาดที่สุด)" }
];

export async function getChatResponseStream(message: string, history: any[] = [], imageBase64?: string, mimeType?: string) {
  const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("ไม่พบ API Key กรุณาตรวจสอบการตั้งค่า Environment Variable (VITE_GEMINI_API_KEY)");
  }

  const ai = new GoogleGenAI({ apiKey });
  let lastError: any = null;

  for (const modelInfo of AVAILABLE_MODELS) {
    const model = modelInfo.id;
    try {
      console.log(`กำลังลองใช้โมเดล: ${model}...`);
      
      if (imageBase64 && mimeType) {
        return await ai.models.generateContentStream({
          model,
          contents: [
            {
              role: "user",
              parts: [
                { inlineData: { data: imageBase64, mimeType } },
                { text: message || "ช่วยอธิบายรูปภาพนี้หน่อยครับ" }
              ]
            }
          ],
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
          }
        });
      }

      const chat = ai.chats.create({
        model,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
        history: history,
      });

      return await chat.sendMessageStream({ message });
    } catch (error: any) {
      lastError = error;
      const errorMsg = JSON.stringify(error);
      console.error(`โมเดล ${model} เกิดข้อผิดพลาด:`, error);

      // ถ้าเป็น Error 429 (Quota) หรือ 500/503 (Server Error) ให้ลองตัวถัดไป
      if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('500') || errorMsg.includes('503')) {
        console.warn(`โมเดล ${model} ไม่พร้อมใช้งาน กำลังลองโมเดลถัดไป...`);
        continue;
      }
      
      // ถ้าเป็น Error อื่นๆ (เช่น 400 Bad Request) ให้หยุดลอง (ยกเว้นถ้าเราอยากลองตัวอื่นต่อ)
      console.warn(`โมเดล ${model} แจ้งข้อผิดพลาดเฉพาะตัว กำลังลองตัวถัดไปเพื่อความชัวร์...`);
      continue;
    }
  }

  handleGeminiError(lastError);
}

export async function getChatResponse(message: string, history: any[] = [], imageBase64?: string, mimeType?: string) {
  const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("ไม่พบ API Key กรุณาตรวจสอบการตั้งค่า Environment Variable (VITE_GEMINI_API_KEY)");
  }

  const ai = new GoogleGenAI({ apiKey });
  let lastError: any = null;

  for (const modelInfo of AVAILABLE_MODELS) {
    const model = modelInfo.id;
    try {
      console.log(`กำลังลองใช้โมเดล (Non-stream): ${model}...`);

      if (imageBase64 && mimeType) {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts: [
                { inlineData: { data: imageBase64, mimeType } },
                { text: message || "ช่วยอธิบายรูปภาพนี้หน่อยครับ" }
              ]
            }
          ],
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
          }
        });
        return response;
      }

      const chat = ai.chats.create({
        model,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
        history: history,
      });

      const result = await chat.sendMessage({ message });
      return result;
    } catch (error: any) {
      lastError = error;
      const errorMsg = JSON.stringify(error);
      console.error(`โมเดล ${model} เกิดข้อผิดพลาด:`, error);

      if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('500') || errorMsg.includes('503')) {
        continue;
      }
      continue;
    }
  }

  handleGeminiError(lastError);
}

function handleGeminiError(error: any) {
  const errorMsg = error?.message || "";
  const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || "";
  const maskedKey = apiKey ? `${apiKey.substring(0, 8)}...` : "ไม่พบคีย์";
  const lastUpdate = "30 มี.ค. 2569 - 22:15 (UTC)"; // เวลาอัปเดตล่าสุด

  if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
    throw new Error(`โควต้าเต็ม (Quota Exceeded)\n\n🕒 เวอร์ชันแอป: ${lastUpdate}\n🔑 คีย์ที่ใช้อยู่: ${maskedKey}\n\n**วิธีแก้:**\n1. หากคีย์ยังเป็นอันเก่า ให้ตรวจสอบว่าใส่ใน Vercel ถูกต้องและ Commit แล้ว\n2. หากคีย์ใหม่แล้วยังติด แสดงว่า **"โปรเจกต์"** ใน AI Studio เต็มแล้ว ให้ลอง **"สร้างโปรเจกต์ใหม่"** ใน AI Studio แล้วเจนคีย์ใหม่จากโปรเจกต์นั้นครับ`);
  }
  throw error;
}
