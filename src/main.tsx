import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/App.tsx'

import '@/index.css'
import { validateAllEnvVars } from '@utils/env'

// 在应用启动时验证环境变量
const envValidation = validateAllEnvVars()
if (!envValidation.isValid) {
  const errorMessage = envValidation.error || '环境变量配置错误'
  console.error('❌ 环境变量验证失败:', errorMessage)
  console.error(
    '请检查 .env 文件，确保已配置所有必需的环境变量。参考 ENV_SETUP.md 获取配置说明。',
  )
  
  // 在开发环境下显示更详细的错误信息
  if (import.meta.env.DEV) {
    document.body.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        font-family: system-ui, -apple-system, sans-serif;
        padding: 2rem;
        text-align: center;
        background: #f5f5f5;
      ">
        <h1 style="color: #ff4d4f; margin-bottom: 1rem;">环境变量配置错误</h1>
        <p style="color: #666; margin-bottom: 0.5rem;">${errorMessage}</p>
        <p style="color: #999; font-size: 0.9rem;">
          请检查 .env 文件，确保已配置所有必需的环境变量。<br/>
          参考 ENV_SETUP.md 获取配置说明。
        </p>
      </div>
    `
  } else {
    // 生产环境下显示简洁的错误信息
    document.body.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        font-family: system-ui, -apple-system, sans-serif;
        color: #ff4d4f;
      ">
        <h1>配置错误，请联系管理员</h1>
      </div>
    `
  }
} else {
  // 环境变量验证通过，正常启动应用
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
