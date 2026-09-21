import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ColorThemeProvider } from './theme/ColorThemeContext';
import { applyColorTheme, getInitialColorTheme } from './theme/palettes';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Wrap render in try-catch to handle initialization errors
try {
  const initialTheme = getInitialColorTheme();
  applyColorTheme(initialTheme);
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ColorThemeProvider initialTheme={initialTheme}>
        <App />
      </ColorThemeProvider>
    </React.StrictMode>
  );
} catch (error) {
  console.error('Failed to render app:', error);
  // Fallback: try to render error message
  rootElement.innerHTML = '<div style="padding: 20px; color: red;">Application failed to load. Please refresh the page.</div>';
}

