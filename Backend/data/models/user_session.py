from django.db import models
from django.db.models.functions import Now
from django.utils import timezone


class UserSession(models.Model):
    """User session model for token-based authentication"""
    user = models.ForeignKey('AuthUser', on_delete=models.CASCADE, related_name='sessions')
    token_hash = models.CharField(max_length=255)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(db_default=Now())
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
        expires_at = self.expires_at
        if timezone.is_naive(expires_at):
            expires_at = timezone.make_aware(expires_at, timezone.get_current_timezone())
        return timezone.now() > expires_at
