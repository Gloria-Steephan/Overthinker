import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { Upload, MessageSquare, AlertTriangle, ShieldCheck, Zap, Loader2, Sparkles } from 'lucide-react';
import { analyzeText as analyzeWithGemini } from './api';

const App = () => {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    try {
      const { data: { text } } = await Tesseract.recognize(file, 'eng');
      setText(text.trim());
    } catch {
      setError("Failed to read image.");
    } finally {
      setIsProcessing(false);
    }
  };

  const analyzeTone = async () => {
    if (!text) return;
    setIsProcessing(true);
    setError(null);

    
    const promptText = `
      SYSTEM ROLE:
      You are 'Overthinkr', a world-class expert in digital linguistics and generational subtext. 
      Your goal is to decode the hidden emotional meaning in short, ambiguous text messages.

      SLANG & GENERATIONAL CONTEXT:
      - Recognize Gen Z and Gen Alpha slang (e.g., 'rizz', 'gyatt', 'cap', 'bet', 'delulu', 'pookie', 'skibidi').
      - Interpret 'no cap' as 'truthfully' and 'cap' as a 'lie'.
      - Flag 'leaving someone on read' or 'dry texting' (very short replies to long messages) as significant red flag indicators.
      - Recognize that punctuation (like a period at the end of a one-word "Sure.") in casual chat often signals high tension.

      TASK:
      Analyze the following text message: "${text}"

      OUTPUT FORMATTING RULES:
      - Return a valid JSON object ONLY. Do not include conversational filler or explanations outside the JSON.
      - Use the exact JSON structure provided below:

      {
        "tone": "String (e.g., 'Passive-Aggressive', 'Low-Key Mad', 'High Rizz', etc.)",
        "score": Number (1-10, where 10 is maximum emotional tension or 'Red Flag'),
        "explanation": "A short, insightful analysis of the subtext and slang used.",
        "confidence": Number (1-100),
        "replies": [
          {"type": "Confident", "msg": "A mature, self-assured response."},
          {"type": "Calm", "msg": "A neutral, de-escalating response."},
          {"type": "Witty", "msg": "A clever response using appropriate slang if relevant."}
        ]
      }
    `;
try {
    const data = await analyzeWithGemini(promptText);
    const rawJson = data.candidates[0].content.parts[0].text;
      const result = JSON.parse(rawJson);

      const icons = {
        Confident: <ShieldCheck size={16} />,
        Calm: <Zap size={16} />,
        Witty: <Sparkles size={16} />
      };

      result.replies = result.replies.map(r => ({
        ...r,
        icon: icons[r.type] || <MessageSquare size={16} />
      }));

      setAnalysis(result);
    } catch (err) {
      setError("Gemini error. Check API key or backend.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-white">

      {/* Animated Conic Gradient */}
      <div className="absolute inset-0 animate-gradient bg-[conic-gradient(at_top_left,_#ff00cc,_#3333ff,_#00ffcc,_#ff6600,_#ff00cc)] opacity-80"></div>

      {/* Floating Blobs */}
      <div className="absolute w-[500px] h-[500px] bg-pink-500 rounded-full blur-[140px] opacity-40 animate-float-slow"></div>
      <div className="absolute right-0 top-1/3 w-[600px] h-[600px] bg-blue-500 rounded-full blur-[150px] opacity-40 animate-float-medium"></div>
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-green-400 rounded-full blur-[140px] opacity-30 animate-float-fast"></div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl"></div>

      <nav className="relative z-10 p-6 max-w-4xl mx-auto flex items-center gap-3">
        <MessageSquare size={22} />
        <span className="text-2xl font-semibold tracking-tight">
          Overthinkr
        </span>
      </nav>

      <main className="relative z-10 max-w-xl mx-auto px-6 pt-10 pb-24">

        <header className="mb-12">
          <h1 className="text-4xl font-semibold tracking-tight">
            Decode the subtext.
          </h1>
          <p className="text-gray-300 mt-3 text-sm">
            Between the lines. Beneath the tone.
          </p>
        </header>

        {/* Glass Input Card */}
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl p-6">

          <textarea
            className="w-full bg-black/40 border border-white/20 rounded-xl p-4 text-white placeholder-gray-400 focus:border-white/40 outline-none transition min-h-[140px] resize-none"
            placeholder="Paste the message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="flex flex-col sm:flex-row gap-3 mt-5">
            <button
              onClick={() => fileInputRef.current.click()}
              className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 py-3 rounded-xl transition"
            >
              Screenshot
            </button>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />

            <button
              onClick={analyzeTone}
              disabled={isProcessing || !text}
              className="flex-[2] bg-white text-black hover:bg-gray-200 py-3 rounded-xl transition flex items-center justify-center gap-2 font-medium"
            >
              {isProcessing
                ? <Loader2 className="animate-spin" size={18} />
                : <><Sparkles size={16}/> Analyze</>}
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-xs mt-3">{error}</p>
          )}
        </div>

        {analysis && (
          <div className="mt-14 space-y-8 animate-in">

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/10 border border-white/20 rounded-xl p-5 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-widest text-gray-300 mb-2">Tone</p>
                <p className="text-xl font-semibold">{analysis.tone}</p>
              </div>

              <div className="bg-white/10 border border-white/20 rounded-xl p-5 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-widest text-gray-300 mb-2">Tension</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-semibold">{analysis.score}/10</p>
                  <AlertTriangle size={18} />
                </div>
              </div>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-2xl p-6 backdrop-blur-xl">
              <p className="italic">{analysis.explanation}</p>
            </div>

            <div className="space-y-4">
              <p className="text-xs uppercase tracking-widest text-gray-300">
                Suggested Replies
              </p>

              {analysis.replies.map((reply, i) => (
                <div
                  key={i}
                  className="bg-white/10 border border-white/20 p-4 rounded-xl backdrop-blur-xl hover:bg-white/20 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {reply.icon}
                    <span className="text-xs uppercase tracking-wide">
                      {reply.type}
                    </span>
                  </div>
                  <p>"{reply.msg}"</p>
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
