from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username = attrs.get("username") or attrs.get("email") or ""
        password = attrs.get("password") or ""
        User = get_user_model()

        if "@" in username:
            try:
                u = User.objects.get(email__iexact=username)
                attrs["username"] = getattr(u, User.USERNAME_FIELD)
            except User.DoesNotExist:
                pass

        return super().validate(attrs)
