import streamlit as st
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

st.set_page_config(
    page_title="KU AI Assistant",
    page_icon="🌿",
    layout="centered"
)

# --- ใส่ CSS กลับมาใน app.py โดยตรงเพื่อป้องกันหาไฟล์ style.css ไม่เจอ ---
st.markdown("""
    <style>
    .stApp {
        background: radial-gradient(circle at center, #002b16 0%, #000000 100%) !important;
    }
    .stApp::before {
        content: "";
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        background: url('https://www.transparenttextures.com/patterns/stardust.png') repeat;
        animation: move-stars 100s linear infinite;
        opacity: 0.5;
        z-index: 0;
    }
    @keyframes move-stars {
        from { background-position: 0 0; }
        to { background-position: 1000px 1000px; }
    }
    h1, h2, h3, p, span, label, .stMarkdown {
        color: #ffffff !important;
    }
    .stChatMessage {
        background-color: rgba(255, 255, 255, 0.05) !important;
        border: 1px solid rgba(0, 255, 127, 0.2) !important;
    }
    </style>
    """, unsafe_allow_html=True)

# --- Logic Gemini ---
api_key = st.secrets.get("GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY")
if not api_key:
    st.error("กรุณาตั้งค่า API Key")
    st.stop()

genai.configure(api_key=api_key)

if "messages" not in st.session_state:
    st.session_state.messages = []
    st.session_state.chat = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction="คุณคือ AI ของ KU ตอบด้วยภาษาไทยที่สุภาพ",
        tools=[{"google_search_retrieval": {}}]
    ).start_chat(history=[])

st.title("🌿 KU AI Assistant")
st.caption("ศาสตร์แห่งแผ่นดิน (Space Edition)")

for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

if prompt := st.chat_input("พิมพ์คำถามที่นี่..."):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)
    with st.chat_message("assistant"):
        with st.spinner("กำลังค้นหา..."):
            response = st.session_state.chat.send_message(prompt)
            st.markdown(response.text)
            st.session_state.messages.append({"role": "assistant", "content": response.text})
