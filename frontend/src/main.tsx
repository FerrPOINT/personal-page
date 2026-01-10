import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Suppress React DevTools Activity error in production
if (process.env.NODE_ENV === 'production') {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    if (args[0]?.includes?.('Activity') || args[0]?.includes?.('Cannot set properties of undefined')) {
      return; // Suppress Activity-related errors in production
    }
    originalError.apply(console, args);
  };
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

