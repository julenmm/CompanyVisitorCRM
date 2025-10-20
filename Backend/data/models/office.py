from django.db import models
from .base import BaseModel


class Office(BaseModel):
    """Office/Location model for companies"""
    company = models.ForeignKey('Company', on_delete=models.CASCADE, related_name='offices')
    name = models.CharField(max_length=255, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=255, blank=True, null=True)
    state = models.CharField(max_length=255, blank=True, null=True)
    zip = models.CharField(max_length=255, blank=True, null=True)
    country = models.CharField(max_length=255, blank=True, null=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=8, blank=True, null=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, blank=True, null=True)
    is_headquarters = models.BooleanField(default=False)

    class Meta:
        managed = False
        db_table = 'office'
        verbose_name = 'Office'
        verbose_name_plural = 'Offices'
        ordering = ['company', 'is_headquarters', 'city']

    def __str__(self):
        location = f"{self.city}, {self.country}" if self.city and self.country else self.address
        hq_indicator = " (HQ)" if self.is_headquarters else ""
        return f"{self.company.name} - {location}{hq_indicator}"

    @property
    def coordinates(self):
        """Return coordinates as tuple for mapping"""
        if self.latitude and self.longitude:
            return (float(self.latitude), float(self.longitude))
        return None
