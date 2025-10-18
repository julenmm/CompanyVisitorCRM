from django.db import models
from .base import BaseModel


class TaxonomyRelationship(BaseModel):
    """Many-to-many relationship between Company and Taxonomy"""
    company = models.ForeignKey('Company', on_delete=models.CASCADE, db_column='company_id')
    taxonomy = models.ForeignKey('Taxonomy', on_delete=models.CASCADE, db_column='taxonomy_id')

    class Meta:
        managed = False
        db_table = 'taxonomy_relationship'
        unique_together = ['company', 'taxonomy']
        verbose_name = 'Taxonomy Relationship'
        verbose_name_plural = 'Taxonomy Relationships'

    def __str__(self):
        return f"{self.company.name} - {self.taxonomy.name}"
