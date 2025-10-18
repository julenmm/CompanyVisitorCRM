// Mock data for development and testing
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
export const mockTags: Tag[] = [{
  id: 'tag1',
  name: 'Key Account',
  priority: 1
}, {
  id: 'tag2',
  name: 'Prospect',
  priority: 2
}, {
  id: 'tag3',
  name: 'Partner',
  priority: 1
}, {
  id: 'tag4',
  name: 'Inactive',
  priority: 3
}, {
  id: 'tag5',
  name: 'New Client',
  priority: 2
}];
export const mockCompanies: Company[] = [{
  id: 'comp1',
  name: 'Acme Corporation',
  locations: [{
    id: 'loc1',
    coordinates: {
      lat: 40.7128,
      lon: -74.006
    },
    address: '123 Broadway',
    city: 'New York',
    country: 'USA',
    isHQ: true
  }, {
    id: 'loc2',
    coordinates: {
      lat: 34.0522,
      lon: -118.2437
    },
    address: '456 Hollywood Blvd',
    city: 'Los Angeles',
    country: 'USA'
  }],
  people: ['person1', 'person2'],
  tags: ['tag1', 'tag3']
}, {
  id: 'comp2',
  name: 'TechStart Inc',
  locations: [{
    id: 'loc3',
    coordinates: {
      lat: 37.7749,
      lon: -122.4194
    },
    address: '789 Market St',
    city: 'San Francisco',
    country: 'USA',
    isHQ: true
  }],
  people: ['person3'],
  tags: ['tag2', 'tag5']
}, {
  id: 'comp3',
  name: 'Global Logistics',
  locations: [{
    id: 'loc4',
    coordinates: {
      lat: 51.5074,
      lon: -0.1278
    },
    address: '10 Downing Street',
    city: 'London',
    country: 'UK',
    isHQ: true
  }, {
    id: 'loc5',
    coordinates: {
      lat: 48.8566,
      lon: 2.3522
    },
    address: '15 Rue de Rivoli',
    city: 'Paris',
    country: 'France'
  }],
  people: ['person4', 'person5'],
  tags: ['tag1']
}, {
  id: 'comp4',
  name: 'Innovative Solutions',
  locations: [{
    id: 'loc6',
    coordinates: {
      lat: 41.8781,
      lon: -87.6298
    },
    address: '233 S Wacker Dr',
    city: 'Chicago',
    country: 'USA',
    isHQ: true
  }],
  people: ['person6'],
  tags: ['tag4']
}, {
  id: 'comp5',
  name: 'EcoFriendly Products',
  locations: [{
    id: 'loc7',
    coordinates: {
      lat: 47.6062,
      lon: -122.3321
    },
    address: '400 Broad St',
    city: 'Seattle',
    country: 'USA',
    isHQ: true
  }],
  people: ['person7', 'person8'],
  tags: ['tag3', 'tag5']
}];
export const mockPeople: Person[] = [{
  id: 'person1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@acme.com',
  phoneNumber: '+1-555-123-4567',
  companyId: 'comp1',
  tags: ['tag1']
}, {
  id: 'person2',
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane.smith@acme.com',
  phoneNumber: '+1-555-987-6543',
  companyId: 'comp1',
  tags: ['tag3']
}, {
  id: 'person3',
  firstName: 'Michael',
  lastName: 'Johnson',
  email: 'michael.j@techstart.com',
  phoneNumber: '+1-555-456-7890',
  companyId: 'comp2',
  tags: ['tag2']
}, {
  id: 'person4',
  firstName: 'Sarah',
  lastName: 'Williams',
  email: 'sarah.w@globallogistics.com',
  phoneNumber: '+44-20-1234-5678',
  companyId: 'comp3',
  tags: ['tag1']
}, {
  id: 'person5',
  firstName: 'Robert',
  lastName: 'Brown',
  email: 'robert.b@globallogistics.com',
  phoneNumber: '+33-1-2345-6789',
  companyId: 'comp3',
  tags: []
}, {
  id: 'person6',
  firstName: 'Emily',
  lastName: 'Davis',
  email: 'emily.d@innovative.com',
  phoneNumber: '+1-555-234-5678',
  companyId: 'comp4',
  tags: ['tag4']
}, {
  id: 'person7',
  firstName: 'David',
  lastName: 'Wilson',
  email: 'david.w@ecofriendly.com',
  phoneNumber: '+1-555-345-6789',
  companyId: 'comp5',
  tags: ['tag3']
}, {
  id: 'person8',
  firstName: 'Lisa',
  lastName: 'Taylor',
  email: 'lisa.t@ecofriendly.com',
  phoneNumber: '+1-555-456-7891',
  companyId: 'comp5',
  tags: ['tag5']
}];
export const getAllCompanies = (): Company[] => {
  return mockCompanies;
};
export const getAllPeople = (): Person[] => {
  return mockPeople;
};
export const getAllTags = (): Tag[] => {
  return mockTags;
};
export const getCompanyById = (id: string): Company | undefined => {
  return mockCompanies.find(company => company.id === id);
};
export const getPersonById = (id: string): Person | undefined => {
  return mockPeople.find(person => person.id === id);
};
export const getTagById = (id: string): Tag | undefined => {
  return mockTags.find(tag => tag.id === id);
};
export const getPeopleByCompanyId = (companyId: string): Person[] => {
  return mockPeople.filter(person => person.companyId === companyId);
};
export const getTagsByIds = (tagIds: string[]): Tag[] => {
  return mockTags.filter(tag => tagIds.includes(tag.id));
};