from rest_framework import viewsets
from data.models import City
import json
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from django.db.models import F
import logging

logger = logging.getLogger(__name__)

class LocationView(viewsets.ViewSet):

    @action(detail=False, methods=['GET'])
    def search_locations(self, request):
        try:
            search_term = request.query_params.get('search_term')
            if not search_term:
                return Response({'error': 'Search term is required'}, status=status.HTTP_400_BAD_REQUEST)
            locations = (
                City.objects.filter(ascii_name__icontains=search_term)
                .values("id", "ascii_name", "country")
                .order_by("-population")[:10]
            )
            return Response(list(locations), status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f'Error searching locations: {e}')
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['GET'], url_path='coordinates')
    def get_coordinates(self, request):
        try:
            location_id = request.query_params.get('location_id')
            if not location_id:
                return Response({'error': 'Location ID is required'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                location = City.objects.filter(id=location_id).values('latitude', 'longitude').first()
            except Exception:
                location = None

            if not location or location.get('latitude') is None or location.get('longitude') is None:
                return Response({'error': f'Location not found {location_id}'}, status=status.HTTP_404_NOT_FOUND)

            return Response(location, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f'Error getting coordinates: {e}')
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)