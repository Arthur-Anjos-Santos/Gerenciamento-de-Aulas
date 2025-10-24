import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../store/auth';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await login(username.trim(), password);
      toast.success('Login realizado!');
      navigate('/', { replace: true });
    } catch (err: any) {
      const status = err?.response?.status;
      const url = err?.config?.url || '';
      let msg = 'Ocorreu um erro inesperado.';
      if (url.includes('/api/auth/login/') && (status === 400 || status === 401)) {
        msg = 'Usuário ou senha inválidos.';
      } else if (!err?.response) {
        msg = 'Não foi possível conectar ao servidor.';
      } else {
        msg = err?.response?.data?.detail || msg;
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="w-full max-w-sm rounded-2xl border p-6 shadow-sm bg-background">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="h-6 w-6" />
          <h1 className="text-xl font-semibold">Entrar</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username">Usuário</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
