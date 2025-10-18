from django.db import models
from .base import BaseModel


class Company(BaseModel):
    """Company model"""
    name = models.CharField(max_length=255)
    domain = models.CharField(max_length=255, unique=True)
    domains = models.JSONField(default=list, help_text="List of all company domains")
    description = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'company'
        verbose_name = 'Company'
        verbose_name_plural = 'Companies'
        ordering = ['name']

    def __str__(self):
        return self.name
