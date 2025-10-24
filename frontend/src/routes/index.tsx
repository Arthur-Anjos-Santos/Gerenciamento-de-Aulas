import { Route, Routes, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AdminOrInstructorRoute from './AdminOrInstructorRoute';
import Dashboard from '../pages/Dashboard';
import ClassCreate from '../pages/ClassCreate';
import ClassDetail from '../pages/ClassDetail';
import Enrollments from '../pages/Enrollments';
import Login from '../pages/Login';
import NotFound from '../pages/NotFound';
import Profile from '../pages/Profile';

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/classes/new" element={<AdminOrInstructorRoute><ClassCreate /></AdminOrInstructorRoute>} />
    <Route path="/classes/:id" element={<ProtectedRoute><ClassDetail /></ProtectedRoute>} />
    <Route path="/enrollments" element={<ProtectedRoute><Enrollments /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    <Route path="/home" element={<Navigate to="/" replace />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;
