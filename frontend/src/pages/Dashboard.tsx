import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Clock, BookOpen, User, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getClasses, deleteClass, ClassItem } from '../api/classes';
import Navbar from '../components/Layout/Navbar';
import Container from '../components/Layout/Container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../store/auth';
import { toast } from 'sonner';

const Dashboard = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAdminOrInstructor: canManage } = useAuth();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const data = await getClasses();
        setClasses(data);
      } catch (err: any) {
        setError(err?.response?.data?.detail || 'Erro ao carregar aulas');
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const isClassOpen = (dateString: string) => {
    return new Date(dateString) > new Date();
  };

  const onDelete = async (id: number) => {
    if (!confirm('Excluir esta aula? Esta ação é irreversível.')) return;
    try {
      await deleteClass(id);
      setClasses((prev) => prev.filter((x) => x.id !== id));
      toast.success('Aula excluída com sucesso.');
    } catch (e: any) {
      const msg = e?.response?.data?.detail || 'Erro ao excluir aula';
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Container>
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-6 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container>
        <div className="space-y-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-primary" />
                Aulas
              </h1>
              <p className="text-muted-foreground mt-2">Gerencie suas aulas e inscrições</p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {classes.length === 0 ? (
            <EmptyState
              title="Nenhuma aula encontrada"
              description="Comece criando sua primeira aula"
              action={
                canManage ? (
                  <Button onClick={() => navigate('/classes/new')} size="lg" className="gap-2">
                    <Plus className="h-5 w-5" />
                    Criar Primeira Aula
                  </Button>
                ) : null
              }
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {classes.map((c) => (
                <Card
                  key={c.id}
                  className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="cursor-pointer" onClick={() => navigate(`/classes/${c.id}`)}>
                      <h3 className="font-semibold text-xl text-foreground group-hover:text-primary transition-colors">
                        {c.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {c.description}
                      </p>
                    </div>
                    <Badge variant={isClassOpen(c.start_datetime) ? 'success' : 'destructive'}>
                      {isClassOpen(c.start_datetime) ? 'Aberta' : 'Fechada'}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(c.start_datetime).split(' às ')[0]}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(c.start_datetime).split(' às ')[1]}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="h-4 w-4" />
                      <span>Instrutor: {c.instructor_username ?? '—'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      <span>Inscritos: {c.participants_count ?? 0}</span>
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={() => navigate(`/classes/${c.id}?edit=1`)}>Editar</Button>
                      <Button variant="outline" onClick={() => navigate(`/classes/${c.id}?add=students`)}>Adicionar Alunos</Button>
                      <Button variant="destructive" onClick={() => onDelete(c.id)}>Excluir</Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </Container>
    </>
  );
};

export default Dashboard;
