import React from 'react';
import ReactDOM from 'react-dom/client';
// Import base CSS file which imports all other CSS files
import './styles/base.css';
import App from './App.jsx';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
