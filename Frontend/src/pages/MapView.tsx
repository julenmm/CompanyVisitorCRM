import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import { SearchIcon, FilterIcon, ChevronDownIcon, PlusIcon, MinusIcon } from 'lucide-react';
import { getMyCompanies, getAllTags, Company, Tag, searchLocations, CitySuggestion, getCoordinatesByLocationId } from '../utils/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
// Fix for default marker icons in Leaflet with React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'
});
// Component to handle map click events for radius filter
const MapController: React.FC<{
  onMapClick?: (position: [number, number]) => void;
  radiusFilterEnabled: boolean;
}> = ({
  onMapClick,
  radiusFilterEnabled
}: {
  onMapClick?: (position: [number, number]) => void;
  radiusFilterEnabled: boolean;
}) => {
  // Add click event handler
  useMapEvents({
    click: e => {
      if (radiusFilterEnabled && onMapClick) {
        onMapClick([e.latlng.lat, e.latlng.lng]);
      }
    }
  });
  return null;
};

// Helper to recenter map when center changes, preserving current zoom
const RecenterOnChange: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMapEvents({});
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};
const MapView: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([40, -95]); // Default to US center
  const zoom = 4;
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'city' | 'company'>('city');
  const [isSearchTypeOpen, setIsSearchTypeOpen] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [isCitySuggestionsOpen, setIsCitySuggestionsOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [radiusFilter, setRadiusFilter] = useState<{
    enabled: boolean;
    center: [number, number] | null;
    radius: number;
  }>({
    enabled: false,
    center: null,
    radius: 100 // km
  });

  const searchTypeRef = useRef<HTMLDivElement>(null);

  // Close search type dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchTypeRef.current && !searchTypeRef.current.contains(event.target as Node)) {
        setIsSearchTypeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced city search suggestions
  useEffect(() => {
    let active = true;
    const handler = setTimeout(async () => {
      if (searchType === 'city' && searchTerm.trim().length > 0) {
        const results = await searchLocations(searchTerm.trim());
        if (!active) return;
        setCitySuggestions(results);
        setIsCitySuggestionsOpen(true);
      } else {
        setCitySuggestions([]);
        setIsCitySuggestionsOpen(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(handler);
    };
  }, [searchTerm, searchType]);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [companiesData, tagsData] = await Promise.all([
          getMyCompanies(),
          getAllTags()
        ]);
        setCompanies(companiesData);
        setTags(tagsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  // Filter companies based on search term and tags
  const filteredCompanies = companies.filter(company => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matches = searchType === 'company'
        ? company.name.toLowerCase().includes(term)
        : company.locations.some(loc => loc.city.toLowerCase().includes(term));
      if (!matches) return false;
    }
    if (selectedTags.length > 0) {
      if (!selectedTags.some(tagId => company.tags.includes(tagId))) return false;
    }
    if (radiusFilter.enabled && radiusFilter.center) {
      if (!company.locations.some(location => {
        if (!radiusFilter.center) return false;
        // Calculate distance between points (Haversine formula)
        const lat1 = radiusFilter.center[0];
        const lon1 = radiusFilter.center[1];
        const lat2 = location.coordinates.lat;
        const lon2 = location.coordinates.lon;
        const R = 6371; // Radius of the Earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in km
        return distance <= radiusFilter.radius;
      })) return false;
    }
    return true;
  });

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]);
  };
  const toggleRadiusFilter = () => {
    setRadiusFilter(prev => ({
      ...prev,
      enabled: !prev.enabled,
      center: !prev.enabled ? mapCenter : prev.center
    }));
  };
  const handleMapClick = (position: [number, number]) => {
    // Update radius filter center when map is clicked
    if (radiusFilter.enabled) {
      setRadiusFilter(prev => ({
        ...prev,
        center: position
      }));
    }
  };
  const adjustRadius = (amount: number) => {
    setRadiusFilter(prev => ({
      ...prev,
      radius: Math.max(1, Math.min(500, prev.radius + amount))
    }));
  };
  const getTagColor = (priority: number) => {
    switch (priority) {
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-yellow-500';
      case 3:
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading companies...</p>
        </div>
      </div>
    );
  }

  return <div className="h-full flex flex-col">
      {/* Search and Filter Bar */}
      <div className="relative z-[2000] bg-white p-4 border-b">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative w-36" ref={searchTypeRef}>
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isSearchTypeOpen}
                className={`flex items-center justify-between w-full pl-3 pr-3 py-2 border rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isSearchTypeOpen ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => setIsSearchTypeOpen(prev => !prev)}
              >
                <span className="capitalize">{searchType}</span>
                <ChevronDownIcon size={16} className="text-gray-500" />
              </button>
              {isSearchTypeOpen && (
                <div className="absolute left-0 top-full mt-1 w-full bg-white border rounded-md shadow-lg z-[2100]">
                  <ul role="listbox" aria-activedescendant={`search-type-${searchType}`} className="py-1">
                    <li>
                      <button
                        id="search-type-city"
                        role="option"
                        aria-selected={searchType === 'city'}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${searchType === 'city' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                        onClick={() => {
                          setSearchType('city');
                          setIsSearchTypeOpen(false);
                        }}
                      >
                        City
                      </button>
                    </li>
                    <li>
                      <button
                        id="search-type-company"
                        role="option"
                        aria-selected={searchType === 'company'}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${searchType === 'company' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                        onClick={() => {
                          setSearchType('company');
                          setIsSearchTypeOpen(false);
                        }}
                      >
                        Company
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
            <div className="relative flex-1">
              <SearchIcon size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder=""
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {isCitySuggestionsOpen && searchType === 'city' && citySuggestions.length > 0 && (
                <div className="absolute left-0 top-full mt-1 w-full bg-white border rounded-md shadow-lg z-[2200] max-h-64 overflow-auto">
                  <ul>
                    {citySuggestions.map(s => (
                      <li key={s.id}>
                        <button
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex justify-between"
                          onClick={async () => {
                            const coords = await getCoordinatesByLocationId(s.id);
                            if (coords && typeof coords.latitude === 'number' && typeof coords.longitude === 'number') {
                              setMapCenter([coords.latitude, coords.longitude]);
                            }
                            setIsCitySuggestionsOpen(false);
                          }}
                        >
                          <span>{s.ascii_name}, {s.country}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <button className={`flex items-center px-4 py-2 border rounded-md ${radiusFilter.enabled ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white text-gray-700'}`} onClick={toggleRadiusFilter}>
              <span>Radius Filter</span>
              {radiusFilter.enabled && <span className="ml-2 text-xs bg-blue-100 px-2 py-0.5 rounded-full">
                  {radiusFilter.radius} km
                </span>}
            </button>
            {radiusFilter.enabled && <div className="hidden md:flex items-center space-x-2 px-3 py-2 border rounded-md bg-white">
                <button className="p-1 hover:bg-gray-100 rounded" onClick={() => adjustRadius(-1)} aria-label="Decrease radius">
                  <MinusIcon size={16} />
                </button>
                <input type="range" min="1" max="500" step="1" value={radiusFilter.radius} onChange={e => setRadiusFilter(prev => ({
            ...prev,
            radius: parseInt(e.target.value)
          }))} className="w-40" />
                <button className="p-1 hover:bg-gray-100 rounded" onClick={() => adjustRadius(1)} aria-label="Increase radius">
                  <PlusIcon size={16} />
                </button>
              </div>}
            <div className="relative">
              <button className="flex items-center space-x-1 px-4 py-2 border rounded-md bg-white text-gray-700" onClick={() => setIsFilterOpen(!isFilterOpen)}>
                <FilterIcon size={18} />
                <span>Filter</span>
                <ChevronDownIcon size={18} />
              </button>
              {isFilterOpen && <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-[2100] border">
                  <div className="p-3 border-b">
                    <h3 className="font-medium text-gray-700">
                      Filter by Tags
                    </h3>
                  </div>
                  <div className="p-3 max-h-60 overflow-y-auto">
                    {tags.map(tag => <div key={tag.id} className="flex items-center mb-2">
                        <input type="checkbox" id={`tag-${tag.id}`} checked={selectedTags.includes(tag.id)} onChange={() => toggleTag(tag.id)} className="mr-2" />
                        <label htmlFor={`tag-${tag.id}`} className="flex items-center">
                          <span className={`w-3 h-3 rounded-full mr-2 ${getTagColor(tag.priority)}`}></span>
                          {tag.name}
                        </label>
                      </div>)}
                  </div>
                  {radiusFilter.enabled && <div className="p-3 border-t">
                      <h3 className="font-medium text-gray-700 mb-2">
                        Radius (km)
                      </h3>
                      <input type="range" min="1" max="500" step="1" value={radiusFilter.radius} onChange={e => setRadiusFilter(prev => ({
                  ...prev,
                  radius: parseInt(e.target.value)
                }))} className="w-full" />
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>1km</span>
                        <span>{radiusFilter.radius}km</span>
                        <span>500km</span>
                      </div>
                    </div>}
                </div>}
            </div>
          </div>
        </div>
      </div>
      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer style={{
        height: '100%',
        width: '100%'
      }} center={mapCenter} zoom={zoom} scrollWheelZoom={true}>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <RecenterOnChange center={mapCenter} />
          <MapController onMapClick={handleMapClick} radiusFilterEnabled={radiusFilter.enabled} />
          {/* Radius circle */}
          {radiusFilter.enabled && radiusFilter.center && <Circle center={radiusFilter.center} radius={radiusFilter.radius * 1000} // Convert km to meters
        pathOptions={{
          color: 'blue',
          fillColor: 'blue',
          fillOpacity: 0.1
        }} />}
          {/* Company markers */}
          {filteredCompanies.flatMap(company => company.locations.map(location => <Marker key={location.id} position={[location.coordinates.lat, location.coordinates.lon]}>
                <Popup>
                  <div>
                    <h3 className="font-bold">{company.name}</h3>
                    <p className="text-sm">{location.address}</p>
                    <p className="text-sm">
                      {location.city}, {location.country}
                    </p>
                    {location.isHQ && <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        Headquarters
                      </span>}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {company.tags.map(tagId => {
                  const tag = tags.find(t => t.id === tagId);
                  return tag ? <span key={tag.id} className={`text-xs px-2 py-0.5 rounded-full text-white ${getTagColor(tag.priority)}`}>
                            {tag.name}
                          </span> : null;
                })}
                    </div>
                  </div>
                </Popup>
              </Marker>))}
        </MapContainer>
        {/* Radius controls moved into toolbar above map */}
        {/* Instructions overlay - moved to top-left with higher z-index */}
        {radiusFilter.enabled && <div className="absolute top-4 left-4 bg-white bg-opacity-90 px-4 py-2 rounded-md shadow-md z-40">
            <p className="text-sm text-gray-700">
              Click anywhere on the map to move the radius filter
            </p>
          </div>}
      </div>
    </div>;
};
export default MapView;