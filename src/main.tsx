// main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client'; // Import createRoot
import App from './App';

// Get the root element
const rootElement = document.getElementById('root');

// Use createRoot to render the app
const root = createRoot(rootElement!); // '!' assumes rootElement exists
root.render(<App />);