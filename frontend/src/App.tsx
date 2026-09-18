import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './features/auth/LoginPage'
import { RegisterPage } from './features/auth/RegisterPage'
import { ChartPreview } from './features/preview/ChartPreview'
import { PreviewPage } from './features/preview/PreviewPage'
import { ReportsPlaceholder } from './features/reports/ReportsPlaceholder'
import { TaskListPage } from './features/tasks/TaskListPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/tasks" element={<TaskListPage />} />
          <Route path="/reports" element={<ReportsPlaceholder />} />
          {import.meta.env.DEV ? (
            <>
              <Route path="/preview" element={<PreviewPage />} />
              <Route path="/preview/charts" element={<ChartPreview />} />
            </>
          ) : null}
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/tasks" replace />} />
    </Routes>
  )
}
