import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'import Landing from './Landing'
import Dashboard from './Dashboard'
import SampleList from './SampleList'
import CreateSample from './CreateSample'
import SampleDetail from './SampleDetail'
import AnalysisRunner from './AnalysisRunner'
import Results from './Results'
import Species from './Species'
import Biodiversity from './Biodiversity'
import UnknownClusters from './UnknownClusters'
import Reports from './Reports'
import EcosystemReport from './EcosystemReport'
import NotFound from './NotFound'

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
