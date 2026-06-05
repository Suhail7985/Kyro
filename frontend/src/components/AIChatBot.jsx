import { useState, useRef, useEffect } from 'react';
import { aiAPI } from '../services/api';

export default function AIChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi! I am Kyro HR Assistant. Ask about leave, payroll, attendance, or interviews.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: 'user', text }]);
    setInput('');
    setLoading(true);
    try {
      const res = await aiAPI.chat(text);
      setMessages((m) => [...m, { role: 'bot', text: res.data.reply, source: res.data.source }]);
    } catch {
      setMessages((m) => [...m, { role: 'bot', text: 'Sorry, I could not process that request.' }]);
    } finally {
      setLoading(false);
    }
  };

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Try Chrome.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      sendMessage(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-brand-600 text-white shadow-lg hover:bg-brand-700 flex items-center justify-center text-xl md:bottom-6 md:right-6"
        aria-label="Open HR AI chat"
      >
        {open ? '×' : '💬'}
      </button>

      {open && (
        <div className="fixed bottom-20 right-4 left-4 z-50 md:left-auto md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[70vh]">
          <div className="p-3 border-b bg-brand-600 text-white rounded-t-2xl">
            <p className="font-semibold text-sm">AI HR Assistant</p>
            <p className="text-xs opacity-80">Text & voice (Web Speech API)</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px]">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`text-sm p-2 rounded-lg max-w-[90%] ${
                  msg.role === 'user'
                    ? 'ml-auto bg-brand-100 text-brand-900'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                {msg.text}
                {msg.source && (
                  <span className="block text-[10px] text-slate-400 mt-1">via {msg.source}</span>
                )}
              </div>
            ))}
            {loading && <p className="text-xs text-slate-400 animate-pulse">Thinking...</p>}
            <div ref={bottomRef} />
          </div>
          <div className="p-3 border-t flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
              placeholder="Ask HR anything..."
              className="flex-1 text-sm px-3 py-2 border rounded-lg"
            />
            <button
              type="button"
              onClick={listening ? stopVoice : startVoice}
              className={`px-3 py-2 rounded-lg text-sm ${listening ? 'bg-red-500 text-white' : 'bg-slate-200'}`}
              title="Voice input"
            >
              🎤
            </button>
            <button
              type="button"
              onClick={() => sendMessage(input)}
              className="px-3 py-2 bg-brand-600 text-white rounded-lg text-sm"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
