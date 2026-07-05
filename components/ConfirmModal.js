'use client';
import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [confirmState, setConfirmState] = useState(null);

  const confirm = useCallback((message, title) => {
    return new Promise((resolve) => {
      setConfirmState({ message, title: title || 'Xác nhận', resolve });
    });
  }, []);

  const handleConfirm = () => {
    confirmState?.resolve(true);
    setConfirmState(null);
  };

  const handleCancel = () => {
    confirmState?.resolve(false);
    setConfirmState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AnimatePresence>
        {confirmState && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }} onClick={handleCancel}>
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '400px',
                width: '90%',
                boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
                textAlign: 'center',
              }}
            >
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #f5c6cb, #f8d7da)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '20px', fontWeight: '700', color: '#9b2226',
              }}>?</div>
              <h3 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '20px', marginBottom: '10px', color: '#2D2A26' }}>
                {confirmState.title}
              </h3>
              <p style={{ fontSize: '14px', color: '#8B8579', lineHeight: 1.6, marginBottom: '25px' }}>
                {confirmState.message}
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCancel}
                  style={{
                    padding: '10px 28px', borderRadius: '10px', border: '1px solid #E5E0D8',
                    background: 'white', color: '#8B8579', cursor: 'pointer',
                    fontWeight: '600', fontSize: '14px', fontFamily: 'var(--font-montserrat), sans-serif',
                  }}
                >
                  Huỷ
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleConfirm}
                  style={{
                    padding: '10px 28px', borderRadius: '10px', border: 'none',
                    background: 'linear-gradient(135deg, #9b2226, #c0392b)',
                    color: 'white', cursor: 'pointer',
                    fontWeight: '600', fontSize: '14px', fontFamily: 'var(--font-montserrat), sans-serif',
                  }}
                >
                  Xác nhận
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
