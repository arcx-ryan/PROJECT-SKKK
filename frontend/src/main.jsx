import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';

window.addEventListener('error', (event) => {
  const root = document.getElementById('root');
  if (root && !root.hasAttribute('data-app-rendered')) {
    root.innerHTML = '<div style="padding:2rem;font:16px Arial,sans-serif;color:#8B2E2E">Aplikasi gagal dimuat. Perbarui Safe Exam Browser atau hubungi administrator.</div>';
  }
  console.error(event.error || event.message);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

document.getElementById('root').setAttribute('data-app-rendered', 'true');
