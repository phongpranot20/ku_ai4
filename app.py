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

# สไตล์ CSS สำหรับธีม KU
st.markdown("""
    <style>
    .stApp {
        background-color: #f8fafc;
    }
    .stButton>button {
        background-color: #006633;
        color: white;
        border-radius: 20px;
    }
    .stChatFloatingInputContainer {
        padding-bottom: 20px;
    }
    </style>
    """, unsafe_allow_ Harris=True)

# ดึง API Key (จาก Streamlit Secrets หรือ .env)
api_key = st.secrets.get("GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY")

if not api_key:
    st.error("กรุณาตั้งค่า GEMINI_API_KEY ใน Streamlit Secrets ก่อนใช้งาน")
    st.stop()

# ตั้งค่า Gemini
genai.configure(api_key=api_key)

SYSTEM_INSTRUCTION = """คุณคือ AI Chatbot ของมหาวิทยาลัยเกษตรศาสตร์ (KU) 
ตอบคำถามด้วยภาษาไทยที่สุภาพและเป็นกันเอง เน้นข้อมูลที่ถูกต้องและทันสมัย
ใช้ความสามารถของ Google Search เพื่อค้นหาข้อมูลล่าสุดจากเว็บ ku.ac.th เสมอ
หากมีการอ้างอิงข้อมูล ให้บอกแหล่งที่มาด้วย"""

# เริ่มต้น Chat Session
if "messages" not in st.session_state:
    st.session_state.messages = []
    st.session_state.chat = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction=SYSTEM_INSTRUCTION,
        tools=[{"google_search_retrieval": {}}]
    ).start_chat(history=[])

# แสดง Header
st.title("🌿 KU AI Assistant")
st.caption("ศาสตร์แห่งแผ่นดิน เพื่อความกินดีอยู่ดีของชาติ (Beta)")

# แสดงข้อความในแชท
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# ส่วนรับคำถาม
if prompt := st.chat_input("พิมพ์คำถามเกี่ยวกับ KU ที่นี่..."):
    # แสดงคำถามของผู้ใช้
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # เรียก Gemini ตอบ
    with st.chat_message("assistant"):
        with st.spinner("กำลังค้นหาข้อมูล..."):
            try:
                response = st.session_state.chat.send_message(prompt)
                full_response = response.text
                
                # แสดงคำตอบ
                st.markdown(full_response)
                
                # เก็บประวัติ
                st.session_state.messages.append({"role": "assistant", "content": full_response})
            except Exception as e:
                st.error(f"เกิดข้อผิดพลาด: {str(e)}")
