import React from 'react';
import {
  Capacitor,
  SystemBars,
  SystemBarsStyle,
} from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

if (Capacitor.isNativePlatform()) {
  Promise.allSettled([
    SystemBars.setStyle({ style: SystemBarsStyle.Dark }),
    StatusBar.setStyle({ style: Style.Dark }),
  ]).catch((error) => {
    console.warn('Could not configure Android system bars:', error);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
