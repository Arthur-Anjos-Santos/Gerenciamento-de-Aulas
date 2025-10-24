import { ThemeToggle } from './ThemeToggle';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Navbar() {
  const { profile: p, isAdminOrInstructor: canManage, logout } = useAuth();
  const nav = useNavigate();

  const isInstructorOnly =
    Array.isArray(p?.groups) && p?.groups.includes('instructor') && !p?.groups.includes('admin');

  const initials = (p?.username || 'U').slice(0, 2).toUpperCase();

  return (
    <header className="w-full border-b p-4 flex items-center justify-between bg-background">
      <div className="flex items-center gap-4">
        <Link to="/" className="font-semibold">EduCAT</Link>
        <nav className="hidden sm:flex items-center gap-3 text-sm">
          <Link to="/">Dashboard</Link>
          {!isInstructorOnly && <Link to="/enrollments">Inscrições</Link>}
          {canManage && <Link to="/classes/new">Nova Aula</Link>}
        </nav>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="outline-none" aria-label="Abrir menu do usuário">
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={p?.avatar_url || ''}
                  alt={p?.username || 'user'}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '';
                  }}
                />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="truncate">{p?.username}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => nav('/profile')}>
              Editar Informações de usuário
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                logout();
                nav('/login');
              }}
            >
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
