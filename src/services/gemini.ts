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

export async function getChatResponseStream(message: string, history: any[] = [], imageBase64?: string, mimeType?: string) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("ไม่พบ API Key");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";

  if (imageBase64 && mimeType) {
    // Multimodal streaming
    return ai.models.generateContentStream({
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
        tools: [{ googleSearch: {} }],
      }
    });
  }

  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ googleSearch: {} }],
    },
    history: history,
  });

  return chat.sendMessageStream({ message });
}

export async function getChatResponse(message: string, history: any[] = [], imageBase64?: string, mimeType?: string) {
  // Try to get API key from Vite's environment variables
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    console.error("Missing API Key. Ensure VITE_GEMINI_API_KEY is set in your environment variables.");
    throw new Error("ไม่พบ API Key (VITE_GEMINI_API_KEY) กรุณาตั้งค่า Environment Variable ใน Vercel/Netlify โดยใช้ชื่อ 'VITE_GEMINI_API_KEY' และทำการ Re-deploy (หรือกด Redeploy ในหน้า Deployments) อีกครั้งครับ");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const model = "gemini-3-flash-preview";

  if (imageBase64 && mimeType) {
    // For multimodal, we use generateContent instead of chat.sendMessage
    // because chat history with images is more complex to manage in a simple way
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
        tools: [{ googleSearch: {} }],
      }
    });
    return response;
  }

  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ googleSearch: {} }],
    },
    history: history,
  });

  const result = await chat.sendMessage({ message });
  return result;
}
