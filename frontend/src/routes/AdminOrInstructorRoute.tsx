import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/auth';

type Props = { children: JSX.Element };

export default function AdminOrInstructorRoute({ children }: Props) {
  const { isAuthenticated, isAdminOrInstructor, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Carregando...
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdminOrInstructor) return <Navigate to="/" replace />;
  return children;
}
