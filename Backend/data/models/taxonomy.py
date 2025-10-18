from django.db import models
from .base import BaseModel


class Taxonomy(BaseModel):
    """Taxonomy/Category model for companies"""
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'taxonomy'
        verbose_name = 'Taxonomy'
        verbose_name_plural = 'Taxonomies'

    def __str__(self):
        return self.name
