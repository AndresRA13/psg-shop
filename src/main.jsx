import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { HashRouter } from 'react-router-dom'
import { PayPalScriptProvider } from '@paypal/react-paypal-js'

const paypalOptions = {
  'client-id': 'AdgxAW2HZC5B-yzBWZKimJnJH8W5r-PwL5_lppQOw1w43p_mlpg5FzCDl2trocXC23YuwZhhjyiJIOEf',
  currency: 'USD',
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