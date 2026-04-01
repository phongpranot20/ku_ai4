import streamlit as st
import google.generativeai as genai
import os
from dotenv import load_dotenv

# โหลด Environment Variables (สำหรับรันในเครื่องตัวเอง)
load_dotenv()

# ตั้งค่าหน้าจอ Streamlit
st.set_page_config(
    page_title="KU AI Assistant",
    page_icon="🌿",
    layout="centered"
)

# --- สไตล์ CSS สำหรับธีมอวกาศสีเขียว-ขาว (Space Green Edition) ---
st.markdown("""
    <style>
    /* สร้างพื้นหลังอวกาศขยับได้ */
    .stApp {
        background: radial-gradient(ellipse at bottom, #001a0f 0%, #000000 100%);
        overflow: hidden;
    }
    
    /* เอฟเฟกต์ดวงดาวระยิบระยับขยับได้ */
    .stApp::before {
        content: "";
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        background: transparent url('https://www.transparenttextures.com/patterns/stardust.png') repeat;
        animation: move-stars 60s linear infinite;
        opacity: 0.4;
        z-index: -1;
    }

    @keyframes move-stars {
        from { background-position: 0 0; }
        to { background-position: 1000px 500px; }
    }

    /* ปรับแต่งปุ่มให้เป็นสีเขียวเกษตร ขอบขาวเรืองแสง */
    .stButton>button {
        background-color: #006633;
        color: white;
        border-radius: 30px;
        border: 2px solid rgba(255, 255, 255, 0.4);
        transition: all 0.3s ease;
        font-weight: bold;
        padding: 0.5rem 2rem;
    }
    .stButton>button:hover {
        background-color: #008844;
        border-color: #ffffff;
        box-shadow: 0 0 20px rgba(0, 102, 51, 0.6);
        transform: translateY(-2px);
    }

    /* ปรับแต่งกล่องแชทให้มีความโปร่งใส (Glassmorphism) */
    .stChatMessage {
        background-color: rgba(255, 255, 255, 0.07);
        border-radius: 15px;
        border: 1px solid rgba(0, 102, 51, 0.3);
        margin-bottom: 15px;
        color: white !important;
    }

    /* ปรับสีตัวอักษรทั้งหมดให้เป็นสีขาว/เขียวอ่อนเพื่อให้มองเห็นชัดบนพื้นหลังมืด */
    h1, h2, h3, p, span, li {
        color: #ffffff !important;
    }
    
    .stCaption {
        color: #a5d6a7 !important; /* สีเขียวอ่อนสำหรับคำอธิบาย */
    }

    /* ปรับแต่งช่อง Input ด้านล่าง */
    .stChatFloatingInputContainer {
        background-color: transparent !important;
        padding-bottom: 30px;
    }
    
    textarea {
        background-color: rgba(255, 255, 255, 0.1) !important;
        color: white !important;
        border: 1px solid rgba(0, 102, 51, 0.5) !important;
    }
    </style>
    """, unsafe_allow_html=True)

# --- ส่วน Logic การเชื่อมต่อ Gemini API ---

# ดึง API Key (จาก Streamlit Secrets หรือ .env)
api_key = st.secrets.get("GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY")

if not api_key:
    st.error("กรุณาตั้งค่า GEMINI_API_KEY ใน Streamlit Secrets หรือไฟล์ .env ก่อนใช้งาน")
    st.stop()

# ตั้งค่า Gemini
genai.configure(api_key=api_key)

SYSTEM_INSTRUCTION = """คุณคือ AI Chatbot ของมหาวิทยาลัยเกษตรศาสตร์ (KU) 
ตอบคำถามด้วยภาษาไทยที่สุภาพและเป็นกันเอง เน้นข้อมูลที่ถูกต้องและทันสมัย
ใช้ความสามารถของ Google Search เพื่อค้นหาข้อมูลล่าสุดจากเว็บ ku.ac.th เสมอ
หากมีการอ้างอิงข้อมูล ให้บอกแหล่งที่มาด้วย"""

# เริ่มต้น Chat Session ใน session_state
if "messages" not in st.session_state:
    st.session_state.messages = []
    st.session_state.chat = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction=SYSTEM_INSTRUCTION,
        tools=[{"google_search_retrieval": {}}]
    ).start_chat(history=[])

# --- ส่วนแสดงผล UI ---

# แสดง Header
st.title("🌿 KU AI Assistant")
st.caption("ศาสตร์แห่งแผ่นดิน เพื่อความกินดีอยู่ดีของชาติ (Space Edition)")

# แสดงข้อความในประวัติการแชท
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# ส่วนรับคำถามจากผู้ใช้
if prompt := st.chat_input("พิมพ์คำถามเกี่ยวกับ KU ที่นี่..."):
    # แสดงคำถามของผู้ใช้
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # เรียก Gemini ตอบ
    with st.chat_message("assistant"):
        with st.spinner("กำลังท่องอวกาศหาข้อมูลให้คุณ..."):
            try:
                response = st.session_state.chat.send_message(prompt)
                full_response = response.text
                
                # แสดงคำตอบ
                st.markdown(full_response)
                
                # เก็บประวัติ
                st.session_state.messages.append({"role": "assistant", "content": full_response})
            except Exception as e:
                st.error(f"เกิดข้อผิดพลาด: {str(e)}")
