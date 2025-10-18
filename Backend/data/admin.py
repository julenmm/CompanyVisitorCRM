from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    Taxonomy, Company, TaxonomyRelationship, Office, Person, 
    UserData, AuthUser, UserSession, PasswordResetToken, UserWorld, OAuthAccount
)


@admin.register(Taxonomy)
class TaxonomyAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'created_at']
    search_fields = ['name', 'description']
    list_filter = ['created_at']


class TaxonomyRelationshipInline(admin.TabularInline):
    model = TaxonomyRelationship
    extra = 1


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ['name', 'domain', 'created_at']
    search_fields = ['name', 'domain', 'description']
    list_filter = ['created_at']
    inlines = [TaxonomyRelationshipInline]


@admin.register(TaxonomyRelationship)
class TaxonomyRelationshipAdmin(admin.ModelAdmin):
    list_display = ['company', 'taxonomy', 'created_at']
    list_filter = ['taxonomy', 'created_at']
    search_fields = ['company__name', 'taxonomy__name']


class OfficeInline(admin.TabularInline):
    model = Office
    extra = 1


@admin.register(Office)
class OfficeAdmin(admin.ModelAdmin):
    list_display = ['company', 'city', 'country', 'is_headquarters', 'created_at']
    list_filter = ['is_headquarters', 'country', 'created_at']
    search_fields = ['company__name', 'city', 'country', 'address']
    raw_id_fields = ['company']


class PersonInline(admin.TabularInline):
    model = Person
    extra = 1


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'email', 'company', 'city', 'country']
    list_filter = ['country', 'created_at']
    search_fields = ['first_name', 'last_name', 'email', 'company__name']
    raw_id_fields = ['company', 'office']


@admin.register(UserData)
class UserDataAdmin(admin.ModelAdmin):
    list_display = ['person', 'city', 'country', 'logins', 'created_at']
    list_filter = ['country', 'created_at']
    search_fields = ['person__first_name', 'person__last_name', 'person__email']
    raw_id_fields = ['person']


@admin.register(AuthUser)
class AuthUserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'full_name', 'is_active', 'is_staff', 'date_joined']
    list_filter = ['is_active', 'is_staff', 'is_superuser', 'date_joined']
    search_fields = ['username', 'email', 'user_data__person__first_name', 'user_data__person__last_name']
    raw_id_fields = ['user_data']
    
    fieldsets = (
        (None, {'fields': ('username', 'password_hash')}),
        ('Personal info', {'fields': ('email', 'user_data')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = ['user', 'expires_at', 'last_used_at', 'is_expired']
    list_filter = ['expires_at', 'created_at']
    search_fields = ['user__username', 'user__email']
    raw_id_fields = ['user']


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'expires_at', 'used', 'is_expired', 'created_at']
    list_filter = ['used', 'expires_at', 'created_at']
    search_fields = ['user__username', 'user__email']
    raw_id_fields = ['user']


@admin.register(UserWorld)
class UserWorldAdmin(admin.ModelAdmin):
    list_display = ['user', 'company', 'taxonomy_interests', 'created_at']
    list_filter = ['taxonomy_interests', 'created_at']
    search_fields = ['user__username', 'company__name']
    raw_id_fields = ['user', 'company', 'taxonomy_interests']


@admin.register(OAuthAccount)
class OAuthAccountAdmin(admin.ModelAdmin):
    list_display = ['user', 'provider', 'provider_id', 'is_expired', 'created_at']
    list_filter = ['provider', 'created_at']
    search_fields = ['user__username', 'user__email', 'provider_id']
    raw_id_fields = ['user']
    readonly_fields = ['provider_data']
