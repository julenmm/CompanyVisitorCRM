import uuid
from django.db import models


class City(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)                      # NOT NULL
    ascii_name = models.CharField(max_length=255)                # NOT NULL
    country = models.CharField(max_length=255)                   # NOT NULL
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    population = models.IntegerField(null=True, blank=True)

    class Meta:
        managed = False                 # table already created by SQL; don't let Django manage it
        db_table = "city"               # matches unquoted CREATE TABLE CITY (folds to lowercase in Postgres)
        indexes = [
            models.Index(fields=["ascii_name"]),
            models.Index(fields=["country"]),
            models.Index(fields=["-population"]),
        ]

    def __str__(self):
        return f"{self.name}, {self.country}"