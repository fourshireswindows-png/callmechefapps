import { useState, useRef, useEffect } from "react";

const ELEVEN_KEY = "9446e78c73e387717ad7c1f4b6689179ca20f7ba915af9f3c1515c85393a5b78";

const CHEFS = [
  {
    id: "arlo", name: "Chef Arlo", flag: "🇬🇧", color: "#c8873a",
    voiceId: "xXukyS7T3bWbuemsGCfl", specialty: "Everyday cooking",
    persona: "You are Chef Arlo, a warm and patient British cooking companion. Encouraging, calm when things go wrong. Concise during cooking, conversational otherwise. Help users learn to cook with confidence. Never be sycophantic."
  },
  {
    id: "marco", name: "Chef Marco", flag: "🇮🇹", color: "#e74c3c",
    voiceId: "R6VO1ayo9LsvNpM0GIKg", specialty: "Italian cuisine",
    persona: "You are Chef Marco, a passionate Italian chef with 40 years experience. Dramatic about food — especially horrified by cream in carbonara. Use phrases like Mamma mia and No no no. Warm and generous but with very strong opinions about authentic Italian cooking. Never be sycophantic."
  },
  {
    id: "jules", name: "Chef Jules", flag: "🇫🇷", color: "#3498db",
    voiceId: "uPhuROkcJMqcGR8UfhrB", specialty: "French & pastry",
    persona: "You are Chef Jules, a refined French chef trained in Paris. Precise, calm and quietly intense. Use phrases like Voilà and Précisément. Cooking is an art requiring discipline. Patient with beginners but with very high standards. Never be sycophantic."
  },
];

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0f0d0a; }
  textarea, input { outline: none; resize: none; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes bounce { 0%,80%,100% { transform: translateY(0); opacity: .4; } 40% { transform: translateY(-5px); opacity: 1; } }
`;

const STARTERS = [
  "What should I cook tonight?",
  "I'm a complete beginner — where do I start?",
  "What can I make with chicken and pasta?",
  "I burnt my garlic — what do I do?",
];

export default function App() {
  const [screen, setScreen] = useState("profile");
  const [userName, setUserName] = useState("");
  const [chef, setChef] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const audioRef = useRef(null);
  const messagesRef = useRef([]);

  messagesRef.current = messages;

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeaking(false);
  };

  const playVoice = (text, voiceId) => {
    if (!voiceId) return;
    stopAudio();
    const clean = text.replace(/[*_#`]/g, "").replace(/\n+/g, " ").slice(0, 500);
    setSpeaking(true);
    fetch("https://api.elevenlabs.io/v1/text-to-speech/" + voiceId, {
      method: "POST",
      headers: { "Content-Type": "application/json", "xi-api-key": ELEVEN_KEY },
      body: JSON.stringify({
        text: clean,
        model_id: "eleven_monolingual_v1",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    })
    .then(r => r.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setSpeaking(false); URL.revokeObjectURL(url); };
      audio.onerror = () => setSpeaking(false);
      return audio.play();
    })
    .catch(() => setSpeaking(false));
  };

  const sendMessage = (textArg) => {
    const t = (textArg || input).trim();
    if (!t || loading) return;
    stopAudio();
    setInput("");
    setError("");
    const prev = messagesRef.current;
    const next = prev.concat([{ role: "user", content: t }]);
    setMessages(next);
    setLoading(true);

    const system = chef.persona + "\n\nThe user's name is " + userName + ". Use their name naturally but not excessively.";

    fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 800,
        system: system,
        messages: next
      })
    })
    .then(r => r.json())
    .then(data => {
      if (data.error) {
        setError("API error: " + data.error.message);
        setMessages(next.concat([{ role: "assistant", content: "Sorry, something went wrong. Please try again." }]));
      } else {
        const reply = data.content && data.content[0] ? data.content[0].text : "Something went wrong.";
        setMessages(next.concat([{ role: "assistant", content: reply }]));
        playVoice(reply, chef.voiceId);
      }
    })
    .catch(err => {
      setError("Network error: " + err.message);
      setMessages(next.concat([{ role: "assistant", content: "Connection error — please check your internet and try again." }]));
    })
    .finally(() => setLoading(false));
  };

  // ── Profile ─────────────────────────────────────────────────────────────────
  if (screen === "profile") {
    return (
      <div style={{ fontFamily: "'DM Sans',sans-serif", background: "#0f0d0a", minHeight: "100vh", display: "flex", flexDirection: "column", color: "#e8dcc8" }}>
        <style>{css}</style>
        <div style={{ padding: "0 20px", height: 56, display: "flex", alignItems: "center", borderBottom: "1px solid #1e1a13", flexShrink: 0 }}>
          <span style={{ color: "#c8873a", marginRight: 7 }}>✦</span>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, color: "#e8dcc8" }}>Call Me Chef</span>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
          <div style={{ width: "100%", maxWidth: 440, animation: "fadeUp 0.5s ease both" }}>
            <p style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#c8873a", marginBottom: 10 }}>Welcome</p>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 400, color: "#f0e6d3", marginBottom: 8, lineHeight: 1.2 }}>What's your name?</h1>
            <p style={{ fontSize: 13, color: "#6b5e4a", marginBottom: 28, lineHeight: 1.6, fontWeight: 300 }}>Your chef will use this to make things personal.</p>
            <input
              value={userName}
              onChange={e => setUserName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && userName.trim()) setScreen("chefs"); }}
              placeholder="Your first name"
              style={{ width: "100%", background: "#161310", border: "1px solid #2a2318", borderRadius: 10, padding: "13px 15px", color: "#e8dcc8", fontSize: 16, fontFamily: "'DM Sans',sans-serif", fontWeight: 300, marginBottom: 16 }}
            />
            <button
              onClick={() => { if (userName.trim()) setScreen("chefs"); }}
              style={{ width: "100%", background: "linear-gradient(135deg,#c8873a,#9a6428)", border: "none", borderRadius: 12, padding: "14px", color: "#f0e6d3", fontSize: 15, fontFamily: "'DM Sans',sans-serif", fontWeight: 500, cursor: userName.trim() ? "pointer" : "default", opacity: userName.trim() ? 1 : 0.35 }}
            >
              Meet your chefs →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Chef selection ──────────────────────────────────────────────────────────
  if (screen === "chefs") {
    return (
      <div style={{ fontFamily: "'DM Sans',sans-serif", background: "#0f0d0a", minHeight: "100vh", display: "flex", flexDirection: "column", color: "#e8dcc8" }}>
        <style>{css}</style>
        <div style={{ padding: "0 20px", height: 56, display: "flex", alignItems: "center", borderBottom: "1px solid #1e1a13", flexShrink: 0 }}>
          <span style={{ color: "#c8873a", marginRight: 7 }}>✦</span>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, color: "#e8dcc8" }}>Call Me Chef</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "32px 20px" }}>
          <div style={{ maxWidth: 500, margin: "0 auto", animation: "fadeUp 0.5s ease both" }}>
            <p style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#c8873a", marginBottom: 10 }}>Hello, {userName}</p>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 30, fontWeight: 400, color: "#f0e6d3", marginBottom: 8 }}>Who are you cooking with?</h1>
            <p style={{ fontSize: 13, color: "#6b5e4a", marginBottom: 28, fontWeight: 300 }}>Each chef has their own personality, expertise and accent.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {CHEFS.map(c => (
                <button key={c.id} onClick={() => { setChef(c); setMessages([]); setError(""); setScreen("chat"); }}
                  style={{ background: "#161310", border: "1px solid #2a2318", borderRadius: 14, padding: "16px", textAlign: "left", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg,${c.color},${c.color}66)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{c.flag}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, color: "#f0e6d3", marginBottom: 3 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: c.color }}>{c.specialty}</div>
                    </div>
                    <span style={{ color: "#3a3228", fontSize: 18 }}>›</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Chat ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: "#0f0d0a", minHeight: "100vh", display: "flex", flexDirection: "column", color: "#e8dcc8" }}>
      <style>{css}</style>

      <div style={{ padding: "0 16px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #1e1a13", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ color: chef.color }}>✦</span>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, color: "#e8dcc8" }}>Call Me Chef</span>
          <span style={{ fontSize: 10, color: chef.color, background: chef.color + "22", borderRadius: 4, padding: "2px 7px" }}>{chef.flag} {chef.name}</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {speaking && (
            <button onClick={stopAudio} style={{ background: chef.color + "22", border: "1px solid " + chef.color, borderRadius: 8, padding: "4px 9px", cursor: "pointer", fontSize: 10, color: chef.color, fontFamily: "'DM Sans',sans-serif" }}>Stop ✕</button>
          )}
          <button onClick={() => { stopAudio(); setScreen("chefs"); }} style={{ background: "transparent", border: "1px solid #2a2318", borderRadius: 8, padding: "4px 9px", cursor: "pointer", fontSize: 10, color: "#6b5e4a", fontFamily: "'DM Sans',sans-serif" }}>Switch</button>
        </div>
      </div>

      {error ? (
        <div style={{ background: "#1a0a0a", border: "1px solid #3a1515", borderRadius: 8, margin: "10px 16px", padding: "8px 12px", fontSize: 11, color: "#c0504a" }}>{error}</div>
      ) : null}

      <div style={{ flex: 1, overflowY: "auto" }}>
        {messages.length === 0 ? (
          <div style={{ maxWidth: 540, margin: "0 auto", padding: "48px 20px 32px", animation: "fadeUp 0.5s ease both" }}>
            <p style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: chef.color, marginBottom: 12 }}>Ready to cook</p>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 36, fontWeight: 400, color: "#f0e6d3", marginBottom: 8 }}>{chef.name}</h2>
            <p style={{ fontSize: 13, color: "#6b5e4a", marginBottom: 32, fontWeight: 300 }}>What are we cooking today, {userName}?</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {STARTERS.map((t, i) => (
                <button key={i} onClick={() => sendMessage(t)}
                  style={{ background: "transparent", border: "1px solid #2a2318", borderRadius: 10, padding: "12px 15px", color: "#b8a898", fontSize: 13, textAlign: "left", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 300 }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 660, margin: "0 auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-start", gap: 9, animation: "fadeUp 0.3s ease both" }}>
                {m.role === "assistant" && (
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg,${chef.color},${chef.color}88)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{chef.flag}</div>
                )}
                <div style={{ maxWidth: "80%", background: m.role === "user" ? "#1e1a13" : "#161310", border: `1px solid ${m.role === "user" ? "#2a2318" : "#1e1a13"}`, borderRadius: m.role === "user" ? "14px 14px 3px 14px" : "3px 14px 14px 14px", padding: "10px 14px", fontSize: 14, lineHeight: 1.7, color: m.role === "user" ? "#e8dcc8" : "#d4c4a8", fontWeight: 300 }}>
                  {m.content.split("\n").map((l, j, a) => (
                    <span key={j}>{l}{j < a.length - 1 ? <br /> : null}</span>
                  ))}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg,${chef.color},${chef.color}88)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{chef.flag}</div>
                <div style={{ background: "#161310", border: "1px solid #1e1a13", borderRadius: "3px 14px 14px 14px", padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    {[0, 150, 300].map(d => (
                      <span key={d} style={{ width: 5, height: 5, borderRadius: "50%", background: chef.color, display: "inline-block", animation: "bounce 1.2s infinite ease-in-out", animationDelay: d + "ms" }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div style={{ padding: "10px 16px 18px", borderTop: "1px solid #1a1710", background: "rgba(15,13,10,0.97)", flexShrink: 0 }}>
        <div style={{ maxWidth: 660, margin: "0 auto", display: "flex", alignItems: "center", gap: 8, background: "#161310", border: "1px solid #2a2318", borderRadius: 14, padding: "8px 8px 8px 15px" }}>
          <textarea
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={"Ask " + chef.name + " anything…"}
            style={{ flex: 1, background: "transparent", border: "none", color: "#e8dcc8", fontSize: 14, fontFamily: "'DM Sans',sans-serif", fontWeight: 300, lineHeight: 1.5, maxHeight: 100, caretColor: chef.color }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            style={{ width: 36, height: 36, borderRadius: 9, background: `linear-gradient(135deg,${chef.color},${chef.color}88)`, border: "none", color: "#f0e6d3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: input.trim() && !loading ? 1 : 0.35, cursor: input.trim() && !loading ? "pointer" : "default" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p style={{ maxWidth: 660, margin: "7px auto 0", fontSize: 10, color: "#2a2318", textAlign: "center" }}>{chef.name} can make mistakes · Always use your judgement</p>
      </div>
    </div>
  );
}
