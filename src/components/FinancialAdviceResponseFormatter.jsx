import { formatCOP } from '../services/movimientosService';
import './FinancialAdvisorChat.css';

function formatPercent(value) {
  const number = Number(value || 0);
  return `${number.toLocaleString('es-CO', { maximumFractionDigits: 1 })}%`;
}

function statusLabel(status) {
  const map = {
    POSITIVE: 'Buen ritmo',
    BALANCED: 'Balanceado',
    ATTENTION: 'Para revisar',
    RISK: 'Riesgo',
    GOOD: 'Bien',
    INFO: 'Info',
    WARNING: 'Alerta',
    OK: 'Controlado',
    WATCH: 'Vigilar',
    OVERSPENT: 'Excedido',
  };

  return map[status] || 'Análisis';
}

function iconClass(icon) {
  const map = {
    savings: 'bi-piggy-bank',
    alert: 'bi-exclamation-triangle',
    chart: 'bi-graph-up-arrow',
    budget: 'bi-wallet2',
    movement: 'bi-arrow-left-right',
  };

  return map[icon] || 'bi-stars';
}

function priorityLabel(priority) {
  const map = {
    HIGH: 'Alta',
    MEDIUM: 'Media',
    LOW: 'Baja',
  };

  return map[priority] || 'Media';
}

export default function FinancialAdviceResponseFormatter({ advice }) {
  if (!advice) return null;

  const netIsPositive = Number(advice.monthlyNet || 0) >= 0;

  return (
    <div className="ai-response-formatter">
      <div className="ai-response-hero">
        <div>
          <div className="ai-response-kicker">Análisis del mes</div>
          <h3>{advice.headline || 'Recomendaciones financieras'}</h3>
          <p>{advice.summary}</p>
        </div>
        <span className={`ai-health-pill ai-health-pill--${advice.healthStatus || 'BALANCED'}`}>
          {statusLabel(advice.healthStatus)}
        </span>
      </div>

      <div className="ai-mini-grid">
        <div className="ai-mini-card">
          <span>Ingresos</span>
          <strong>{formatCOP(advice.monthlyIncome)}</strong>
        </div>
        <div className="ai-mini-card">
          <span>Gastos</span>
          <strong>{formatCOP(advice.monthlyExpense)}</strong>
        </div>
        <div className="ai-mini-card">
          <span>Balance</span>
          <strong className={netIsPositive ? 'ai-positive' : 'ai-negative'}>
            {netIsPositive ? '' : '- '}{formatCOP(Math.abs(Number(advice.monthlyNet || 0)))}
          </strong>
        </div>
        <div className="ai-mini-card">
          <span>Ahorro</span>
          <strong className={Number(advice.savingsRate || 0) >= 0 ? 'ai-positive' : 'ai-negative'}>
            {formatPercent(advice.savingsRate)}
          </strong>
        </div>
      </div>

      {Array.isArray(advice.alerts) && advice.alerts.length > 0 && (
        <div className="ai-alert-list">
          {advice.alerts.map((alert, index) => (
            <div className="ai-alert-item" key={`${alert}-${index}`}>
              <i className="bi bi-exclamation-circle" />
              <span>{alert}</span>
            </div>
          ))}
        </div>
      )}

      {Array.isArray(advice.insights) && advice.insights.length > 0 && (
        <section className="ai-section-block">
          <div className="ai-section-title">Hallazgos importantes</div>
          <div className="ai-insights-list">
            {advice.insights.map((item, index) => (
              <article className={`ai-insight-card ai-insight-card--${item.severity || 'INFO'}`} key={`${item.title}-${index}`}>
                <div className="ai-insight-icon">
                  <i className={`bi ${iconClass(item.icon)}`} />
                </div>
                <div>
                  <div className="ai-insight-topline">
                    <strong>{item.title}</strong>
                    <span>{statusLabel(item.severity)}</span>
                  </div>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {Array.isArray(advice.categoryRecommendations) && advice.categoryRecommendations.length > 0 && (
        <section className="ai-section-block">
          <div className="ai-section-title">Categorías para revisar</div>
          <div className="ai-category-list">
            {advice.categoryRecommendations.map((category, index) => (
              <article className="ai-category-card" key={`${category.categoryName}-${index}`}>
                <div className="ai-category-head">
                  <div>
                    <strong>{category.categoryName}</strong>
                    <span>{formatCOP(category.currentAmount)} · {formatPercent(category.percentage)}</span>
                  </div>
                  <span className={`ai-category-status ai-category-status--${category.status || 'OK'}`}>
                    {statusLabel(category.status)}
                  </span>
                </div>
                <p>{category.diagnosis}</p>
                <div className="ai-category-action">
                  <i className="bi bi-lightbulb" />
                  <span>{category.recommendation}</span>
                </div>
                {Number(category.suggestedLimit || 0) > 0 && (
                  <div className="ai-suggested-limit">
                    Límite sugerido: <strong>{formatCOP(category.suggestedLimit)}</strong>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {Array.isArray(advice.actionItems) && advice.actionItems.length > 0 && (
        <section className="ai-section-block">
          <div className="ai-section-title">Plan de acción</div>
          <div className="ai-actions-list">
            {advice.actionItems.map((action, index) => (
              <article className="ai-action-card" key={`${action.title}-${index}`}>
                <div className="ai-action-index">{index + 1}</div>
                <div>
                  <div className="ai-action-title-row">
                    <strong>{action.title}</strong>
                    <span>{priorityLabel(action.priority)}</span>
                  </div>
                  <p>{action.description}</p>
                  <small>{action.estimatedImpact}</small>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {advice.disclaimer && (
        <div className="ai-disclaimer">
          {advice.disclaimer}
        </div>
      )}
    </div>
  );
}
