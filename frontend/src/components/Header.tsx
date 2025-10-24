import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../store/auth';

export default function Header() {
  const { profile: p, isAdminOrInstructor: canCreate } = useAuth();
  const loc = useLocation();
  return (
    <header className="w-full border-b p-4 flex items-center justify-between">
      <Link to="/">Dashboard</Link>
      <nav className="flex items-center gap-4">
        {canCreate && <Link to="/classes/new">Nova Aula</Link>}
        <span>{p?.username}</span>
      </nav>
    </header>
  );
}
