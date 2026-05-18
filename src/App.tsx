import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'
import { ProjectPlaceholder } from './pages/ProjectPlaceholder'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/project/:id" element={<ProjectPlaceholder />} />
      </Routes>
    </BrowserRouter>
  )
}
