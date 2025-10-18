from django.urls import path
from .views.auth_views import register, login, logout, get_user_profile
from .views.oauth_views import google_oauth_login, facebook_oauth_login, get_oauth_urls

urlpatterns = [
    # Traditional authentication
    path('auth/register/', register, name='register'),
    path('auth/login/', login, name='login'),
    path('auth/logout/', logout, name='logout'),
    path('auth/profile/', get_user_profile, name='user_profile'),
    
    # OAuth authentication
    path('oauth/google/', google_oauth_login, name='google_oauth_login'),
    path('oauth/facebook/', facebook_oauth_login, name='facebook_oauth_login'),
    path('oauth/urls/', get_oauth_urls, name='oauth_urls'),
]
