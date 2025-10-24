import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Layout/Navbar';
import Container from '../components/Layout/Container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getClass, updateClass, deleteClass, ClassItem } from '../api/classes';
import { useAuth } from '../store/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  createEnrollment,
  deleteEnrollmentByClass,
  deleteEnrollmentByClassForStudent,
  getEnrollmentsByClass,
} from '../api/enrollments';
import { searchStudents, UserLite } from '../api/users';
import { searchInstructors, InstructorLite } from '../api/instructors';
import { toast } from 'sonner';

const ClassDetail = () => {
  const { id } = useParams();
  const klassId = Number(id);
  const navigate = useNavigate();

  const [klass, setKlass] = useState<ClassItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<Partial<ClassItem>>({});
  const [instructors, setInstructors] = useState<InstructorLite[]>([]);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserLite[]>([]);
  const [searching, setSearching] = useState(false);
  const [enrolledIds, setEnrolledIds] = useState<Set<number>>(new Set());

  const toLocalInputValue = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  };

  const fromLocalInputValue = (val: string) => {
    if (!val) return '';
    const d = new Date(val);
    return d.toISOString();
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getClass(klassId);
        setKlass(data);
        setForm({
          title: data.title,
          description: data.description,
          start_datetime: data.start_datetime,
          instructor: data.instructor ?? undefined,
        });
        const list = await searchInstructors('');
        setInstructors(list);
      } catch (e: any) {
        setError(e.response?.data?.detail || 'Erro ao carregar aula');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [klassId]);

  const { isAdminOrInstructor: canManage } = useAuth();
  const isEnrolled = !!klass?.enrolled && !canManage;

  const onSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const updated = await updateClass(klassId, form);
      setKlass(updated);
      setForm({
        title: updated.title,
        description: updated.description,
        start_datetime: updated.start_datetime,
        instructor: updated.instructor ?? undefined,
      });
      setError('');
      toast.success('Aula atualizada com sucesso.');
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Erro ao salvar aula');
      toast.error('Erro ao salvar aula.');
    } finally {
      setSaving(false);
    }
  };

  const onDeleteClass = async () => {
    if (!confirm('Excluir esta aula? Esta ação é irreversível.')) return;
    try {
      await deleteClass(klassId);
      toast.success('Aula excluída com sucesso.');
      navigate('/');
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Erro ao excluir aula');
      toast.error('Erro ao excluir aula.');
    }
  };

  const onSubscribe = async () => {
    try {
      await createEnrollment(klassId);
      setError('');
      toast.success('Inscrição realizada com sucesso.');
      navigate('/enrollments', { replace: true });
    } catch (e: any) {
      const msg = e?.response?.data?.detail || 'Erro ao adicionar aluno';
      setError(msg);
      toast.error(msg);
    }
  };

  const onUnsubscribe = async () => {
    try {
      await deleteEnrollmentByClass(klassId);
      setKlass((k) => (k ? { ...k, enrolled: false } as ClassItem : k));
      setError('');
      toast.success('Inscrição cancelada com sucesso.');
    } catch (e: any) {
      const msg = e?.response?.data?.detail || 'Erro ao cancelar inscrição';
      setError(msg);
      toast.error(msg);
    }
  };

  const loadEnrolledForClass = async () => {
    try {
      const rows = await getEnrollmentsByClass(klassId);
    const setIds = new Set<number>(rows.map((r) => r.student));
      setEnrolledIds(setIds);
    } catch {
      toast.error('Erro ao carregar inscritos da aula.');
    }
  };

  const loadAllStudents = async () => {
    setSearching(true);
    try {
      const list = await searchStudents('');
      setResults(list);
    } catch {
      toast.error('Erro ao buscar alunos.');
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (showAddPanel) {
      setQuery('');
      Promise.all([loadAllStudents(), loadEnrolledForClass()]);
    }
  }, [showAddPanel]);

  const doSearch = async () => {
    setSearching(true);
    try {
      const list = await searchStudents(query);
      setResults(list);
    } catch {
      toast.error('Erro ao buscar alunos.');
    } finally {
      setSearching(false);
    }
  };

  const enrollStudent = async (studentId: number) => {
    try {
      await createEnrollment(klassId, studentId);
      setEnrolledIds((prev) => new Set([...prev, studentId]));
      toast.success('Aluno inscrito com sucesso.');
    } catch (e: any) {
      const msg = e?.response?.data?.detail || 'Erro ao inscrever aluno';
      toast.error(msg);
    }
  };

  const unenrollStudent = async (studentId: number) => {
    try {
      await deleteEnrollmentByClassForStudent(klassId, studentId);
      setEnrolledIds((prev) => {
        const next = new Set(prev);
        next.delete(studentId);
        return next;
      });
      toast.success('Aluno desinscrito com sucesso.');
    } catch (e: any) {
      const msg = e?.response?.data?.detail || 'Erro ao desinscrever aluno';
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Container>
          <Skeleton className="h-10 w-64" />
          <Card className="p-6 mt-6 space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </Card>
        </Container>
      </>
    );
  }

  if (!klass) {
    return (
      <>
        <Navbar />
        <Container>
          <Alert variant="destructive">
            <AlertDescription>{error || 'Aula não encontrada'}</AlertDescription>
          </Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Aula #{klass.id}</h1>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Título</label>
                <Input
                  value={form.title || ''}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  disabled={!canManage}
                />
              </div>
              <div>
                <label className="text-sm">Data e Hora</label>
                <Input
                  type="datetime-local"
                  value={toLocalInputValue(form.start_datetime)}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, start_datetime: fromLocalInputValue(e.target.value) }))
                  }
                  disabled={!canManage}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Instrutor</label>
                <select
                  className="w-full border rounded-md h-10 px-3 text-sm bg-background"
                  value={form.instructor ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, instructor: e.target.value ? Number(e.target.value) : undefined }))
                  }
                  disabled={!canManage}
                >
                  <option value="">Selecionar</option>
                  {instructors.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.username}{[i.first_name, i.last_name].filter(Boolean).length ? ` — ${[i.first_name, i.last_name].filter(Boolean).join(' ')}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div />
            </div>

            <div>
              <label className="text-sm">Descrição</label>
              <Textarea
                value={form.description || ''}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                disabled={!canManage}
              />
            </div>

            {canManage && (
              <div className="flex gap-2">
                <Button onClick={onSave} disabled={saving}>Salvar</Button>
                <Button variant="destructive" onClick={onDeleteClass}>Excluir</Button>
              </div>
            )}
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Inscrição</h2>
            <p className="text-sm text-muted-foreground">Inscreve ou cancela a inscrição do usuário logado.</p>
            <div className="flex flex-wrap gap-2">
              {!canManage && !klass.enrolled && (
                <Button onClick={() => { createEnrollment(klassId).then(() => { toast.success('Inscrição realizada com sucesso.'); navigate('/enrollments', { replace: true }); }).catch((e:any)=>toast.error(e?.response?.data?.detail||'Erro ao adicionar aluno')); }}>Inscrever-se nesta aula</Button>
              )}
              {!canManage && klass.enrolled && (
                <Button variant="destructive" onClick={() => { deleteEnrollmentByClass(klassId).then(()=>{ setKlass((k)=> (k? { ...k, enrolled:false } as ClassItem : k)); toast.success('Inscrição cancelada com sucesso.'); }).catch((e:any)=>toast.error(e?.response?.data?.detail||'Erro ao cancelar inscrição')); }}>Cancelar inscrição</Button>
              )}
              {canManage && (
                <Button variant="outline" onClick={() => setShowAddPanel((v) => !v)}>
                  {showAddPanel ? 'Fechar' : 'Adicionar aluno'}
                </Button>
              )}
            </div>

            {canManage && showAddPanel && (
              <div className="mt-4 space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Buscar por usuário/nome"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <Button onClick={async () => {
                    setSearching(true);
                    try { const list = await searchStudents(query); setResults(list); } catch { toast.error('Erro ao buscar alunos.'); } finally { setSearching(false); }
                  }} disabled={searching}>
                    {searching ? 'Buscando...' : 'Buscar'}
                  </Button>
                </div>
                <div className="space-y-2">
                  {results.map((u) => {
                    const enrolled = enrolledIds.has(u.id);
                    return (
                      <div key={u.id} className="flex items-center justify-between border rounded-md p-2">
                        <div className="text-sm">
                          <div className="font-medium">{u.username}</div>
                          <div className="text-muted-foreground">{[u.first_name, u.last_name].filter(Boolean).join(' ')}</div>
                        </div>
                        {enrolled ? (
                          <Button size="sm" variant="destructive" onClick={async () => { await deleteEnrollmentByClassForStudent(klassId, u.id); setEnrolledIds((prev)=>{const n=new Set(prev); n.delete(u.id); return n;}); toast.success('Aluno desinscrito com sucesso.'); }}>
                            Desinscrever
                          </Button>
                        ) : (
                          <Button size="sm" onClick={async () => { await createEnrollment(klassId, u.id); setEnrolledIds((prev)=> new Set([...prev, u.id])); toast.success('Aluno inscrito com sucesso.'); }}>
                            Inscrever
                          </Button>
                        )}
                      </div>
                    );
                  })}
                  {results.length === 0 && <div className="text-sm text-muted-foreground">Nenhum aluno encontrado.</div>}
                </div>
              </div>
            )}
          </Card>
        </div>
      </Container>
    </>
  );
};

export default ClassDetail;
