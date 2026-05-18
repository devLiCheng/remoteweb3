import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import JobList from './pages/JobList';
import JobEdit from './pages/JobEdit';
import CompanyList from './pages/CompanyList';
import CompanyEdit from './pages/CompanyEdit';
import TagManagement from './pages/TagManagement';
import Settings from './pages/Settings';
import Login from './pages/Login';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="jobs" element={<JobList />} />
        <Route path="jobs/new" element={<JobEdit />} />
        <Route path="jobs/:id/edit" element={<JobEdit />} />
        <Route path="companies" element={<CompanyList />} />
        <Route path="companies/new" element={<CompanyEdit />} />
        <Route path="companies/:id/edit" element={<CompanyEdit />} />
        <Route path="tags" element={<TagManagement />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
