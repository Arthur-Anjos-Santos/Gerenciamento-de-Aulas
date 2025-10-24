from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from .models import Enrollment
from .serializers import EnrollmentSerializer
from app.users.permissions import is_admin, is_instructor
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter

User = get_user_model()

@extend_schema_view(
    list=extend_schema(
        summary='Listar inscrições',
        description='Retorna inscrições com paginação. Admin/instrutor vê todas; aluno vê apenas as suas.',
        tags=['enrollments']
    ),
    retrieve=extend_schema(
        summary='Detalhar inscrição',
        description='Retorna os dados de uma inscrição pelo ID.',
        tags=['enrollments']
    ),
    create=extend_schema(
        summary='Criar inscrição',
        description=(
            'Cria uma inscrição do aluno em uma aula. '
            'Admin/Instrutor pode informar `student` (ID) para inscrever terceiros; '
            'aluno comum cria para si. Evita duplicidade e bloqueia inscrição de contas privilegiadas.'
        ),
        tags=['enrollments']
    ),
    destroy=extend_schema(
        summary='Excluir inscrição',
        description='Remove uma inscrição pelo ID.',
        tags=['enrollments']
    ),
    update=extend_schema(
        summary='(não utilizado)',
        description='Operação não usual para inscrições (mantido por herança).',
        tags=['enrollments']
    ),
    partial_update=extend_schema(
        summary='(não utilizado)',
        description='Operação não usual para inscrições (mantido por herança).',
        tags=['enrollments']
    ),
)
class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.select_related('class_ref', 'student').all()
    serializer_class = EnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['class_ref', 'student']

    def get_queryset(self):
        u = self.request.user
        if is_admin(u) or is_instructor(u):
            return self.queryset
        return self.queryset.filter(student=u)

    def create(self, request, *args, **kwargs):
        payload = request.data.copy()
        student_id = payload.pop('student', payload.pop('student_id', None))
        target_student = request.user
        if (is_admin(request.user) or is_instructor(request.user)) and student_id:
            try:
                s = User.objects.get(pk=int(student_id))
            except (User.DoesNotExist, ValueError):
                return Response({'detail': 'Aluno inválido.'}, status=status.HTTP_400_BAD_REQUEST)
            if s.is_superuser or s.groups.filter(name__in=['admin', 'instructor']).exists():
                return Response({'detail': 'Não é possível inscrever este usuário.'}, status=status.HTTP_400_BAD_REQUEST)
            target_student = s
        serializer = self.get_serializer(data=payload, context={'request': request, 'target_student': target_student})
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer, target_student)
        except IntegrityError:
            return Response({'detail': 'Você já está inscrito nesta aula.'}, status=status.HTTP_400_BAD_REQUEST)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer, target_student):
        serializer.save(student=target_student)

    @extend_schema(
        summary='Cancelar inscrição do aluno logado por aula',
        description='Exclui a inscrição do **usuário autenticado** na aula indicada por `class_id`.',
        tags=['enrollments'],
        parameters=[
            OpenApiParameter(name='class_id', description='ID da aula', required=True, type=int),
        ],
        responses={204: None, 404: dict}
    )
    @action(detail=False, methods=['delete'], url_path='by-class/(?P<class_id>\\d+)')
    def delete_by_class(self, request, class_id=None):
        u = request.user
        try:
            obj = Enrollment.objects.get(class_ref_id=class_id, student=u)
        except Enrollment.DoesNotExist:
            return Response({'detail': 'Inscrição não encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @extend_schema(
        summary='Cancelar inscrição de um aluno específico por aula',
        description='Exclui a inscrição do aluno `student_id` na aula `class_id`. Requer permissão de **admin** ou **instrutor**.',
        tags=['enrollments'],
        parameters=[
            OpenApiParameter(name='class_id', description='ID da aula', required=True, type=int),
            OpenApiParameter(name='student_id', description='ID do aluno', required=True, type=int),
        ],
        responses={204: None, 403: dict, 404: dict}
    )
    @action(detail=False, methods=['delete'], url_path='by-class/(?P<class_id>\\d+)/student/(?P<student_id>\\d+)')
    def delete_by_class_and_student(self, request, class_id=None, student_id=None):
        if not (is_admin(request.user) or is_instructor(request.user)):
            return Response({'detail': 'Permissão negada.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            obj = Enrollment.objects.get(class_ref_id=class_id, student_id=student_id)
        except Enrollment.DoesNotExist:
            return Response({'detail': 'Inscrição não encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
