from django.db import models
from .base import BaseModel


class PasswordResetToken(BaseModel):
    """Password reset token model"""
    user = models.ForeignKey('AuthUser', on_delete=models.CASCADE, related_name='password_reset_tokens')
    token_hash = models.CharField(max_length=255)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)

    class Meta:
        managed = False
        db_table = 'password_reset_token'
        verbose_name = 'Password Reset Token'
        verbose_name_plural = 'Password Reset Tokens'

    def __str__(self):
        return f"Reset token for {self.user.username}"

    @property
    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at or self.used
