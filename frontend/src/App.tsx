import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoadingScreen from './components/LoadingScreen';

const HomePage = lazy(() => import('./pages/HomePage'));
const JobsPage = lazy(() => import('./pages/JobsPage'));
const JobDetailPage = lazy(() => import('./pages/JobDetailPage'));
const CompaniesPage = lazy(() => import('./pages/CompaniesPage'));
const CompanyDetailPage = lazy(() => import('./pages/CompanyDetailPage'));

export default function App() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <Navbar />
      <main>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/jobs/:id" element={<JobDetailPage />} />
            <Route path="/companies" element={<CompaniesPage />} />
            <Route path="/companies/:slug" element={<CompanyDetailPage />} />
            <Route path="/:locale" element={<HomePage />} />
            <Route path="/:locale/jobs" element={<JobsPage />} />
            <Route path="/:locale/jobs/:id" element={<JobDetailPage />} />
            <Route path="/:locale/companies" element={<CompaniesPage />} />
            <Route path="/:locale/companies/:slug" element={<CompanyDetailPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
