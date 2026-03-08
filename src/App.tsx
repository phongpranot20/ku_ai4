import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Info, ExternalLink, GraduationCap, Sparkles, MessageSquare, BookOpen, MapPin, Calendar, Menu, X } from 'lucide-react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { getChatResponse } from './services/gemini';
import { cn } from './lib/utils';

interface Message {
  role: 'user' | 'model';
  text: string;
  sources?: { title: string; uri: string }[];
}

const QUICK_ACTIONS = [
  { icon: <Calendar className="w-4 h-4" />, label: 'ปฏิทินการศึกษา', query: 'ขอปฏิทินการศึกษาปีล่าสุดหน่อย' },
  { icon: <BookOpen className="w-4 h-4" />, label: 'การลงทะเบียน', query: 'ขั้นตอนการลงทะเบียนเรียนทำยังไง' },
  { icon: <MapPin className="w-4 h-4" />, label: 'แผนที่วิทยาเขต', query: 'ขอแผนที่มหาวิทยาลัยเกษตรศาสตร์ บางเขน' },
  { icon: <MessageSquare className="w-4 h-4" />, label: 'รถตะลัย', query: 'ตารางเดินรถตะลัยสายต่างๆ' },
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: 'สวัสดีครับ! ผมคือ **KU AI Assistant** ยินดีที่ได้รู้จักครับ 🌿\n\nผมพร้อมช่วยเหลือคุณในทุกเรื่องเกี่ยวกับมหาวิทยาลัยเกษตรศาสตร์ ไม่ว่าจะเป็นเรื่องการเรียน กิจกรรม หรือการใช้ชีวิตในรั้วนนทรี มีอะไรให้ผมช่วยไหมครับ?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  const handleSend = async (textOverride?: string) => {
    const userMessage = textOverride || input.trim();
    if (!userMessage || isLoading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      const response = await getChatResponse(userMessage, history);
      
      const text = response.text || "ขออภัยครับ ผมไม่สามารถประมวลผลคำตอบได้ในขณะนี้";
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map((chunk: any) => chunk.web)
        .filter(Boolean) || [];

      setMessages((prev) => [
        ...prev,
        { role: 'model', text, sources },
      ]);
    } catch (error: any) {
      console.error('Chat Error:', error);
      const errorMessage = error.message || 'ขออภัยครับ เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง';
      
      // Check if it's an API key issue to provide better guidance
      const isApiKeyMissing = !import.meta.env.VITE_GEMINI_API_KEY;
      
      setMessages((prev) => [
        ...prev,
        { 
          role: 'model', 
          text: isApiKeyMissing 
            ? "❌ **ไม่พบ API Key:** ระบบไม่สามารถดึงค่า `VITE_GEMINI_API_KEY` ได้ กรุณาตรวจสอบว่าคุณได้ตั้งค่าใน Vercel และทำการ **Redeploy** แล้วหรือยัง?"
            : `❌ **เกิดข้อผิดพลาด:** ${errorMessage}\n\n*(คำแนะนำ: ลองตรวจสอบว่า API Key ของคุณเปิดใช้งาน Gemini API แล้วหรือยัง หรือลองสร้าง Key ใหม่ครับ)*`
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transition-transform duration-300 transform lg:relative lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-ku-green p-2 rounded-xl shadow-lg shadow-ku-green/20">
                <GraduationCap className="text-white w-6 h-6" />
              </div>
              <span className="font-bold text-slate-800 text-lg">KU Assistant</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">คำถามที่พบบ่อย</h3>
              <div className="space-y-2">
                {QUICK_ACTIONS.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      handleSend(action.query);
                      setIsSidebarOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-ku-soft-green hover:text-ku-green rounded-xl transition-all group"
                  >
                    <span className="p-1.5 bg-slate-50 rounded-lg group-hover:bg-white transition-colors">
                      {action.icon}
                    </span>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">ลิงก์สำคัญ</h3>
              <div className="space-y-2">
                <a href="https://www.ku.ac.th" target="_blank" rel="noreferrer" className="flex items-center justify-between px-3 py-2 text-sm text-slate-600 hover:text-ku-green transition-colors">
                  เว็บไซต์หลัก KU <ExternalLink size={14} />
                </a>
                <a href="https://registrar.ku.ac.th" target="_blank" rel="noreferrer" className="flex items-center justify-between px-3 py-2 text-sm text-slate-600 hover:text-ku-green transition-colors">
                  สำนักทะเบียน <ExternalLink size={14} />
                </a>
                <a href="https://ocs.ku.ac.th" target="_blank" rel="noreferrer" className="flex items-center justify-between px-3 py-2 text-sm text-slate-600 hover:text-ku-green transition-colors">
                  สำนักคอมพิวเตอร์ <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100">
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <p className="text-[10px] text-slate-400 leading-relaxed">
                พัฒนาขึ้นเพื่อเป็นตัวช่วยสำหรับนิสิตและบุคลากร มหาวิทยาลัยเกษตรศาสตร์
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* Header */}
        <header className="glass-header sticky top-0 z-40 px-4 py-3 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="lg:hidden bg-ku-green p-1.5 rounded-lg">
                <GraduationCap className="text-white w-4 h-4" />
              </div>
              <h1 className="font-bold text-slate-800 tracking-tight flex items-center gap-2">
                KU AI Assistant
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-ku-soft-green text-ku-green text-[10px] font-bold rounded-full border border-ku-green/10">
                  <Sparkles size={10} /> BETA
                </span>
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-[10px] font-bold text-ku-green uppercase tracking-widest">Kasetsart University</span>
              <span className="text-[9px] text-slate-400">Knowledge of the Land</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-ku-soft-green border border-ku-green/20 flex items-center justify-center">
              <div className="w-2 h-2 bg-ku-green rounded-full animate-pulse" />
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-hidden relative flex flex-col">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 scroll-smooth"
          >
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={cn(
                    "flex w-full gap-4",
                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                    msg.role === 'user' 
                      ? "bg-white text-ku-green border border-slate-100" 
                      : "bg-ku-green text-white animate-float"
                  )}>
                    {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                  </div>
                  
                  <div className={cn(
                    "flex flex-col max-w-[85%] sm:max-w-[75%]",
                    msg.role === 'user' ? "items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "px-5 py-4 rounded-3xl",
                      msg.role === 'user' 
                        ? "chat-bubble-user text-white rounded-tr-none" 
                        : "chat-bubble-model text-slate-800 rounded-tl-none"
                    )}>
                      <div className="markdown-body">
                        <Markdown>{msg.text}</Markdown>
                      </div>
                    </div>

                    {msg.sources && msg.sources.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-3 flex flex-wrap gap-2"
                      >
                        {msg.sources.slice(0, 3).map((source, sIdx) => (
                          <a
                            key={sIdx}
                            href={source.uri}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] bg-white border border-slate-200 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-slate-500 hover:border-ku-green hover:text-ku-green hover:shadow-sm transition-all"
                          >
                            <ExternalLink size={12} />
                            {source.title.length > 25 ? source.title.substring(0, 25) + '...' : source.title}
                          </a>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4"
              >
                <div className="w-10 h-10 rounded-2xl bg-ku-green text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Bot size={20} />
                </div>
                <div className="chat-bubble-model px-5 py-4 rounded-3xl rounded-tl-none flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-ku-green/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-ku-green/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-ku-green/80 rounded-full animate-bounce" />
                  </div>
                  <span className="text-xs font-medium text-slate-400">กำลังประมวลผล...</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 sm:p-6 bg-gradient-to-t from-white via-white to-transparent">
            <div className="max-w-3xl mx-auto w-full">
              {messages.length === 1 && !isLoading && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6"
                >
                  {QUICK_ACTIONS.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(action.query)}
                      className="flex flex-col items-center gap-2 p-3 bg-white border border-slate-100 rounded-2xl hover:border-ku-green hover:shadow-md hover:shadow-ku-green/5 transition-all group"
                    >
                      <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-ku-soft-green text-slate-400 group-hover:text-ku-green transition-colors">
                        {action.icon}
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 group-hover:text-ku-green uppercase tracking-tight">{action.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}

              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-ku-green to-ku-light-green rounded-3xl blur opacity-10 group-focus-within:opacity-20 transition duration-500" />
                <div className="relative flex items-center bg-white border border-slate-200 rounded-3xl shadow-sm focus-within:border-ku-green/50 transition-all overflow-hidden">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="พิมพ์คำถามของคุณที่นี่..."
                    className="flex-1 px-6 py-4 text-slate-700 placeholder:text-slate-400 focus:outline-none"
                  />
                  <div className="flex items-center gap-2 pr-3">
                    <button
                      onClick={() => handleSend()}
                      disabled={!input.trim() || isLoading}
                      className="p-2.5 bg-ku-green text-white rounded-2xl hover:bg-ku-light-green disabled:opacity-30 shadow-lg shadow-ku-green/20 transition-all active:scale-95"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-4 mt-4">
                <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                  <Info size={12} className="text-slate-300" />
                  ข้อมูลอาจมีการคลาดเคลื่อน โปรดตรวจสอบจากแหล่งข้อมูลทางการ
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
