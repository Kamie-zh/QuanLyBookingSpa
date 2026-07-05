'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const WELCOME_MESSAGE = { 
  role: 'model', 
  content: 'Xin chào! Tôi là trợ lý ảo AI của Luxe Beauty Spa. 🌸\n\nTôi có thể giúp bạn tìm các dịch vụ phù hợp nhất (ví dụ tư vấn khi bị **đau đầu, mỏi vai gáy**, trang điểm đi tiệc, trang điểm cô dâu, tìm dịch vụ có **giá rẻ nhất**...) hoặc trả lời các thắc mắc về lịch hẹn. Bạn cần tư vấn thông tin gì ạ?' 
};

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('luxe_chat_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          setMessages(parsed);
        }
      } catch (err) {
        console.error('Error parsing chat history:', err);
      }
    }
  }, []);

  // Save chat history to localStorage when messages change
  useEffect(() => {
    if (messages.length > 1 || (messages.length === 1 && messages[0].content !== WELCOME_MESSAGE.content)) {
      localStorage.setItem('luxe_chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  // Scroll to bottom smoothly on message update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMessage = { role: 'user', content: text.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages.slice(-10) }), // Keep last 10 messages for context
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'model', content: data.content }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', content: 'Dạ, hệ thống AI của em đang bận một chút. Anh/Chị có thể hỏi lại sau hoặc liên hệ hotline 0901 234 567 để được hỗ trợ tức thì ạ!' }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', content: 'Lỗi kết nối mạng. Quý khách vui lòng kiểm tra lại kết nối.' }]);
    }
    setLoading(false);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  const handleReset = () => {
    if (window.confirm('Bạn có muốn xóa toàn bộ lịch sử trò chuyện và bắt đầu lại không?')) {
      setMessages([WELCOME_MESSAGE]);
      localStorage.removeItem('luxe_chat_history');
    }
  };

  const handleChipClick = (chipText) => {
    handleSend(chipText);
  };

  // Custom parser to render basic markdown bold and bullet points safely as React elements
  const renderMessageContent = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const isListItem = line.trim().startsWith('- ') || line.trim().startsWith('* ');
      let content = line;
      if (isListItem) {
        content = line.trim().substring(2);
      }

      // Parse bold syntax **text**
      const parts = content.split(/(\*\*.*?\*\*)/g);
      const formattedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} style={{ color: '#8B6F47', fontWeight: '700' }}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (isListItem) {
        return (
          <div key={idx} style={{ display: 'flex', gap: '8px', paddingLeft: '6px', marginBottom: '6px', alignItems: 'flex-start' }}>
            <span style={{ color: '#D4AF37', fontSize: '11px', marginTop: '3px' }}>✦</span>
            <span style={{ flex: 1, fontSize: '13px', color: '#3D3830', lineHeight: '1.5' }}>{formattedLine}</span>
          </div>
        );
      }

      return (
        <p key={idx} style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#3D3830', lineHeight: '1.5', minHeight: line.trim() === '' ? '8px' : 'auto' }}>
          {formattedLine}
        </p>
      );
    });
  };

  const quickActionChips = [
    { label: '💆 Tư vấn giảm đau mỏi', text: 'Tôi bị đau đầu, mệt mỏi và đau vai gáy thì nên chọn gói dịch vụ nào?' },
    { label: '💄 Trang điểm dự tiệc', text: 'Tư vấn cho tôi dịch vụ trang điểm đi tiệc và trang điểm cô dâu' },
    { label: '💰 Gói rẻ nhất?', text: 'Dịch vụ nào của spa có mức giá rẻ nhất vậy?' },
    { label: '🎁 Khuyến mãi?', text: 'Hiện tại spa đang chạy những chương trình khuyến mãi nào?' },
    { label: '👥 Nhân viên', text: 'Đội ngũ chuyên viên làm việc tại spa gồm những ai?' }
  ];

  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000, fontFamily: 'var(--font-montserrat), sans-serif' }}>
      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #8B6F47, #D4AF37)',
          border: '2px solid rgba(255, 255, 255, 0.25)',
          color: 'white',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(139, 111, 71, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          outline: 'none',
        }}
      >
        {isOpen ? (
          <span style={{ fontSize: '20px', fontWeight: 'bold' }}>✕</span>
        ) : (
          <span style={{ fontSize: '26px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}>💬</span>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            style={{
              position: 'absolute',
              bottom: '80px',
              right: '0',
              width: '380px',
              maxWidth: '92vw',
              height: '520px',
              background: 'rgba(253, 251, 247, 0.96)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              boxShadow: '0 16px 48px rgba(45, 42, 38, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #2D2A26, #3D3830)',
              padding: '16px 20px',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1.5px solid rgba(212, 175, 55, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #8B6F47, #D4AF37)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)'
                }}>✨</div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', letterSpacing: '0.5px', color: '#D4AF37' }}>Luxe AI Consultant</h4>
                  <span style={{ fontSize: '11px', color: '#B8B0A0', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2ecc71', display: 'inline-block' }}></span> Trực tuyến
                  </span>
                </div>
              </div>
              <button 
                onClick={handleReset}
                title="Làm mới trò chuyện"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(212, 175, 55, 0.25)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: '#D4AF37',
                  fontSize: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  outline: 'none'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(212, 175, 55, 0.15)';
                  e.currentTarget.style.transform = 'rotate(180deg)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.transform = 'rotate(0deg)';
                }}
              >
                ↺
              </button>
            </div>

            {/* Chat Body */}
            <div
              ref={scrollRef}
              style={{
                flex: 1,
                padding: '20px 18px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                background: 'linear-gradient(180deg, #FDFBF8, #F7F4EE)'
              }}
            >
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    background: msg.role === 'user' ? 'linear-gradient(135deg, #8B6F47, #A18256)' : '#FFFFFF',
                    color: msg.role === 'user' ? 'white' : '#2D2A26',
                    padding: '12px 16px',
                    borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    fontSize: '13px',
                    boxShadow: msg.role === 'user' ? '0 4px 15px rgba(139, 111, 71, 0.15)' : '0 4px 15px rgba(0,0,0,0.03)',
                    border: msg.role === 'user' ? 'none' : '1px solid rgba(212, 175, 55, 0.15)',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {msg.role === 'user' ? (
                    <p style={{ margin: 0, lineHeight: '1.5' }}>{msg.content}</p>
                  ) : (
                    renderMessageContent(msg.content)
                  )}
                </motion.div>
              ))}

              {/* Quick Action Chips container (only shown when conversation starts) */}
              {messages.length === 1 && !loading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', padding: '0 4px' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#8B8579', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    💡 Gợi ý câu hỏi:
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {quickActionChips.map((chip, idx) => (
                      <motion.button
                        key={idx}
                        whileHover={{ scale: 1.03, backgroundColor: 'rgba(212, 175, 55, 0.08)', borderColor: '#D4AF37' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleChipClick(chip.text)}
                        style={{
                          background: '#FFFFFF',
                          border: '1.5px solid rgba(212, 175, 55, 0.25)',
                          borderRadius: '20px',
                          padding: '8px 14px',
                          fontSize: '12px',
                          color: '#8B6F47',
                          fontWeight: '500',
                          cursor: 'pointer',
                          textAlign: 'left',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {chip.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {loading && (
                <div style={{
                  alignSelf: 'flex-start',
                  background: '#FFFFFF',
                  padding: '12px 18px',
                  borderRadius: '18px 18px 18px 4px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                  border: '1px solid rgba(212, 175, 55, 0.15)',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '12px', color: '#8B8579', fontWeight: '500' }}>AI đang soạn câu trả lời</span>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <motion.span
                        key={i}
                        animate={{ y: [0, -5, 0] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: i * 0.15,
                          ease: "easeInOut"
                        }}
                        style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          backgroundColor: '#D4AF37',
                          display: 'inline-block'
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input Footer */}
            <form
              onSubmit={handleFormSubmit}
              style={{
                padding: '14px 18px',
                borderTop: '1px solid rgba(212, 175, 55, 0.2)',
                background: '#FFFFFF',
                display: 'flex',
                gap: '10px',
                alignItems: 'center'
              }}
            >
              <input
                type="text"
                placeholder="Nhập câu hỏi của bạn tại đây..."
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={loading}
                style={{
                  flex: 1,
                  border: '1px solid rgba(212, 175, 55, 0.25)',
                  borderRadius: '24px',
                  padding: '10px 18px',
                  fontSize: '13px',
                  outline: 'none',
                  background: '#FDFBF9',
                  color: '#2D2A26',
                  transition: 'all 0.25s'
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#D4AF37';
                  e.target.style.boxShadow = '0 0 8px rgba(212, 175, 55, 0.15)';
                  e.target.style.background = '#FFFFFF';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(212, 175, 55, 0.25)';
                  e.target.style.boxShadow = 'none';
                  e.target.style.background = '#FDFBF9';
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                style={{
                  background: 'linear-gradient(135deg, #8B6F47, #D4AF37)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  opacity: input.trim() && !loading ? 1 : 0.6,
                  transition: 'all 0.2s',
                  boxShadow: input.trim() && !loading ? '0 3px 10px rgba(139, 111, 71, 0.25)' : 'none',
                  outline: 'none'
                }}
                onMouseEnter={e => {
                  if (input.trim() && !loading) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>➔</span>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
