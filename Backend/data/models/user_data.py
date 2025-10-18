from django.db import models
from .base import BaseModel


class UserData(BaseModel):
    """User data model for additional user information"""
    person = models.OneToOneField('Person', on_delete=models.CASCADE, related_name='user_data')
    phone = models.CharField(max_length=255, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=255, blank=True, null=True)
    state = models.CharField(max_length=255, blank=True, null=True)
    zip_code = models.CharField(max_length=255, blank=True, null=True)
    country = models.CharField(max_length=255, blank=True, null=True)
    logins = models.IntegerField(default=0)

    class Meta:
        managed = False
        db_table = 'user_data'
        verbose_name = 'User Data'
        verbose_name_plural = 'User Data'

    def __str__(self):
        return f"User Data for {self.person.full_name}"
