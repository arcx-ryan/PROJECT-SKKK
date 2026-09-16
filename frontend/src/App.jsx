import { Routes, Route } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import GuruDashboard from './pages/guru/GuruDashboard';
import SiswaDashboard from './pages/siswa/SiswaDashboard';
import UjianPage from './pages/siswa/UjianPage';
import HasilPage from './pages/siswa/HasilPage';
import CompleteProfilePage from './pages/siswa/CompleteProfilePage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/profil"
        element={
          <ProtectedRoute allowedRoles={['admin', 'guru']}>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/guru/*"
        element={
          <ProtectedRoute allowedRoles={['guru']}>
            <GuruDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/siswa"
        element={
          <ProtectedRoute allowedRoles={['siswa']}>
            <SiswaDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/siswa/lengkapi-profil"
        element={
          <ProtectedRoute allowedRoles={['siswa']}>
            <CompleteProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/siswa/ujian/:id"
        element={
          <ProtectedRoute allowedRoles={['siswa']}>
            <UjianPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/siswa/hasil/:id"
        element={
          <ProtectedRoute allowedRoles={['siswa']}>
            <HasilPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Welcome />} />
    </Routes>
  );
}
