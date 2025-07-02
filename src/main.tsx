import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { setupGlobalErrorHandler } from './utils/errorHandler'

// Setup global error handler first thing
setupGlobalErrorHandler();

createRoot(document.getElementById('root')!).render(
  <App />
)
