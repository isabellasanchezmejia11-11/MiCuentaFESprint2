import { useEffect, useRef, useState } from 'react';
import FinancialAdviceResponseFormatter from './FinancialAdviceResponseFormatter';
import { getFinancialAdvice } from '../services/financialAdvisorService';
import './FinancialAdvisorChat.css';

export default function FinancialAdvisorChat() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState(null);
  const [error, setError] = useState('');
  const panelRef = useRef(null);

  async function loadAdvice(force = false) {
    if (loading) return;
    if (advice && !force) return;

    try {
      setLoading(true);
      setError('');
      const response = await getFinancialAdvice();
      setAdvice(response);
    } catch (err) {
      setError(err.message || 'No pude generar la recomendación en este momento.');
    } finally {
      setLoading(false);
    }
  }

  function handleOpen() {
    setOpen(true);
    loadAdvice(false);
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (!open) return;
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        const isButton = event.target.closest?.('.ai-floating-button');
        if (!isButton) setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="ai-chat-root">
      {open && (
        <div className="ai-chat-panel" ref={panelRef}>
          <div className="ai-chat-header">
            <div className="ai-chat-agent">
              <div className="ai-chat-avatar">
                <i className="bi bi-stars" />
              </div>
              <div>
                <div className="ai-chat-title">Asesor financiero</div>
                <div className="ai-chat-subtitle">Powered by Gemini</div>
              </div>
            </div>
            <button className="ai-chat-close" onClick={() => setOpen(false)} aria-label="Cerrar asesor financiero">
              <i className="bi bi-x-lg" />
            </button>
          </div>

          <div className="ai-chat-body">
            <div className="ai-chat-message ai-chat-message--user">
              Analiza mis gastos, categorías, presupuestos y movimientos del mes.
            </div>

            <div className="ai-chat-message ai-chat-message--assistant">
              {loading && (
                <div className="ai-loading-box">
                  <div className="ai-loader" />
                  <div>
                    <strong>Estoy revisando tus finanzas...</strong>
                    <span>Buscando patrones y oportunidades de ahorro.</span>
                  </div>
                </div>
              )}

              {!loading && error && (
                <div className="ai-error-box">
                  <i className="bi bi-exclamation-triangle" />
                  <div>
                    <strong>No se pudo generar el análisis</strong>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {!loading && !error && advice && (
                <FinancialAdviceResponseFormatter advice={advice} />
              )}
            </div>
          </div>

          <div className="ai-chat-footer">
            <button className="ai-refresh-button" onClick={() => loadAdvice(true)} disabled={loading}>
              <i className="bi bi-arrow-clockwise" />
              Actualizar recomendación
            </button>
          </div>
        </div>
      )}

      <button
        className={`ai-floating-button ${open ? 'ai-floating-button--open' : ''}`}
        onClick={open ? () => setOpen(false) : handleOpen}
        aria-label="Abrir asesor financiero con IA"
        title="Asesor financiero con IA"
      >
        <i className={`bi ${open ? 'bi-x-lg' : 'bi-stars'}`} />
      </button>
    </div>
  );
}
