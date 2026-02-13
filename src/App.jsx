import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { Upload, MessageSquare, AlertTriangle, ShieldCheck, Zap, Loader2, Sparkles } from 'lucide-react';

const App = () => {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // --- 1. OCR Logic ---
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    try {
      const { data: { text } } = await Tesseract.recognize(file, 'eng');
      setText(text.trim());
    } catch (err) {
      setError("Failed to read image. Try pasting text manually.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- 2. The Gemini API Logic ---
  const analyzeTone = async () => {
    if (!text) return;
    setIsProcessing(true);
    setError(null);

    // PASTE YOUR GEMINI KEY HERE
    const GEMINI_KEY = ""; 
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent`;

    const promptText = `
      You are 'Overthinkr', an expert in digital linguistics. Analyze this text: "${text}"
      Return a valid JSON object ONLY. 
      Format:
      {
        "tone": "String",
        "score": Number(1-10),
        "explanation": "Short analysis",
        "confidence": Number(1-100),
        "replies": [
          {"type": "Confident", "msg": "text"},
          {"type": "Calm", "msg": "text"},
          {"type": "Witty", "msg": "text"}
        ]
      }
    `;

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_KEY
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      // Check if response has the expected structure
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
        console.error("Unexpected API response structure:", data);
        throw new Error("Invalid response from Gemini API");
      }
      
      // Gemini returns data in candidates[0].content.parts[0].text
      const rawJson = data.candidates[0].content.parts[0].text;
      const result = JSON.parse(rawJson);
      
      const icons = {
        Confident: <ShieldCheck size={16}/>,
        Calm: <Zap size={16}/>,
        Witty: <Sparkles size={16}/>
      };

      result.replies = result.replies.map(r => ({
        ...r,
        icon: icons[r.type] || <MessageSquare size={16}/>
      }));

      setAnalysis(result);
    } catch (err) {
      setError("Gemini had a brain freeze. Check your API key or connection.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-20 px-4">
      <nav className="p-6 max-w-4xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <MessageSquare size={20} />
          </div>
          <span className="text-2xl font-black tracking-tighter italic text-indigo-600">Overthinkr.</span>
        </div>
      </nav>

      <main className="max-w-xl mx-auto mt-8">
        <header className="text-center mb-10">
          <h2 className="text-4xl font-extrabold mb-3 tracking-tight">Decode the subtext.</h2>
          <p className="text-slate-500 italic">"Is that period aggressive or just grammar?"</p>
        </header>

        <div className="bg-white rounded-[2rem] shadow-2xl shadow-indigo-100 border border-slate-100 p-6 mb-8 transition-all">
          <textarea
            className="w-full bg-slate-50 border-none rounded-2xl p-5 text-lg focus:ring-2 focus:ring-indigo-500 outline-none transition min-h-[140px] resize-none"
            placeholder="Paste that text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button 
              onClick={() => fileInputRef.current.click()}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 rounded-2xl transition"
            >
              <Upload size={18} /> Screenshot
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            
            <button 
              onClick={analyzeTone}
              disabled={isProcessing || !text}
              className="flex-[2] bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-lg transition flex items-center justify-center gap-2"
            >
              {isProcessing ? <Loader2 className="animate-spin" /> : <><Sparkles size={18} /> Analyze with Gemini</>}
            </button>
          </div>
          {error && <p className="text-red-500 text-xs mt-4 text-center font-bold">{error}</p>}
        </div>

        {analysis && (
          <div className="space-y-6 animate-in">
            <div className="flex gap-4">
              <div className="flex-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-1 tracking-widest">Tone</span>
                <p className="text-xl font-bold text-indigo-600 tracking-tight">{analysis.tone}</p>
              </div>
              <div className="flex-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-1 tracking-widest">Tension</span>
                <div className="flex items-center gap-2">
                  <p className={`text-xl font-bold ${analysis.score > 5 ? 'text-orange-500' : 'text-green-500'}`}>{analysis.score}/10</p>
                  <AlertTriangle size={18} className={analysis.score > 5 ? 'text-orange-500' : 'text-green-500'} />
                </div>
              </div>
            </div>

            <div className="bg-indigo-600 p-8 rounded-[2rem] text-white shadow-xl">
              <h4 className="font-bold text-lg mb-2">The Verdict</h4>
              <p className="text-indigo-50 leading-relaxed italic">"{analysis.explanation}"</p>
            </div>

            <div className="space-y-3">
              <h4 className="font-black px-2 text-slate-400 text-[10px] uppercase tracking-widest">Smart Replies</h4>
              {analysis.replies.map((reply, i) => (
                <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-300 transition-all cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-indigo-500">{reply.icon}</span>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">{reply.type}</span>
                  </div>
                  <p className="text-slate-800 font-medium">"{reply.msg}"</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;