import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { CircularProgress, Box } from '@mui/material';
import { MainLayout } from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ProposalList = lazy(() => import('./pages/ProposalList'));
const ProposalBuilder = lazy(() => import('./pages/ProposalBuilder'));
const RfpAnalysis = lazy(() => import('./pages/RfpAnalysis'));
const RfpUpload = lazy(() => import('./pages/RfpUpload'));
const RfpDetails = lazy(() => import('./pages/RfpDetails'));
const ContentLibrary = lazy(() => import('./pages/ContentLibrary'));
const Settings = lazy(() => import('./pages/Settings'));
const TestProposalBuilder = lazy(() => import('./pages/TestProposalBuilder'));

const LoadingFallback = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
  >
    <CircularProgress />
  </Box>
);

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Auth routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/proposals" element={<ProposalList />} />
              <Route path="/proposals/:id/builder" element={<ProposalBuilder />} />
              <Route path="/rfp-analysis" element={<RfpAnalysis />} />
              <Route path="/rfps/upload" element={<RfpUpload />} />
              <Route path="/rfps/:id" element={<RfpDetails />} />
              <Route path="/content-library" element={<ContentLibrary />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/test-proposal" element={<TestProposalBuilder />} />
            </Route>
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;