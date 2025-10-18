from django.db import models
from .base import BaseModel


class AuthUser(BaseModel):
    """Custom user model for authentication"""
    user_data = models.OneToOneField('UserData', on_delete=models.CASCADE, related_name='auth_user')
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    last_login = models.DateTimeField(blank=True, null=True)
    date_joined = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'custom_auth_user'
        verbose_name = 'Custom User'
        verbose_name_plural = 'Custom Users'

    def __str__(self):
        return self.username

    @property
    def full_name(self):
        return self.user_data.person.full_name if self.user_data else self.username
