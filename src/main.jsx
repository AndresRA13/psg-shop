import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { HashRouter } from 'react-router-dom'
import { PayPalScriptProvider } from '@paypal/react-paypal-js'

const paypalOptions = {
  'client-id': 'ECmX0zT4f25SE12Wz3vY6RNnLLG1iK_uOE1UvckTz5o2Pn9DhFtVpeKOBvJSLGu1MpPYduxBNjUWPKwP',
  currency: 'COP',
  intent: 'capture'
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PayPalScriptProvider options={paypalOptions}>
      <HashRouter>
        <App />
      </HashRouter>
    </PayPalScriptProvider>
  </StrictMode>,
)