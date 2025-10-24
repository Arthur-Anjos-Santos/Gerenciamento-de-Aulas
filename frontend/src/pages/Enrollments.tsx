import { useEffect, useState } from 'react';
import Navbar from '../components/Layout/Navbar';
import Container from '../components/Layout/Container';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { getEnrollments, EnrollmentItem } from '../api/enrollments';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const Enrollments = () => {
  const [items, setItems] = useState<EnrollmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getEnrollments();
        setItems(data);
      } catch (e: any) {
        setError(e?.response?.data?.detail || 'Erro ao carregar inscrições');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const fmt = (d?: string) => {
    if (!d) return '';
    try {
      return format(new Date(d), "d 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return d;
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Container>
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 mt-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6 space-y-3">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </Card>
            ))}
          </div>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container>
        <h1 className="text-3xl font-bold">Minhas Inscrições</h1>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 mt-6">
          {items.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhuma inscrição encontrada.</div>
          ) : (
            items.map((enr) => (
              <Card key={enr.id} className="p-6 flex items-center justify-between">
                <div>
                  <div className="font-semibold">
                    {enr.class_title || `Aula #${enr.class_id || enr.class_ref}`}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {fmt(enr.class_start_datetime)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => navigate(`/classes/${enr.class_id || enr.class_ref}`)}>
                    Ver detalhes
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </Container>
    </>
  );
};

export default Enrollments;
