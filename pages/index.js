import { useState } from 'react';

export default function Home() {
  const [image, setImage] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [outputType, setOutputType] = useState('image');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const sendRequest = async () => {
    if (!image) return alert('يرجى رفع صورة');

    const base64 = await convertToBase64(image);

    setMessages(prev => [
      ...prev,
      { type: 'user', text: prompt || 'طلب افتراضي' },
      { type: 'bot', text: '⏳ جاري المعالجة...' }
    ]);
    setLoading(true);

    try {const res = await fetch('https://karikasty-base64.vercel.app/api/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ image: base64, prompt, outputType })
    });
    
    

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`الرد غير ناجح: ${res.status} – ${errorText}`);
      }

      const data = await res.json();
      setMessages(prev => [...prev.slice(0, -1), { type: 'bot', image: data.imageUrl }]);
    } catch (err) {
      setMessages(prev => [...prev.slice(0, -1), { type: 'bot', text: `❌ حدث خطأ: ${err.message}` }]);
    }

    setLoading(false);
  };

  return (
    <main style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      <h2>كاريكاستي 🤖 - تحويل كرتوني</h2>

      <div style={{ background: '#fff', padding: 15, borderRadius: 10, marginBottom: 20 }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{
            background: msg.type === 'user' ? '#ececec' : '#dcf8c6',
            padding: 10,
            borderRadius: 10,
            margin: '10px 0',
            textAlign: msg.type === 'user' ? 'right' : 'left'
          }}>
            {msg.text && <p>{msg.text}</p>}
            {msg.image && <img src={msg.image} style={{ maxWidth: '200px', borderRadius: 12 }} />}
          </div>
        ))}
        {loading && <p>جاري التحويل...</p>}
      </div>

      <input type="file" accept="image/*" onChange={e => setImage(e.target.files[0])} />
      <textarea rows="2" placeholder="اكتب وصف (اختياري)" value={prompt} onChange={e => setPrompt(e.target.value)} style={{ width: '100%', marginTop: 10 }}></textarea>
      <select value={outputType} onChange={e => setOutputType(e.target.value)} style={{ marginTop: 10 }}>
        <option value="image">📸 صورة كرتونية</option>
        <option value="sticker">🎯 ملصق واتساب</option>
      </select>
      <button onClick={sendRequest} style={{ marginTop: 10, padding: 10, background: '#25d366', color: '#fff', border: 'none', borderRadius: 6 }}>
        ✨ توليد
      </button>
    </main>
  );
}
