from typing import List, Dict, Any
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import status, viewsets

from data.models import Company, Office, Person, TaxonomyRelationship, Taxonomy, UserWorld
from .auth_views import get_user_from_token
import random


def _serialize_company(company: Company) -> Dict[str, Any]:
    """Serialize a Company into the frontend-expected shape."""
    # Locations mapping
    offices = Office.objects.filter(company=company)
    locations: List[Dict[str, Any]] = []
    for office in offices:
        # Only include coordinates if both present
        coords = None
        if office.latitude is not None and office.longitude is not None:
            coords = {
                'lat': float(office.latitude),
                'lon': float(office.longitude),
            }
        locations.append({
            'id': str(office.id),
            'coordinates': coords if coords is not None else {'lat': 0.0, 'lon': 0.0},
            'address': office.address or '',
            'city': office.city or '',
            'country': office.country or '',
            'isHQ': bool(office.is_headquarters),
        })

    # People: just return IDs (frontend expects string[])
    people_ids = list(
        map(str, Person.objects.filter(company=company).values_list('id', flat=True))
    )

    # Tags: taxonomy IDs associated to this company
    tag_ids = list(
        map(str, TaxonomyRelationship.objects.filter(company=company).values_list('taxonomy_id', flat=True))
    )

    return {
        'id': str(company.id),
        'name': company.name,
        'locations': locations,
        'people': people_ids,
        'tags': tag_ids,
    }


class CompanyViewSet(viewsets.ModelViewSet):
    
    @action(detail=False, methods=['GET'], url_path='user-companies')
    def get_user_companies(self, request):
        """Return all companies associated to the current user.

        Association comes from `UserWorld` records for the user, including the
        primary `company` and any IDs listed in `world_companies` arrays.
        """
        user = get_user_from_token(request)
        if not user:
            return Response({'error': 'Invalid or expired token'}, status=status.HTTP_401_UNAUTHORIZED)

        # Collect company IDs from UserWorld (direct company + world_companies array)
        company_ids = set()
        user_worlds = UserWorld.objects.filter(user=user)
        for uw in user_worlds:
            if uw.company_id:
                company_ids.add(uw.company_id)
            if uw.world_companies:
                for cid in uw.world_companies:
                    company_ids.add(cid)

        if not company_ids:
            return Response([], status=status.HTTP_200_OK)

        companies = Company.objects.filter(id__in=list(company_ids)).order_by('name')
        data = [_serialize_company(c) for c in companies]
        return Response(data, status=status.HTTP_200_OK)


    @action(detail=False, methods=['POST'], url_path='random-coordinates')
    def make_random_company_coordinates(self, request):
        batch_size = 100000
        total_updated = 0

        queryset = Company.objects.all().order_by('id')
        total_companies = queryset.count()

        for start in range(0, total_companies, batch_size):
            batch = queryset[start:start + batch_size]
            offices_to_update = []

            for company in batch.iterator():
                office = Office.objects.filter(company=company).first()
                if office:
                    office.latitude = random.uniform(-90, 90)
                    office.longitude = random.uniform(-180, 180)
                    offices_to_update.append(office)

            Office.objects.bulk_update(offices_to_update, ['latitude', 'longitude'])
            total_updated += len(offices_to_update)
            print(f"✅ Updated {total_updated}/{total_companies} offices so far...")

        return Response(
            {'message': f'Random company coordinates assigned to {total_updated} offices.'},
            status=status.HTTP_200_OK
        )


