import streamlit as st
import google.generativeai as genai
import os
from dotenv import load_dotenv

# โหลด Environment Variables
load_dotenv()

# ตั้งค่าหน้าจอ Streamlit
st.set_page_config(
    page_title="KU AI Assistant",
    page_icon="🌿",
    layout="centered"
)

# --- ฟังก์ชันสำหรับโหลด CSS จากไฟล์แยก ---
def local_css(file_name):
    with open(file_name) as f:
        st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

# เรียกใช้งานไฟล์สไตล์ (ต้องสร้างไฟล์ style.css ไว้ในโฟลเดอร์เดียวกัน)
try:
    local_css("style.css")
except FileNotFoundError:
    st.error("ไม่พบไฟล์ style.css กรุณาตรวจสอบว่าไฟล์อยู่ในโฟลเดอร์เดียวกัน")

# --- ส่วน Logic การเชื่อมต่อ Gemini API ---
api_key = st.secrets.get("GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY")

if not api_key:
    st.error("กรุณาตั้งค่า GEMINI_API_KEY ใน Streamlit Secrets หรือไฟล์ .env")
    st.stop()

genai.configure(api_key=api_key)

SYSTEM_INSTRUCTION = """คุณคือ AI Chatbot ของมหาวิทยาลัยเกษตรศาสตร์ (KU) 
ตอบคำถามด้วยภาษาไทยที่สุภาพและเป็นกันเอง เน้นข้อมูลที่ถูกต้องและทันสมัย
ใช้ความสามารถของ Google Search เพื่อค้นหาข้อมูลล่าสุดจากเว็บ ku.ac.th เสมอ"""

if "messages" not in st.session_state:
    st.session_state.messages = []
    st.session_state.chat = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction=SYSTEM_INSTRUCTION,
        tools=[{"google_search_retrieval": {}}]
    ).start_chat(history=[])

# --- ส่วนแสดงผล UI ---
st.title("🌿 KU AI Assistant")
st.caption("ศาสตร์แห่งแผ่นดิน เพื่อความกินดีอยู่ดีของชาติ (Space Edition)")

for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

if prompt := st.chat_input("พิมพ์คำถามเกี่ยวกับ KU ที่นี่..."):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        with st.spinner("กำลังท่องอวกาศหาข้อมูลให้คุณ..."):
            try:
                response = st.session_state.chat.send_message(prompt)
                full_response = response.text
                st.markdown(full_response)
                st.session_state.messages.append({"role": "assistant", "content": full_response})
            except Exception as e:
                st.error(f"เกิดข้อผิดพลาด: {str(e)}")
