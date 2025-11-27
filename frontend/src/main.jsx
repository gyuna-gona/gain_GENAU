import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReactDOM from 'react-dom/client';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render (
  <React.StrictMode>
    <QueryClientProvider client = {queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
)