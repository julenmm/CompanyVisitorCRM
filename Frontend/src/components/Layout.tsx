import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { MapIcon, ListIcon, PlusIcon, MenuIcon, XIcon } from 'lucide-react';
const Layout: React.FC = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold">R</span>
            </div>
            <span className="font-semibold text-lg text-gray-800">
              ResourceDB
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className={`flex items-center space-x-1 px-3 py-2 rounded-md ${location.pathname === '/' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}>
              <MapIcon size={18} />
              <span>Map View</span>
            </Link>
            <Link to="/list" className={`flex items-center space-x-1 px-3 py-2 rounded-md ${location.pathname === '/list' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}>
              <ListIcon size={18} />
              <span>List View</span>
            </Link>
            <button className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              <PlusIcon size={18} />
              <span>Add Client</span>
            </button>
          </div>
          <button className="md:hidden text-gray-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
        {/* Mobile menu */}
        {isMenuOpen && <div className="md:hidden px-4 py-2 pb-3 space-y-2 border-t">
            <Link to="/" className={`flex items-center space-x-1 px-3 py-2 rounded-md ${location.pathname === '/' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`} onClick={() => setIsMenuOpen(false)}>
              <MapIcon size={18} />
              <span>Map View</span>
            </Link>
            <Link to="/list" className={`flex items-center space-x-1 px-3 py-2 rounded-md ${location.pathname === '/list' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`} onClick={() => setIsMenuOpen(false)}>
              <ListIcon size={18} />
              <span>List View</span>
            </Link>
            <button className="flex w-full items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              <PlusIcon size={18} />
              <span>Add Client</span>
            </button>
          </div>}
      </header>
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>;
};
export default Layout;