from rest_framework import serializers
from .models import Enrollment

class EnrollmentSerializer(serializers.ModelSerializer):
    class_id = serializers.IntegerField(source='class_ref.id', read_only=True)
    class_title = serializers.CharField(source='class_ref.title', read_only=True)
    class_start_datetime = serializers.DateTimeField(source='class_ref.start_datetime', read_only=True)

    class Meta:
        model = Enrollment
        fields = ['id', 'class_ref', 'class_id', 'class_title', 'class_start_datetime', 'student', 'created_at']
        read_only_fields = ['id', 'student', 'created_at', 'class_id', 'class_title', 'class_start_datetime']

    def validate(self, attrs):
        request = self.context.get('request')
        target_student = self.context.get('target_student') or getattr(request, 'user', None)
        class_ref = attrs.get('class_ref')
        if not target_student or not target_student.is_authenticated:
            raise serializers.ValidationError({'detail': 'Autenticação necessária.'})
        if not class_ref:
            raise serializers.ValidationError({'detail': 'A aula é obrigatória.'})
        if Enrollment.objects.filter(class_ref=class_ref, student=target_student).exists():
            raise serializers.ValidationError({'detail': 'Você já está inscrito nesta aula.'})
        return attrs
