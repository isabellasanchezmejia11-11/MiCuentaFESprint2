import { useNavigate } from 'react-router-dom';
import './Reportes.css';

export default function Reportes() {
  const navigate = useNavigate();

  return (
    <div className="reportes-container">
      <div className="reportes-content">
        <h1 className="reportes-title">EN CONSTRUCCIÓN</h1>
        <p className="reportes-message">Estamos trabajando en esta sección. Por favor, vuelva más tarde.</p>
        <button 
          className="reportes-btn-volver"
          onClick={() => navigate('/dashboard')}
        >
          Volver al Inicio
        </button>
      </div>
    </div>
  );
}
