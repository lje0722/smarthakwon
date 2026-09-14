import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { RequestProvider } from './requests/RequestContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RequestProvider>
      <App />
    </RequestProvider>
  </StrictMode>,
);
