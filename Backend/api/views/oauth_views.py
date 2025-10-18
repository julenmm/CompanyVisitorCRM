from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.sites.models import Site
from django.conf import settings
from allauth.socialaccount.models import SocialAccount, SocialApp
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.facebook.views import FacebookOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from allauth.socialaccount import app_settings
from allauth.socialaccount.models import SocialToken
import requests
import json
from datetime import datetime, timedelta
from data.models import AuthUser, UserData, Person, OAuthAccount
from .auth_views import create_user_session


@api_view(['POST'])
@permission_classes([AllowAny])
def google_oauth_login(request):
    """Handle Google OAuth login"""
    try:
        access_token = request.data.get('access_token')
        if not access_token:
            return Response({'error': 'Access token required'}, status=status.HTTP_400_BAD_REQUEST)

        # Verify token with Google
        google_response = requests.get(
            f'https://www.googleapis.com/oauth2/v2/userinfo?access_token={access_token}'
        )
        
        if google_response.status_code != 200:
            return Response({'error': 'Invalid access token'}, status=status.HTTP_400_BAD_REQUEST)

        google_data = google_response.json()
        google_id = google_data.get('id')
        email = google_data.get('email')
        name = google_data.get('name', '')
        first_name = google_data.get('given_name', '')
        last_name = google_data.get('family_name', '')

        if not google_id or not email:
            return Response({'error': 'Invalid Google data'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if OAuth account exists
        try:
            oauth_account = OAuthAccount.objects.get(provider='google', provider_id=google_id)
            user = oauth_account.user
            
            # Update OAuth account data
            oauth_account.access_token = access_token
            oauth_account.provider_data = google_data
            oauth_account.save()
            
        except OAuthAccount.DoesNotExist:
            # Check if user exists by email
            try:
                user = AuthUser.objects.get(email=email)
                # Link OAuth account to existing user
                oauth_account = OAuthAccount.objects.create(
                    user=user,
                    provider='google',
                    provider_id=google_id,
                    access_token=access_token,
                    provider_data=google_data
                )
            except AuthUser.DoesNotExist:
                # Create new user
                username = email.split('@')[0]  # Use email prefix as username
                # Ensure username is unique
                counter = 1
                original_username = username
                while AuthUser.objects.filter(username=username).exists():
                    username = f"{original_username}_{counter}"
                    counter += 1

                # Create Person
                person = Person.objects.create(
                    first_name=first_name,
                    last_name=last_name,
                    email=email
                )

                # Create UserData
                user_data = UserData.objects.create(
                    person=person,
                    city='',
                    country=''
                )

                # Create AuthUser
                user = AuthUser.objects.create(
                    username=username,
                    email=email,
                    password_hash='',  # No password for OAuth users
                    user_data=user_data
                )

                # Create OAuth account
                oauth_account = OAuthAccount.objects.create(
                    user=user,
                    provider='google',
                    provider_id=google_id,
                    access_token=access_token,
                    provider_data=google_data
                )

        # Create session
        session_data = create_user_session(user)
        
        return Response({
            'message': 'Google login successful',
            'user': {
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name,
                'is_active': user.is_active,
                'is_staff': user.is_staff,
                'date_joined': user.date_joined.isoformat(),
            },
            'session': session_data
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def facebook_oauth_login(request):
    """Handle Facebook OAuth login"""
    try:
        access_token = request.data.get('access_token')
        if not access_token:
            return Response({'error': 'Access token required'}, status=status.HTTP_400_BAD_REQUEST)

        # Verify token with Facebook
        facebook_response = requests.get(
            f'https://graph.facebook.com/me?fields=id,name,email,first_name,last_name&access_token={access_token}'
        )
        
        if facebook_response.status_code != 200:
            return Response({'error': 'Invalid access token'}, status=status.HTTP_400_BAD_REQUEST)

        facebook_data = facebook_response.json()
        facebook_id = facebook_data.get('id')
        email = facebook_data.get('email')
        name = facebook_data.get('name', '')
        first_name = facebook_data.get('first_name', '')
        last_name = facebook_data.get('last_name', '')

        if not facebook_id:
            return Response({'error': 'Invalid Facebook data'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if OAuth account exists
        try:
            oauth_account = OAuthAccount.objects.get(provider='facebook', provider_id=facebook_id)
            user = oauth_account.user
            
            # Update OAuth account data
            oauth_account.access_token = access_token
            oauth_account.provider_data = facebook_data
            oauth_account.save()
            
        except OAuthAccount.DoesNotExist:
            # Check if user exists by email (if email is provided)
            if email:
                try:
                    user = AuthUser.objects.get(email=email)
                    # Link OAuth account to existing user
                    oauth_account = OAuthAccount.objects.create(
                        user=user,
                        provider='facebook',
                        provider_id=facebook_id,
                        access_token=access_token,
                        provider_data=facebook_data
                    )
                except AuthUser.DoesNotExist:
                    pass  # Will create new user below
                else:
                    # User found and linked, create session
                    session_data = create_user_session(user)
                    return Response({
                        'message': 'Facebook login successful',
                        'user': {
                            'id': str(user.id),
                            'username': user.username,
                            'email': user.email,
                            'full_name': user.full_name,
                            'is_active': user.is_active,
                            'is_staff': user.is_staff,
                            'date_joined': user.date_joined.isoformat(),
                        },
                        'session': session_data
                    }, status=status.HTTP_200_OK)

            # Create new user
            username = email.split('@')[0] if email else f"fb_{facebook_id}"
            # Ensure username is unique
            counter = 1
            original_username = username
            while AuthUser.objects.filter(username=username).exists():
                username = f"{original_username}_{counter}"
                counter += 1

            # Create Person
            person = Person.objects.create(
                first_name=first_name,
                last_name=last_name,
                email=email or f"{facebook_id}@facebook.local"
            )

            # Create UserData
            user_data = UserData.objects.create(
                person=person,
                city='',
                country=''
            )

            # Create AuthUser
            user = AuthUser.objects.create(
                username=username,
                email=email or f"{facebook_id}@facebook.local",
                password_hash='',  # No password for OAuth users
                user_data=user_data
            )

            # Create OAuth account
            oauth_account = OAuthAccount.objects.create(
                user=user,
                provider='facebook',
                provider_id=facebook_id,
                access_token=access_token,
                provider_data=facebook_data
            )

        # Create session
        session_data = create_user_session(user)
        
        return Response({
            'message': 'Facebook login successful',
            'user': {
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name,
                'is_active': user.is_active,
                'is_staff': user.is_staff,
                'date_joined': user.date_joined.isoformat(),
            },
            'session': session_data
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_oauth_urls(request):
    """Get OAuth provider URLs for frontend"""
    try:
        # Get OAuth app configurations
        google_app = SocialApp.objects.filter(provider='google').first()
        facebook_app = SocialApp.objects.filter(provider='facebook').first()
        
        urls = {}
        
        if google_app:
            urls['google'] = {
                'client_id': google_app.client_id,
                'redirect_uri': f"{settings.FRONTEND_URL}/oauth/google/callback"
            }
        
        if facebook_app:
            urls['facebook'] = {
                'client_id': facebook_app.client_id,
                'redirect_uri': f"{settings.FRONTEND_URL}/oauth/facebook/callback"
            }
        
        return Response(urls, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
