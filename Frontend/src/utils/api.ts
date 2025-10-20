// API service for CompanyMap
const API_BASE_URL = 'http://localhost:8000/api';
import authService from '../services/auth';

export interface Tag {
  id: string;
  name: string;
  priority: number;
}

export interface Location {
  id: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  address: string;
  city: string;
  country: string;
  isHQ?: boolean;
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  companyId: string;
  tags: string[];
}

export interface Company {
  id: string;
  name: string;
  locations: Location[];
  people: string[]; // IDs of associated people
  tags: string[];
}

// API functions
export const getAllCompanies = async (): Promise<Company[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/companies/`);
    if (!response.ok) throw new Error('Failed to fetch companies');
    return await response.json();
  } catch (error) {
    console.error('Error fetching companies:', error);
    return [];
  }
};

// Authenticated: get companies for current user
export const getMyCompanies = async (): Promise<Company[]> => {
  try {
    const token = authService.getToken();
    const response = await fetch(`${API_BASE_URL}/companies/my/`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error('Failed to fetch companies');
    return await response.json();
  } catch (error) {
    console.error('Error fetching user companies:', error);
    return [];
  }
};

export const getAllPeople = async (): Promise<Person[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/people/`);
    if (!response.ok) throw new Error('Failed to fetch people');
    return await response.json();
  } catch (error) {
    console.error('Error fetching people:', error);
    return [];
  }
};

export const getAllTags = async (): Promise<Tag[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/tags/`);
    if (!response.ok) throw new Error('Failed to fetch tags');
    return await response.json();
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
};

export const getCompanyById = async (id: string): Promise<Company | undefined> => {
  try {
    const response = await fetch(`${API_BASE_URL}/companies/${id}/`);
    if (!response.ok) throw new Error('Failed to fetch company');
    return await response.json();
  } catch (error) {
    console.error('Error fetching company:', error);
    return undefined;
  }
};

export const getPersonById = async (id: string): Promise<Person | undefined> => {
  try {
    const response = await fetch(`${API_BASE_URL}/people/${id}/`);
    if (!response.ok) throw new Error('Failed to fetch person');
    return await response.json();
  } catch (error) {
    console.error('Error fetching person:', error);
    return undefined;
  }
};

export const getTagById = async (id: string): Promise<Tag | undefined> => {
  try {
    const response = await fetch(`${API_BASE_URL}/tags/${id}/`);
    if (!response.ok) throw new Error('Failed to fetch tag');
    return await response.json();
  } catch (error) {
    console.error('Error fetching tag:', error);
    return undefined;
  }
};

export const getPeopleByCompanyId = async (companyId: string): Promise<Person[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/people/?company=${companyId}`);
    if (!response.ok) throw new Error('Failed to fetch people by company');
    return await response.json();
  } catch (error) {
    console.error('Error fetching people by company:', error);
    return [];
  }
};

export const getTagsByIds = async (tagIds: string[]): Promise<Tag[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/tags/?ids=${tagIds.join(',')}`);
    if (!response.ok) throw new Error('Failed to fetch tags by IDs');
    return await response.json();
  } catch (error) {
    console.error('Error fetching tags by IDs:', error);
    return [];
  }
};

// Location search and coordinates
export interface CitySuggestion {
  id: string;
  ascii_name: string;
  country: string;
}

export const searchLocations = async (searchTerm: string): Promise<CitySuggestion[]> => {
  try {
    const url = new URL(`${API_BASE_URL}/locations/search/`);
    url.searchParams.set('search_term', searchTerm);
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Failed to search locations');
    return await response.json();
  } catch (error) {
    console.error('Error searching locations:', error);
    return [];
  }
};

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export const getCoordinatesByLocationId = async (locationId: string): Promise<Coordinates | undefined> => {
  try {
    const url = new URL(`${API_BASE_URL}/locations/coordinates/`);
    url.searchParams.set('location_id', locationId);
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Failed to fetch coordinates');
    return await response.json();
  } catch (error) {
    console.error('Error fetching coordinates:', error);
    return undefined;
  }
};
