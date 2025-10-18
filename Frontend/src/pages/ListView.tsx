import React, { useEffect, useState } from 'react';
import { SearchIcon, FilterIcon, ChevronDownIcon, MapPinIcon, UsersIcon, TagIcon, ArrowUpDownIcon } from 'lucide-react';
import { mockCompanies, mockPeople, mockTags, Company, Person, Tag, getPeopleByCompanyId } from '../utils/mockData';
const ListView: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>(mockCompanies);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  // Filter and sort companies
  useEffect(() => {
    let filtered = [...mockCompanies];
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(company => company.name.toLowerCase().includes(term));
    }
    // Apply tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(company => selectedTags.some(tagId => company.tags.includes(tagId)));
    }
    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        let valueA, valueB;
        switch (sortField) {
          case 'name':
            valueA = a.name;
            valueB = b.name;
            break;
          case 'locations':
            valueA = a.locations.length;
            valueB = b.locations.length;
            break;
          case 'people':
            valueA = a.people.length;
            valueB = b.people.length;
            break;
          default:
            return 0;
        }
        if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    setCompanies(filtered);
  }, [searchTerm, selectedTags, sortField, sortDirection]);
  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]);
  };
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
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
  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return <span className={`inline-block ml-1 transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`}>
        ▲
      </span>;
  };
  return <div className="h-full flex flex-col bg-gray-100">
      {/* Search and Filter Bar */}
      <div className="bg-white p-4 border-b">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <SearchIcon size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search companies..." className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className="relative">
            <button className="flex items-center space-x-1 px-4 py-2 border rounded-md bg-white text-gray-700" onClick={() => setIsFilterOpen(!isFilterOpen)}>
              <FilterIcon size={18} />
              <span>Filter</span>
              <ChevronDownIcon size={18} />
            </button>
            {isFilterOpen && <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-10 border">
                <div className="p-3 border-b">
                  <h3 className="font-medium text-gray-700">Filter by Tags</h3>
                </div>
                <div className="p-3 max-h-60 overflow-y-auto">
                  {mockTags.map(tag => <div key={tag.id} className="flex items-center mb-2">
                      <input type="checkbox" id={`tag-${tag.id}`} checked={selectedTags.includes(tag.id)} onChange={() => toggleTag(tag.id)} className="mr-2" />
                      <label htmlFor={`tag-${tag.id}`} className="flex items-center">
                        <span className={`w-3 h-3 rounded-full mr-2 ${getTagColor(tag.priority)}`}></span>
                        {tag.name}
                      </label>
                    </div>)}
                </div>
              </div>}
          </div>
        </div>
      </div>
      {/* List View */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="bg-white rounded-md shadow">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 font-medium text-gray-700 border-b">
            <div className="col-span-4 sm:col-span-5 flex items-center cursor-pointer" onClick={() => handleSort('name')}>
              Company {getSortIcon('name')}
            </div>
            <div className="col-span-3 sm:col-span-2 flex items-center cursor-pointer" onClick={() => handleSort('locations')}>
              <MapPinIcon size={16} className="mr-1" /> Locations{' '}
              {getSortIcon('locations')}
            </div>
            <div className="col-span-3 sm:col-span-2 flex items-center cursor-pointer" onClick={() => handleSort('people')}>
              <UsersIcon size={16} className="mr-1" /> People{' '}
              {getSortIcon('people')}
            </div>
            <div className="col-span-2 sm:col-span-3 flex items-center">
              <TagIcon size={16} className="mr-1" /> Tags
            </div>
          </div>
          {/* Table Body */}
          <div className="divide-y">
            {companies.length === 0 ? <div className="p-8 text-center text-gray-500">
                No companies match your search criteria
              </div> : companies.map(company => <div key={company.id} className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50">
                  <div className="col-span-4 sm:col-span-5">
                    <div className="font-medium">{company.name}</div>
                    <div className="text-sm text-gray-500">
                      {company.locations.find(loc => loc.isHQ)?.city || company.locations[0]?.city}
                      ,
                      {company.locations.find(loc => loc.isHQ)?.country || company.locations[0]?.country}
                    </div>
                  </div>
                  <div className="col-span-3 sm:col-span-2 flex items-center">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                      {company.locations.length}
                    </span>
                  </div>
                  <div className="col-span-3 sm:col-span-2 flex items-center">
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                      {company.people.length}
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <div className="flex flex-wrap gap-1">
                      {company.tags.map(tagId => {
                  const tag = mockTags.find(t => t.id === tagId);
                  return tag ? <span key={tag.id} className={`text-xs px-2 py-0.5 rounded-full text-white ${getTagColor(tag.priority)}`}>
                            {tag.name}
                          </span> : null;
                })}
                    </div>
                  </div>
                </div>)}
          </div>
        </div>
      </div>
    </div>;
};
export default ListView;