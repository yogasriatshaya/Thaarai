import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Disable scroll wheel on number inputs globally
document.addEventListener('wheel', (e) => {
  if (e.target.type === 'number') {
    e.preventDefault();
  }
}, { passive: false });

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)
