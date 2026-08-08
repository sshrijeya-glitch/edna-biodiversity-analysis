import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import SampleList from './pages/SampleList'
import CreateSample from './pages/CreateSample'
import SampleDetail from './pages/SampleDetail'
import AnalysisRunner from './pages/AnalysisRunner'
import Results from './pages/Results'
import Species from './pages/Species'
import Biodiversity from './pages/Biodiversity'
import UnknownClusters from './pages/UnknownClusters'
import Reports from './pages/Reports'
import EcosystemReport from './pages/EcosystemReport'
import NotFound from './pages/NotFound'

/**
 * Routing.
 *
 * The landing page sits outside AppLayout because it has its own dark chrome.
 * Everything else renders inside the sidebar + header shell.
 *
 * Route order matters: /samples/new is declared before /samples/:id so that
 * "new" is never read as a sample id.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/samples" element={<SampleList />} />
          <Route path="/samples/new" element={<CreateSample />} />
          <Route path="/samples/:id" element={<SampleDetail />} />

          <Route path="/analyze/:id" element={<AnalysisRunner />} />
          <Route path="/results/:id" element={<Results />} />
          <Route path="/species/:id" element={<Species />} />
          <Route path="/biodiversity/:id" element={<Biodiversity />} />
          <Route path="/unknown/:id" element={<UnknownClusters />} />
          <Route path="/report/:id" element={<EcosystemReport />} />
          <Route path="/reports" element={<Reports />} />

          <Route path="/index.html" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
