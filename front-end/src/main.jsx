import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { ConfigProvider } from 'antd'
import { installThemeVariables, wellnessTheme } from './theme/tokens.js'
import './index.css'

installThemeVariables();
ConfigProvider.config({
  holderRender: children => <ConfigProvider theme={wellnessTheme}>{children}</ConfigProvider>,
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider theme={wellnessTheme}>
      <App />
    </ConfigProvider>
  </StrictMode>,
)
