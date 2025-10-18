from django.db import models
from .base import BaseModel


class UserSession(BaseModel):
    """User session model for token-based authentication"""
    user = models.ForeignKey('AuthUser', on_delete=models.CASCADE, related_name='sessions')
    token_hash = models.CharField(max_length=255)
    expires_at = models.DateTimeField()
    last_used_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'user_session'
        verbose_name = 'User Session'
        verbose_name_plural = 'User Sessions'

    def __str__(self):
        return f"Session for {self.user.username}"

    @property
    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at
