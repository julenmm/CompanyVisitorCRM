from django.db import models
from .base import BaseModel


class OAuthAccount(BaseModel):
    """OAuth account linking model"""
    user = models.ForeignKey('AuthUser', on_delete=models.CASCADE, related_name='oauth_accounts')
    provider = models.CharField(max_length=50, help_text="OAuth provider (google, facebook, github)")
    provider_id = models.CharField(max_length=100, help_text="User ID from OAuth provider")
    access_token = models.TextField(blank=True, null=True)
    refresh_token = models.TextField(blank=True, null=True)
    expires_at = models.DateTimeField(blank=True, null=True)
    provider_data = models.JSONField(default=dict, help_text="Additional data from OAuth provider")

    class Meta:
        managed = False
        db_table = 'oauth_account'
        verbose_name = 'OAuth Account'
        verbose_name_plural = 'OAuth Accounts'
        unique_together = ['provider', 'provider_id']

    def __str__(self):
        return f"{self.user.username} - {self.provider}"

    @property
    def is_expired(self):
        if not self.expires_at:
            return False
        from django.utils import timezone
        return timezone.now() > self.expires_at
