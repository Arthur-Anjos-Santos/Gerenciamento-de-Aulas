from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db.models import Q
from django.core.exceptions import ValidationError
from rest_framework import status, serializers, generics, permissions
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from app.users.permissions import is_admin, is_instructor
from .models import UserProfile
from django.core.files.storage import default_storage
import os
import logging

from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
)

logger = logging.getLogger(__name__)
User = get_user_model()

                                         
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

class TokenPairSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()

class MeSerializer(serializers.ModelSerializer):
    groups = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_superuser', 'groups', 'avatar_url']

    def get_groups(self, obj):
        return list(obj.groups.values_list('name', flat=True))

    def get_avatar_url(self, obj):
        prof = getattr(obj, 'profile', None)
        if prof and prof.avatar:
            request = self.context.get('request')
            url = prof.avatar.url
            return request.build_absolute_uri(url) if request else url
        return None

class MeUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email']

class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']

class InstructorMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value

class AvatarUploadSerializer(serializers.Serializer):
    avatar = serializers.ImageField(required=False, help_text='Arquivo de imagem (campo aceito: "avatar" ou "file").')

               

@extend_schema(
    summary='Login (JWT)',
    description='Autentica com `username` e `password` e retorna um par de tokens **access**/**refresh**.',
    tags=['auth'],
    request=LoginSerializer,
    responses={200: TokenPairSerializer, 400: dict, 500: dict}
)
class LoginView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        try:
            username = str(request.data.get('username') or '').strip()
            password = str(request.data.get('password') or '').strip()
            if not username or not password:
                return Response({'detail': 'Usuário ou senha inválidos.'}, status=status.HTTP_400_BAD_REQUEST)
            user = authenticate(request, username=username, password=password)
            if not user:
                return Response({'detail': 'Usuário ou senha inválidos.'}, status=status.HTTP_400_BAD_REQUEST)
            refresh = RefreshToken.for_user(user)
            return Response({'access': str(refresh.access_token), 'refresh': str(refresh)}, status=status.HTTP_200_OK)
        except Exception:
            logger.exception("Erro no login")
            return Response({'detail': 'Erro interno no login.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@extend_schema(
    tags=['users'],
    summary='Me (perfil atual)',
    description='Retorna os dados do usuário autenticado.',
    responses={200: MeSerializer}
)
class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(MeSerializer(request.user, context={'request': request}).data)

    @extend_schema(
        tags=['users'],
        summary='Atualizar perfil (PUT)',
        description='Atualiza completamente os dados básicos do perfil do usuário autenticado.',
        request=MeUpdateSerializer,
        responses={200: MeSerializer}
    )
    def put(self, request):
        s = MeUpdateSerializer(request.user, data=request.data)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(MeSerializer(request.user, context={'request': request}).data, status=status.HTTP_200_OK)

    @extend_schema(
        tags=['users'],
        summary='Atualização parcial do perfil (PATCH)',
        description='Atualiza parcialmente os dados básicos do perfil do usuário autenticado.',
        request=MeUpdateSerializer,
        responses={200: MeSerializer}
    )
    def patch(self, request):
        s = MeUpdateSerializer(request.user, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(MeSerializer(request.user, context={'request': request}).data, status=status.HTTP_200_OK)

@extend_schema(
    tags=['users'],
    summary='Buscar usuários (mini)',
    description='Busca usuários por texto (`q`) em username, email, first_name e last_name. Requer autenticação.',
    parameters=[
        OpenApiParameter(name='q', description='Texto de busca', required=False, type=str),
    ],
    responses={200: UserMiniSerializer(many=True)}
)
class UsersSearchView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserMiniSerializer

    def get_queryset(self):
        q = self.request.query_params.get('q', '')
        qs = User.objects.all().order_by('username')
        if q:
            qs = qs.filter(
                Q(username__icontains=q) |
                Q(email__icontains=q) |
                Q(first_name__icontains=q) |
                Q(last_name__icontains=q)
            )
        return qs

@extend_schema(
    tags=['users'],
    summary='Listar alunos (mini)',
    description='Lista alunos ativos (não admin/instrutor). Requer permissão de admin ou instrutor.',
    parameters=[
        OpenApiParameter(name='q', description='Filtro por nome/username', required=False, type=str),
    ],
    responses={200: UserMiniSerializer(many=True)}
)
class StudentListView(generics.ListAPIView):
    serializer_class = UserMiniSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        u = self.request.user
        if not (is_admin(u) or is_instructor(u)):
            return User.objects.none()
        qs = (User.objects
              .filter(is_active=True, is_superuser=False)
              .exclude(groups__name__in=['admin', 'instructor']))
        q = self.request.query_params.get('q', '').strip()
        if q:
            qs = qs.filter(
                Q(username__icontains=q) |
                Q(first_name__icontains=q) |
                Q(last_name__icontains=q)
            )
        return qs.order_by('username')

@extend_schema(
    tags=['users'],
    summary='Listar instrutores (mini)',
    description='Lista usuários do grupo **instructor**. Requer permissão de admin ou instrutor.',
    parameters=[
        OpenApiParameter(name='q', description='Filtro por nome/username/email', required=False, type=str),
    ],
    responses={200: InstructorMiniSerializer(many=True)}
)
class InstructorListView(generics.ListAPIView):
    serializer_class = InstructorMiniSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        u = self.request.user
        if not (is_admin(u) or is_instructor(u)):
            return User.objects.none()
        q = self.request.query_params.get('q', '').strip()
        qs = User.objects.filter(is_active=True, groups__name='instructor').order_by('username')
        if q:
            qs = qs.filter(
                Q(username__icontains=q) |
                Q(first_name__icontains=q) |
                Q(last_name__icontains=q) |
                Q(email__icontains=q)
            )
        return qs

@extend_schema(
    tags=['users'],
    summary='Alterar senha',
    description='Valida a senha atual e define uma nova senha para o usuário autenticado.',
    request=ChangePasswordSerializer,
    responses={200: dict, 400: dict}
)
class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        ser = ChangePasswordSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        old_pw = ser.validated_data['old_password']
        new_pw = ser.validated_data['new_password']

        if not request.user.check_password(old_pw):
            return Response({'detail': 'Senha atual incorreta.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_password(new_pw, user=request.user)
        except ValidationError as e:
            return Response({'detail': ' '.join(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

        request.user.set_password(new_pw)
        request.user.save()
        return Response({'detail': 'Senha alterada com sucesso.'}, status=status.HTTP_200_OK)

@extend_schema(
    tags=['users'],
    summary='Upload de avatar',
    description='Envia uma imagem de avatar para o usuário autenticado. Aceita o campo **avatar** (preferencial) ou **file** em multipart/form-data.',
    request=AvatarUploadSerializer,
    responses={200: dict, 400: dict}
)

class AvatarUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        f = request.FILES.get('file') or request.FILES.get('avatar')
        if not f:
            return Response({'detail': 'Arquivo não enviado.'}, status=status.HTTP_400_BAD_REQUEST)

        prof, _ = UserProfile.objects.get_or_create(user=request.user)

        old_path = prof.avatar.path if prof.avatar and hasattr(prof.avatar, 'path') else None
        prof.avatar = f
        prof.save()

        stored_name = getattr(prof.avatar, 'name', None)
        stored_path = getattr(prof.avatar, 'path', None)

        if not stored_name or not default_storage.exists(stored_name):
            logger.error("Avatar não encontrado no storage após salvar.",
                         extra={'stored_name': stored_name, 'stored_path': stored_path, 'media_root': str(settings.MEDIA_ROOT)})
            return Response(
                {'detail': 'Falha ao salvar o avatar.', 'path': stored_path, 'media_root': str(settings.MEDIA_ROOT)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        legacy_rel = f"avatars/{request.user.id}.png"
        try:
            prof.avatar.open('rb')
            data = prof.avatar.read()
            prof.avatar.close()

            if default_storage.exists(legacy_rel):
                default_storage.delete(legacy_rel)
            default_storage.save(legacy_rel, ContentFile(data))
        except Exception as e:
            logger.warning("Não foi possível gerar a cópia legada do avatar.", exc_info=e, extra={'legacy_rel': legacy_rel})

        if old_path and os.path.exists(old_path) and old_path != stored_path:
            try:
                default_storage.delete(old_path)
            except Exception:
                pass

        url = request.build_absolute_uri(prof.avatar.url)
        return Response({'avatar_url': url}, status=status.HTTP_200_OK)
