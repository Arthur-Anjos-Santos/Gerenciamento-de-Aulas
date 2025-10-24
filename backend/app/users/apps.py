from django.apps import AppConfig

class UsersConfig(AppConfig):
    name = 'app.users'

    def ready(self):
        from . import signals
