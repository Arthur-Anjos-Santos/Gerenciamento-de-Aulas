from rest_framework import viewsets
from django.db.models import Count
from .models import Class
from .serializers import ClassSerializer
from app.users.permissions import is_admin, is_instructor, ReadOnlyOrAdminInstructor
from drf_spectacular.utils import extend_schema, extend_schema_view

@extend_schema_view(
    list=extend_schema(
        summary='Listar aulas',
        description='Retorna uma lista paginada de aulas. Suporta busca, ordenação e filtros configurados no projeto.',
        tags=['classes']
    ),
    retrieve=extend_schema(
        summary='Detalhar aula',
        description='Retorna os dados completos de uma aula pelo ID.',
        tags=['classes']
    ),
    create=extend_schema(
        summary='Criar aula',
        description='Cria uma nova aula. Se o usuário autenticado for **instrutor** (e não admin) e o payload não indicar `instructor`, a aula é criada atribuída a ele.',
        tags=['classes']
    ),
    update=extend_schema(
        summary='Atualizar aula (PUT)',
        description='Atualiza **todos** os campos de uma aula existente.',
        tags=['classes']
    ),
    partial_update=extend_schema(
        summary='Atualização parcial (PATCH)',
        description='Atualiza parcialmente os campos de uma aula.',
        tags=['classes']
    ),
    destroy=extend_schema(
        summary='Excluir aula',
        description='Remove uma aula pelo ID. Operação irreversível.',
        tags=['classes']
    ),
)
class ClassViewSet(viewsets.ModelViewSet):
    queryset = (
        Class.objects
        .select_related('instructor')
        .annotate(participants_count=Count('enrollments'))
        .order_by('start_datetime', 'id')
    )
    serializer_class = ClassSerializer
    permission_classes = [ReadOnlyOrAdminInstructor]

    def perform_create(self, serializer):
        u = self.request.user
        data_instructor = serializer.validated_data.get('instructor')
        if data_instructor:
            serializer.save()
        else:
            if is_instructor(u) and not is_admin(u):
                serializer.save(instructor=u)
            else:
                serializer.save()

    def perform_update(self, serializer):
        serializer.save()
