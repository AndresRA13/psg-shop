import React from 'react';
import './Loader.css';

const Loader = ({ text = 'Cargando...', size = 'md' }) => {
  return (
    <div className="loader-container">
      <span className={`loader ${size === 'lg' ? 'loader-lg' : ''}`}></span>
      {text && <span className="loader-text">{text}</span>}
    </div>
  );
};

export default Loader;