// ==================================================================
// Reactアプリケーションのエントリーポイント
// Entry point for the React application
// ==================================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css'; // グローバルスタイル
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Web Vitalsのレポート
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
