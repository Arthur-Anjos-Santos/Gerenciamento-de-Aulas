import { useNavigate } from 'react-router-dom';
import { Button } from '../components/UI/Button';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-8">Página não encontrada</p>
        <Button onClick={() => navigate('/')}>
          Voltar para o Início
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
