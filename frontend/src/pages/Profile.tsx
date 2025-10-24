import { useCallback, useEffect, useState } from 'react';
import Navbar from '../components/Layout/Navbar';
import Container from '../components/Layout/Container';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { updateMe, changePassword, uploadAvatar, Me } from '../api/me';
import { toast } from 'sonner';
import { useAuth } from '../store/auth';

export default function Profile() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  const { profile, refreshProfile, mergeProfile, loading: authLoading } = useAuth();

  const clearPendingPreview = useCallback(() => {
    setObjectUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const applyProfile = (data: Me) => {
      if (cancelled) return;
      clearPendingPreview();
      setMe(data);
      setFirstName(data.first_name || '');
      setLastName(data.last_name || '');
      setEmail(data.email || '');
      setAvatarPreview(data.avatar_url || null);
      setAvatarFile(null);
      setErr('');
      setLoading(false);
    };

    const loadProfile = async () => {
      try {
        const data = await refreshProfile();
        if (data) {
          applyProfile(data as Me);
        } else if (!cancelled) {
          setErr('Perfil nao encontrado.');
          setLoading(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          setErr(e?.response?.data?.detail || 'Erro ao carregar perfil');
          setLoading(false);
        }
      }
    };

    if (profile) {
      applyProfile(profile as Me);
    } else if (!authLoading) {
      loadProfile();
    }

    return () => {
      cancelled = true;
    };
  }, [authLoading, clearPendingPreview, profile, refreshProfile]);

  useEffect(() => {
    return () => {
      clearPendingPreview();
    };
  }, [clearPendingPreview]);

  const onSaveInfo = async () => {
    if (savingInfo) return;
    setSavingInfo(true);
    try {
      const updated = await updateMe({ first_name: firstName, last_name: lastName, email });
      setMe(updated);
      mergeProfile(updated);
      setErr('');
      toast.success('Informacoes atualizadas.');
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Erro ao atualizar informacoes.');
    } finally {
      setSavingInfo(false);
    }
  };

  const onChangePw = async () => {
    if (savingPw) return;
    setSavingPw(true);
    try {
      await changePassword(oldPw, newPw);
      setOldPw('');
      setNewPw('');
      toast.success('Senha alterada com sucesso.');
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Erro ao alterar senha.');
    } finally {
      setSavingPw(false);
    }
  };

  const onSelectAvatar = (file?: File) => {
    if (!file) return;
    clearPendingPreview();
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    setAvatarFile(file);
    setAvatarPreview(url);
  };

  const onUploadAvatar = async () => {
    if (!avatarFile || savingAvatar) return;
    setSavingAvatar(true);
    try {
      const url = await uploadAvatar(avatarFile);
      clearPendingPreview();
      setAvatarFile(null);
      setAvatarPreview(url);
      setMe((current) => (current ? { ...current, avatar_url: url } : current));
      mergeProfile({ avatar_url: url });
      setErr('');
      toast.success('Foto atualizada.');
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Erro ao enviar foto.');
    } finally {
      setSavingAvatar(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Container>
          <div className="space-y-6">
            <Skeleton className="h-10 w-48" />
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 space-y-4">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-32" />
              </Card>
              <Card className="p-6 space-y-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-32" />
              </Card>
              <Card className="p-6 space-y-4 md:col-span-2">
                <Skeleton className="h-6 w-44" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-20 w-20 rounded-full" />
                  <div className="space-y-3 flex-1">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-40" />
                  </div>
                </div>
              </Card>
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
        <h1 className="text-3xl font-bold mb-4">Meu Perfil</h1>

        {err && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{err}</AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Informacoes basicas</h2>
            <div className="space-y-2">
              <Label>Nome</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Primeiro nome"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <Input
                  placeholder="Sobrenome"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button onClick={onSaveInfo} disabled={savingInfo}>
              {savingInfo ? 'Salvando...' : 'Salvar'}
            </Button>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Alterar senha</h2>
            <div className="space-y-2">
              <Label>Senha atual</Label>
              <Input type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nova senha</Label>
              <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
            </div>
            <Button onClick={onChangePw} disabled={savingPw}>
              {savingPw ? 'Alterando...' : 'Alterar senha'}
            </Button>
          </Card>

          <Card className="p-6 space-y-4 md:col-span-2">
            <h2 className="text-xl font-semibold">Foto de perfil</h2>
            <div className="flex items-center gap-4">
              <img
                src={avatarPreview || '/placeholder.svg'}
                alt={me?.username || 'avatar'}
                className="h-20 w-20 rounded-full object-cover border"
              />
              <div className="space-y-2">
                <Input type="file" accept="image/*" onChange={(e) => onSelectAvatar(e.target.files?.[0])} />
                <Button onClick={onUploadAvatar} disabled={!avatarFile || savingAvatar}>
                  {savingAvatar ? 'Enviando...' : 'Enviar nova foto'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </Container>
    </>
  );
}
