import React from 'react';
import ReactDOM from 'react-dom/client';
import { Theme } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Theme appearance="dark" accentColor="iris" grayColor="slate" panelBackground="translucent" radius="large" scaling="95%">
      <App />
    </Theme>
  </React.StrictMode>
);
