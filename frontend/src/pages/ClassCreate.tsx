import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Layout/Navbar';
import Container from '../components/Layout/Container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createClass } from '../api/classes';
import { searchInstructors, InstructorLite } from '../api/instructors';
import { toast } from 'sonner';
import { useAuth } from '../store/auth';

const ClassCreate = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [description, setDescription] = useState('');
  const [instructors, setInstructors] = useState<InstructorLite[]>([]);
  const [instructorId, setInstructorId] = useState<number | ''>('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { profile, isAdminOrInstructor } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const list = await searchInstructors('');
        setInstructors(list);
      } catch {
        setInstructors([]);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (
      isAdminOrInstructor &&
      profile &&
      instructors.length &&
      instructors.some((i) => i.id === profile.id)
    ) {
      setInstructorId(profile.id);
    }
  }, [isAdminOrInstructor, profile, instructors]);

  const toISO = (val: string) => {
    if (!val) return '';
    const d = new Date(val);
    return d.toISOString();
  };

  const onSubmit = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const payload: any = { title, description, start_datetime: toISO(start) };
      if (instructorId) payload.instructor = instructorId;
      const created = await createClass(payload);
      toast.success('Aula criada com sucesso.');
      navigate(`/classes/${created.id}`, { replace: true });
    } catch (e: any) {
      const msg = e?.response?.data?.detail || 'Erro ao criar aula';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar />
      <Container>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Nova Aula</h1>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Título</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="text-sm">Data e Hora</label>
                <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="text-sm">Instrutor</label>
              <select
                className="w-full border rounded-md h-10 px-3 text-sm bg-background"
                value={instructorId}
                onChange={(e) => setInstructorId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Selecionar</option>
                {instructors.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.username}{[i.first_name, i.last_name].filter(Boolean).length ? ` — ${[i.first_name, i.last_name].filter(Boolean).join(' ')}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm">Descrição</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="flex gap-2">
              <Button onClick={onSubmit} disabled={saving}>Criar</Button>
              <Button variant="outline" onClick={() => navigate('/')}>Cancelar</Button>
            </div>
          </Card>
        </div>
      </Container>
    </>
  );
};

export default ClassCreate;
