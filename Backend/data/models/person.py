from django.db import models
from .base import BaseModel


class Person(BaseModel):
    """Person model for individuals"""
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=255, blank=True, null=True)
    state = models.CharField(max_length=255, blank=True, null=True)
    zip = models.IntegerField(blank=True, null=True)
    country = models.CharField(max_length=255, blank=True, null=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=8, blank=True, null=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, blank=True, null=True)
    office = models.ForeignKey('Office', on_delete=models.SET_NULL, blank=True, null=True, related_name='people')
    company = models.ForeignKey('Company', on_delete=models.CASCADE, related_name='people')

    class Meta:
        managed = False
        db_table = 'person'
        verbose_name = 'Person'
        verbose_name_plural = 'People'
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def coordinates(self):
        """Return coordinates as tuple for mapping"""
        if self.latitude and self.longitude:
            return (float(self.latitude), float(self.longitude))
        return None
