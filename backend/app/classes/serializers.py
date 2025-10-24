from rest_framework import serializers
from .models import Class
from app.enrollments.models import Enrollment
from django.contrib.auth import get_user_model
User = get_user_model()

class ClassSerializer(serializers.ModelSerializer):
    instructor = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(groups__name='instructor'),
        required=False,
        allow_null=True
    )
    instructor_username = serializers.CharField(source='instructor.username', read_only=True)
    enrolled = serializers.SerializerMethodField()
    participants_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Class
        fields = [
            'id',
            'title',
            'description',
            'start_datetime',
            'instructor',
            'instructor_username',
            'enrolled',
            'participants_count',
        ]
        read_only_fields = ['id', 'instructor_username', 'enrolled', 'participants_count']

    def get_enrolled(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return Enrollment.objects.filter(class_ref=obj, student=request.user).exists()
