import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { ConfigProvider } from 'antd'
import thTH from 'antd/locale/th_TH'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import moment from 'moment'
import 'moment/locale/th'
import { installThemeVariables, wellnessTheme } from './theme/tokens.js'
import './index.css'

installThemeVariables();
dayjs.locale('th')
moment.locale('th')
ConfigProvider.config({
  holderRender: children => <ConfigProvider locale={thTH} theme={wellnessTheme}>{children}</ConfigProvider>,
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider locale={thTH} theme={wellnessTheme}>
      <App />
    </ConfigProvider>
  </StrictMode>,
)
