import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { DataProvider } from './context/DataContext.tsx'
import { TaskEditProvider } from './context/TaskEditContext.tsx'
import { ToastProvider } from './context/ToastContext.tsx'
import { initTheme, ThemeProvider } from './lib/theme.tsx'
import './index.css'

initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <TaskEditProvider>
              <App />
            </TaskEditProvider>
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
)
