from django.db import models
from django.contrib.postgres.fields import ArrayField
from .base import BaseModel


class UserWorld(BaseModel):
    """User world model for user's company and people networks"""
    user = models.ForeignKey('AuthUser', on_delete=models.CASCADE, related_name='world')
    company = models.ForeignKey('Company', on_delete=models.CASCADE, related_name='world_users')
    taxonomy_interests = models.ForeignKey('Taxonomy', on_delete=models.SET_NULL, blank=True, null=True, related_name='interested_users')
    world_companies = ArrayField(models.UUIDField(), default=list, blank=True, db_column='world_companies_id')
    world_people = ArrayField(models.UUIDField(), default=list, blank=True, db_column='world_people_id')

    class Meta:
        managed = False
        db_table = 'user_world'
        verbose_name = 'User World'
        verbose_name_plural = 'User Worlds'
        unique_together = ['user', 'company']

    def __str__(self):
        return f"{self.user.username}'s world for {self.company.name}"

    def get_world_companies(self):
        """Get Company objects for world_companies UUIDs"""
        from .company import Company
        return Company.objects.filter(id__in=self.world_companies)

    def get_world_people(self):
        """Get Person objects for world_people UUIDs"""
        from .person import Person
        return Person.objects.filter(id__in=self.world_people)
