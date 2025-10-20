import uuid
import hashlib
import secrets
from datetime import datetime, timedelta
from django.utils import timezone
from django.contrib.auth.hashers import make_password, check_password
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from data.models import AuthUser, UserData, Person, UserSession, PasswordResetToken
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register a new user"""
    try:
        data = request.data
        username = data['username']
        email = data['email']
        password = data['password']
        first_name = data['first_name']
        last_name = data['last_name']
        
        # Validate required fields
        if not all([username, email, password]):
            return Response(
                {'error': 'Username, email, and password are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user already exists
        if AuthUser.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already exists'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if AuthUser.objects.filter(email=email).exists():
            return Response(
                {'error': 'Email already exists'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            # Create Person
            person = Person.objects.create(
                first_name=first_name,
                last_name=last_name,
                email=email,
                company=None  # Will be set later
            )
            
            # Create UserData
            user_data = UserData.objects.create(
                person=person
            )
            
            # Create AuthUser
            auth_user = AuthUser.objects.create(
                user_data=user_data,
                username=username,
                email=email,
                password_hash=make_password(password)
            )
            
            # Create initial session
            session = create_user_session(auth_user)
            
            return Response({
                'message': 'User registered successfully',
                'user': {
                    'id': str(auth_user.id),
                    'username': auth_user.username,
                    'email': auth_user.email,
                    'full_name': auth_user.full_name
                },
                'token': session.token_hash
            }, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        logger.error(f"Error registering user: {e}")
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Login user and return session token"""
    try:
        data = request.data
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return Response(
                {'error': 'Username and password are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find user by username or email
        try:
            user = AuthUser.objects.get(username=username)
        except AuthUser.DoesNotExist:
            try:
                user = AuthUser.objects.get(email=username)
            except AuthUser.DoesNotExist:
                return Response(
                    {'error': 'Invalid credentials'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
        
        # Check password
        if not check_password(password, user.password_hash):
            return Response(
                {'error': 'Invalid credentials'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check if user is active
        if not user.is_active:
            return Response(
                {'error': 'Account is deactivated'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Update last login
        user.last_login = timezone.now()
        user.save()
        
        # Create new session
        session = create_user_session(user)
        
        return Response({
            'message': 'Login successful',
            'user': {
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name
            },
            'token': session.token_hash
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error logging in: {e}")
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def logout(request):
    """Logout user by invalidating session"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        
        if not token:
            return Response(
                {'error': 'Token is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find and invalidate session
        try:
            session = UserSession.objects.get(token_hash=token)
            session.delete()
            return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)
        except UserSession.DoesNotExist:
            return Response(
                {'error': 'Invalid token'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
            
    except Exception as e:
        logger.error(f"Error logging out: {e}")
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def get_user_profile(request):
    """Get current user profile"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response(
                {'error': 'Invalid or expired token'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        return Response({
            'user': {
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name,
                'is_active': user.is_active,
                'date_joined': user.date_joined
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting user profile: {e}")
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def create_user_session(user):
    """Create a new user session"""
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    expires_at = timezone.now() + timedelta(days=30)  # 30 days
    
    session = UserSession.objects.create(
        user=user,
        token_hash=token_hash,
        expires_at=expires_at
    )
    
    # Store the plain token for return (only for development)
    session.token_hash = token  # Override for return
    return session


def get_user_from_token(request):
    """Get user from Authorization token"""
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    
    if not token:
        return None
    
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    
    try:
        session = UserSession.objects.get(token_hash=token_hash)
        if session.is_expired:
            return None
        return session.user
    except UserSession.DoesNotExist:
        return None
