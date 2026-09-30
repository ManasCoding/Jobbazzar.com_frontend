import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, ZoomControl, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import useSupercluster from 'use-supercluster';
import { 
  MapPin, Search, ChevronDown, User, Building2, Building, Rocket, 
  Users, Briefcase, Map, List, Globe, Navigation, X, CheckCircle2,
  Telescope, Layers, Network, TrendingUp, ArrowRight, Map as MapIcon, ChevronRight,
  Phone, Mail, Loader2, ExternalLink, Menu
} from 'lucide-react';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper for custom colored cluster icons
const createClusterIcon = (count, colorClass) => {
  let bgClass, ringClass;
  if (colorClass === 'green') {
    bgClass = 'bg-[#8de098]';
    ringClass = 'bg-[#dcf4e0]';
  } else if (colorClass === 'yellow') {
    bgClass = 'bg-[#ffda6c]';
    ringClass = 'bg-[#fff2cc]';
  } else if (colorClass === 'orange') {
    bgClass = 'bg-[#ffb076]';
    ringClass = 'bg-[#ffe4d0]';
  } else {
    // red
    bgClass = 'bg-[#ff7b88]';
    ringClass = 'bg-[#ffdde0]';
  } 

  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center w-12 h-12 transition-transform hover:scale-105">
        <div class="absolute inset-0 rounded-full ${ringClass} opacity-80 shadow-md"></div>
        <div class="relative w-8 h-8 rounded-full ${bgClass} flex items-center justify-center shadow-sm z-10 border border-white/50">
          <span class="text-xs font-bold text-gray-800">${count}</span>
        </div>
      </div>
    `,
    className: 'custom-cluster-icon bg-transparent border-0',
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
};

const createCompanyIcon = (company) => {
  return L.divIcon({
    html: `
      <div class="relative group cursor-pointer transition-transform hover:scale-110 hover:z-50">
        <div class="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.15)] border-2 border-white overflow-hidden">
          <div class="w-full h-full flex items-center justify-center ${company.bg}">
            ${company.logo && typeof company.logo === 'string' && company.logo.startsWith('http') 
              ? `<img src="${company.logo}" style="width: 100%; height: 100%; object-fit: contain; padding: 2px;" alt="logo" />` 
              : (company.logo || company.name?.charAt(0) || '')}
          </div>
        </div>
        ${company.jobs > 0 ? `
          <div class="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border border-white leading-none z-10">
            ${company.jobs}
          </div>
        ` : ''}
      </div>
    `,
    className: 'custom-company-icon bg-transparent border-0',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
};

// Stacked group icon — logos sit on top of each other, hover fans them out
const createGroupIcon = (companies) => {
  const count = companies.length;
  const spread = 36; // px distance each icon spreads when hovered

  // Pre-compute spread positions in a fan/arc
  const positions = companies.map((_, i) => {
    const angle = (i / Math.max(count - 1, 1)) * 180 - 90; // arc from -90 to +90 deg
    const rad = (angle * Math.PI) / 180;
    const x = Math.round(Math.sin(rad) * spread);
    const y = Math.round(-Math.abs(Math.cos(rad)) * spread); // always go up
    return { x, y };
  });

  const posVars = positions.map((p, i) => `--x${i}:${p.x}px;--y${i}:${p.y}px;`).join('');

  const logoItems = companies.map((company, i) => {
    const logoHtml = company.logo && typeof company.logo === 'string' && company.logo.startsWith('http')
      ? `<img src="${company.logo}" style="width:100%;height:100%;object-fit:contain;padding:2px;" alt="logo" />`
      : `<span style="font-size:14px;font-weight:700;color:#5b61f4;">${company.name?.charAt(0) || '?'}</span>`;

    return `
      <div class="stacked-logo" style="z-index:${i};--xi:var(--x${i});--yi:var(--y${i});">
        <div style="width:40px;height:40px;border-radius:50%;background:white;border:2px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.18);overflow:hidden;display:flex;align-items:center;justify-content:center;">
          ${logoHtml}
        </div>
        <div class="logo-tooltip">${company.name}</div>
      </div>`;
  }).join('');

  return L.divIcon({
    html: `
      <style>
        .group-stack { position:relative; width:44px; height:44px; }
        .stacked-logo {
          position:absolute; top:0; left:0;
          transition: transform 0.25s cubic-bezier(.34,1.56,.64,1), opacity 0.2s;
          cursor:pointer;
        }
        .group-stack:hover .stacked-logo {
          transform: translate(var(--xi), var(--yi)) scale(1.08);
        }
        .logo-tooltip {
          position:absolute; bottom:calc(100% + 4px); left:50%; transform:translateX(-50%);
          background:rgba(0,0,0,0.75); color:white; font-size:10px; white-space:nowrap;
          padding:2px 6px; border-radius:4px; pointer-events:none;
          opacity:0; transition:opacity 0.15s; z-index:99;
        }
        .group-stack:hover .stacked-logo:hover .logo-tooltip { opacity:1; }
        .group-badge {
          position:absolute; top:-5px; right:-5px;
          background:#5b61f4; color:white; font-size:9px; font-weight:700;
          width:18px; height:18px; border-radius:50%; display:flex;
          align-items:center; justify-content:center; border:2px solid white;
          z-index:99;
        }
      </style>
      <div class="group-stack" style="${posVars}">
        ${logoItems}
        <div class="group-badge">${count}</div>
      </div>
    `,
    className: 'custom-group-icon bg-transparent border-0',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
};


// Map events component to update bounds & zoom for clustering
const MapEvents = ({ setBounds, setZoom }) => {
  const map = useMapEvents({
    moveend: () => {
      setBounds(map.getBounds());
      setZoom(map.getZoom());
    },
    zoomend: () => {
      setBounds(map.getBounds());
      setZoom(map.getZoom());
    }
  });

  useEffect(() => {
    setBounds(map.getBounds());
    setZoom(map.getZoom());
  }, [map, setBounds, setZoom]);

  return null;
};

// Generate an initial mock database combining top companies and fake startups 
// to demonstrate realistic geographical clustering across zoom levels.
const Home = () => {
  const [showRightCard, setShowRightCard] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Filter Dropdown state
  const [activeFilter, setActiveFilter] = useState(null);
  const filterBarRef = useRef(null);

  // Sidebar toggle state
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterBarRef.current && !filterBarRef.current.contains(e.target)) {
        setActiveFilter(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clustering state
  const mapRef = useRef();
  const [bounds, setBounds] = useState(null);
  const [zoom, setZoom] = useState(12);

  const [apiCompanies, setApiCompanies] = useState([]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/v1/companies?limit=1000');
        const data = await response.json();
        if (data.success) {
          const companyList = Array.isArray(data.data) ? data.data : (data.data?.companies || []);
          const formatted = companyList.map((c) => ({
            id: 'api-' + c._id,
            name: c.name,
            category: c.companyType || 'Technology',
            location: c.address || (c.area ? `${c.area}, Bhubaneswar` : 'Bhubaneswar'),
            address: c.address || '',
            area: c.area || '',
            city: c.city || 'Bhubaneswar',
            jobs: c.openJobs || 0,
            logo: c.logo || c.name.charAt(0).toUpperCase(),
            bg: c.logo ? 'bg-white' : 'bg-[#eef0ff] text-[#5b61f4] font-bold text-lg',
            lat: parseFloat(c.latitude) || 20.3015,
            lng: parseFloat(c.longitude) || 85.8312,
            phone: c.phone || '',
            email: c.email || '',
            website: c.website || '',
            linkedin: c.linkedin || '',
            employeeCount: c.employeeCount || '',
            foundedYear: c.foundedYear || '',
            description: c.description || '',
            googleMapUrl: c.googleMapUrl || '',
          }));
          setApiCompanies(formatted);
        }
      } catch (err) {
        console.error('Failed to fetch companies', err);
      }
    };
    fetchCompanies();
  }, []);

  const allCompanies = apiCompanies;
  const topCompanies = apiCompanies.slice(0, 5);

  const totalCompanies = allCompanies.length;
  const totalStartups = allCompanies.filter(c => {
    const cat = (c.category || '').toLowerCase();
    const ec = (c.employeeCount || '').toLowerCase();
    return cat.includes('startup') || ec.includes('1-10') || ec.includes('11-50');
  }).length;

  const totalMidLevel = allCompanies.filter(c => {
    const ec = (c.employeeCount || '').toLowerCase();
    return ec.includes('51-200') || ec.includes('201-500');
  }).length;

  const totalMNCs = allCompanies.filter(c => {
    const cat = (c.category || '').toLowerCase();
    const ec = (c.employeeCount || '').toLowerCase();
    return cat.includes('mnc') || ec.includes('1,001') || ec.includes('5,001') || ec.includes('10,000') || ec.includes('501-1000') || ec.includes('501-1,000');
  }).length;

  // Convert companies to GeoJSON feature points for supercluster
  const points = allCompanies.map(company => ({
    type: 'Feature',
    properties: { cluster: false, companyId: company.id, ...company },
    geometry: {
      type: 'Point',
      coordinates: [company.lng, company.lat]
    }
  }));

  const mapBounds = bounds ? [
    bounds.getSouthWest().lng,
    bounds.getSouthWest().lat,
    bounds.getNorthEast().lng,
    bounds.getNorthEast().lat
  ] : null;

  // useSupercluster hook calculates the clusters automatically based on zoom & bounds
  const { clusters, supercluster } = useSupercluster({
    points,
    bounds: mapBounds,
    zoom,
    options: { radius: 75, maxZoom: 15 } // At zoom 16+ it splits into individual markers
  });

  // Search & Auto-Suggestions state (Bhubaneswar Grounded)
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchContainerRef = useRef(null);

  // Fetch Bhubaneswar company suggestions as user types or focuses
  useEffect(() => {
    let isMounted = true;
    const fetchSuggestions = async () => {
      try {
        setLoadingSuggestions(true);
        const res = await axios.get(`http://localhost:5000/api/v1/companies/suggestions?q=${encodeURIComponent(searchTerm)}`);
        if (isMounted && res.data?.success) {
          setSuggestions(res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch company suggestions:', err);
      } finally {
        if (isMounted) setLoadingSuggestions(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 180);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchTerm]);

  // Click outside to close suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCompanyClick = (company) => {
    setSelectedCompany(company);
    setShowRightCard(true);
  };

  const handleSelectSuggestion = (sug) => {
    setSearchTerm(sug.name);
    setShowSuggestions(false);

    const lat = sug.latitude || 20.2961;
    const lng = sug.longitude || 85.8245;

    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 15, { animate: true });
    }

    const compData = {
      id: sug._id || `sug-${sug.name}`,
      name: sug.name,
      category: sug.companyType || 'IT Services',
      location: sug.address || (sug.area ? `${sug.area}, Bhubaneswar` : 'Bhubaneswar'),
      area: sug.area || 'Bhubaneswar',
      city: sug.city || 'Bhubaneswar',
      jobs: 0,
      logo: sug.logo ? (
        <img src={sug.logo} alt="Logo" className="w-full h-full object-contain p-1" />
      ) : (
        <div className="w-full h-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
          {sug.name.charAt(0).toUpperCase()}
        </div>
      ),
      bg: 'bg-white',
      lat,
      lng,
      website: sug.website || '',
      phone: sug.phone || '',
      email: sug.email || '',
      address: sug.address || '',
      employeeCount: sug.employeeCount || '',
      foundedYear: sug.foundedYear || '',
      description: sug.description || ''
    };

    setSelectedCompany(compData);
    setShowRightCard(true);
  };

  // Dynamic Live Company Researcher for ANY company in Bhubaneswar
  const [isDynamicFetching, setIsDynamicFetching] = useState(false);
  const [dynamicFetchStatus, setDynamicFetchStatus] = useState('');

  const handleLiveCompanyFetch = async (queryName) => {
    const target = (queryName || searchTerm).trim();
    if (!target) return;

    setIsDynamicFetching(true);
    setDynamicFetchStatus(`AI is retrieving verified details for "${target}" across LinkedIn & Official Website...`);
    setShowSuggestions(false);

    try {
      const res = await axios.post('http://localhost:5000/api/v1/companies/fetch', { companyName: target });
      const comp = res.data.data;
      if (comp && comp.name) {
        const lat = parseFloat(comp.latitude) || 20.2961;
        const lng = parseFloat(comp.longitude) || 85.8245;

        const newComp = {
          id: 'dynamic-' + comp.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: comp.name,
          category: comp.companyType || 'IT Services',
          location: comp.address || `${comp.area || 'Bhubaneswar'}, Odisha`,
          area: comp.area || 'Bhubaneswar',
          city: comp.city || 'Bhubaneswar',
          jobs: 0,
          logo: comp.logo ? (
            <img src={comp.logo} alt="Logo" className="w-full h-full object-contain p-1" onError={(e) => { e.target.style.display = 'none'; }} />
          ) : (
            <div className="w-full h-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
              {comp.name.charAt(0).toUpperCase()}
            </div>
          ),
          bg: 'bg-white',
          lat,
          lng,
          website: comp.website || '',
          linkedin: comp.linkedin || '',
          careersUrl: comp.careersUrl || '',
          phone: comp.phone || '',
          email: comp.email || '',
          address: comp.address || `${comp.area || 'Bhubaneswar'}, Odisha`,
          employeeCount: comp.employeeCount || '',
          foundedYear: comp.foundedYear || '',
          description: comp.description || ''
        };

        // Add to active apiCompanies so the marker drops onto map
        setApiCompanies(prev => {
          const filtered = prev.filter(c => c.name.toLowerCase() !== comp.name.toLowerCase());
          return [newComp, ...filtered];
        });

        // Center map directly on the company coordinates
        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 15, { animate: true });
        }

        // Open detailed company card
        setSelectedCompany(newComp);
        setShowRightCard(true);
        setSearchTerm(comp.name);
      }
    } catch (err) {
      console.error('Failed to fetch company details:', err);
      alert(err.response?.data?.message || `Could not find verified information for "${target}".`);
    } finally {
      setIsDynamicFetching(false);
      setDynamicFetchStatus('');
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#f8f9fa] font-sans overflow-hidden">
      
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 bg-white border-b border-gray-100 shrink-0 gap-2">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#eef0ff] rounded-xl flex items-center justify-center">
            <MapPin className="text-[#5b61f4] w-5 h-5 sm:w-6 sm:h-6 fill-[#5b61f4]" />
          </div>
          <h1 className="font-bold text-gray-900 text-lg sm:text-2xl tracking-tight text-[#5b61f4]">Jobbazzar</h1>
        </div>

        {/* Search Bar - hidden on mobile, full on sm+ */}
        <div className="flex-1 max-w-3xl px-2 sm:px-8 relative hidden sm:block" ref={searchContainerRef}>
          <div className="relative flex items-center w-full h-11 bg-gray-50 rounded-lg border border-gray-200 px-4 focus-within:border-[#5b61f4] focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <Search className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleLiveCompanyFetch(searchTerm);
                }
              }}
              placeholder="Search ANY company in Bhubaneswar (e.g. ESSPL, Silicon Techlabs, Muvi, CSM)..." 
              className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
            />
            {isDynamicFetching ? (
              <div className="flex items-center gap-1.5 text-xs text-blue-600 font-bold mr-2 shrink-0 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>AI Researching...</span>
              </div>
            ) : loadingSuggestions ? (
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin mr-2 shrink-0" />
            ) : null}
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Autocomplete Suggestion Dropdown */}
          {showSuggestions && (
            <div className="absolute left-8 right-8 top-13 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 animate-in fade-in-50 duration-150 max-h-[420px] overflow-y-auto">
              <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 flex items-center justify-between text-xs font-semibold text-blue-900">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" /> Companies in &amp; around Bhubaneswar
                </span>
                <span className="text-[11px] text-blue-600 font-medium">{suggestions.length} matched</span>
              </div>

              {suggestions.length > 0 && (
                <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                  {suggestions.map((sug, i) => (
                    <div
                      key={sug._id || i}
                      onClick={() => handleSelectSuggestion(sug)}
                      className="p-3 hover:bg-blue-50/60 cursor-pointer transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        {sug.logo ? (
                          <img 
                            src={sug.logo} 
                            alt="logo" 
                            className="w-9 h-9 rounded-lg object-contain bg-white border p-1 shadow-2xs shrink-0" 
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-sm">
                            {sug.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#5b61f4] transition-colors leading-tight">
                              {sug.name}
                            </h4>
                            {sug.area && (
                              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5" /> {sug.area}
                              </span>
                            )}
                            {sug.companyType && (
                              <span className="text-[10px] font-medium bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                                {sug.companyType}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-3">
                            {sug.address && (
                              <span className="truncate max-w-[280px] text-gray-600">{sug.address}</span>
                            )}
                            {sug.phone && (
                              <span className="flex items-center gap-1 font-medium text-gray-700 shrink-0">
                                <Phone className="w-3 h-3 text-gray-400" /> {sug.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-[#5b61f4] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                        View on Map →
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Dynamic AI Deep-Search option for ANY company */}
              {searchTerm.trim().length > 1 && (
                <div
                  onClick={() => handleLiveCompanyFetch(searchTerm)}
                  className="p-3 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 hover:from-blue-100 hover:to-indigo-100 cursor-pointer flex items-center justify-between text-blue-900 font-bold text-xs border-t border-blue-200/80 transition-all shadow-inner"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
                    <span>Retrieve ALL details for "{searchTerm}" in Bhubaneswar with AI</span>
                  </span>
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-md text-[11px] shadow-sm font-semibold flex items-center gap-1">
                    Research with AI ➔
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile search icon */}
        <button
          className="sm:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
          onClick={() => setShowSuggestions(!showSuggestions)}
        >
          <Search className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <Link to="/signin" className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-200 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg bg-white shadow-sm hover:bg-gray-50 transition-colors">
            <User className="w-4 h-4" /> <span className="hidden sm:inline">Sign In</span>
          </Link>
        </div>
      </header>

      {/* Mobile Search Bar (shown only when toggled on small screens) */}
      {showSuggestions && (
        <div className="sm:hidden px-3 py-2 bg-white border-b border-gray-100 shrink-0" ref={searchContainerRef}>
          <div className="relative flex items-center w-full h-10 bg-gray-50 rounded-lg border border-gray-200 px-3 focus-within:border-[#5b61f4] transition-all">
            <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleLiveCompanyFetch(searchTerm); } }}
              placeholder="Search company..." 
              className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
              autoFocus
            />
            {searchTerm && <button onClick={() => setSearchTerm('')}><X className="w-4 h-4 text-gray-400" /></button>}
          </div>
        </div>
      )}


      {/* Secondary Filter Bar */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 bg-white border-b border-gray-100 shrink-0 gap-3 overflow-x-auto no-scrollbar" ref={filterBarRef}>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Sidebar Toggle */}
          <button 
            onClick={() => setShowSidebar(!showSidebar)} 
            className="flex items-center justify-center p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors mr-1 shrink-0"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* All Types */}
          <div className="relative shrink-0">
            <button onClick={() => setActiveFilter(activeFilter === 'type' ? null : 'type')} className="flex items-center gap-2 bg-[#5b61f4] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap">
              All Types <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 opacity-80 transition-transform ${activeFilter === 'type' ? 'rotate-180' : ''}`} />
            </button>
            {activeFilter === 'type' && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100">
                {['Full Time', 'Part Time', 'Contract', 'Internship'].map(opt => (
                  <div key={opt} onClick={() => setActiveFilter(null)} className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors">{opt}</div>
                ))}
              </div>
            )}
          </div>

          {/* Company Type */}
          <div className="relative shrink-0">
            <button onClick={() => setActiveFilter(activeFilter === 'company' ? null : 'company')} className="flex items-center gap-2 border border-gray-200 text-gray-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium bg-white hover:bg-gray-50 whitespace-nowrap">
              Company Type <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-400 transition-transform ${activeFilter === 'company' ? 'rotate-180' : ''}`} />
            </button>
            {activeFilter === 'company' && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100">
                {['MNC', 'Startup', 'Agency', 'Product Based', 'Service Based'].map(opt => (
                  <div key={opt} onClick={() => setActiveFilter(null)} className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors">{opt}</div>
                ))}
              </div>
            )}
          </div>

          {/* Radius */}
          <div className="relative shrink-0 hidden sm:block">
            <button onClick={() => setActiveFilter(activeFilter === 'radius' ? null : 'radius')} className="flex items-center gap-2 border border-gray-200 text-gray-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium bg-white hover:bg-gray-50 whitespace-nowrap">
              Radius (10km) <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-400 transition-transform ${activeFilter === 'radius' ? 'rotate-180' : ''}`} />
            </button>
            {activeFilter === 'radius' && (
              <div className="absolute top-full left-0 mt-2 w-40 bg-white border border-gray-100 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100">
                {['5 km', '10 km', '20 km', '50 km', 'Anywhere'].map(opt => (
                  <div key={opt} onClick={() => setActiveFilter(null)} className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors">{opt}</div>
                ))}
              </div>
            )}
          </div>

          {/* All Sectors */}
          <div className="relative shrink-0 hidden md:block">
            <button onClick={() => setActiveFilter(activeFilter === 'sector' ? null : 'sector')} className="flex items-center gap-2 border border-gray-200 text-gray-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium bg-white hover:bg-gray-50 whitespace-nowrap">
              All Sectors <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-400 transition-transform ${activeFilter === 'sector' ? 'rotate-180' : ''}`} />
            </button>
            {activeFilter === 'sector' && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100">
                {['IT / Software', 'HealthTech', 'FinTech', 'EdTech', 'E-commerce'].map(opt => (
                  <div key={opt} onClick={() => setActiveFilter(null)} className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors">{opt}</div>
                ))}
              </div>
            )}
          </div>

          {/* More Options */}
          <div className="relative shrink-0 hidden lg:block">
            <button onClick={() => setActiveFilter(activeFilter === 'more' ? null : 'more')} className="flex items-center gap-2 border border-gray-200 text-gray-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium bg-white hover:bg-gray-50 whitespace-nowrap">
              More Options <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-400 transition-transform ${activeFilter === 'more' ? 'rotate-180' : ''}`} />
            </button>
            {activeFilter === 'more' && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] z-50 p-3 animate-in fade-in zoom-in-95 duration-100">
                <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Additional Filters</div>
                <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700">Remote Only</span>
                </label>
                <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700">Actively Hiring</span>
                </label>
                <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700">With Salary Details</span>
                </label>
              </div>
            )}
          </div>
          
          <div className="h-6 sm:h-8 w-px bg-gray-200 mx-1 hidden sm:block"></div>
          
          <div className="flex items-center gap-1.5 sm:gap-2 px-1 sm:px-3 shrink-0">
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#f0f2ff] flex items-center justify-center">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#5b61f4]"></div>
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Hiring Now</span>
            <div className="w-7 h-3.5 sm:w-8 sm:h-4 bg-gray-200 rounded-full ml-1 relative">
              <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-white rounded-full absolute left-0.5 top-0.5 shadow-sm"></div>
            </div>
          </div>
          
          <button className="hidden md:block text-xs sm:text-sm font-medium text-gray-500 border border-gray-200 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-gray-50 ml-1 sm:ml-2 whitespace-nowrap shrink-0">
            Clear Filters
          </button>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 border border-gray-200 rounded-lg p-1 bg-gray-50 shrink-0 ml-auto">
          <button className="flex items-center gap-1.5 sm:gap-2 bg-white text-[#5b61f4] px-2 sm:px-4 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium shadow-sm whitespace-nowrap">
            <MapIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Map View
          </button>
          <button className="flex items-center gap-1.5 sm:gap-2 text-gray-600 px-2 sm:px-4 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium hover:text-gray-900 whitespace-nowrap">
            <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> List View
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar */}
        <div className={`
          absolute sm:relative top-0 bottom-0 left-0 h-full w-full sm:w-80 bg-white border-r border-gray-100 overflow-y-auto z-40 sm:z-10 p-4 sm:p-6 shadow-2xl sm:shadow-[2px_0_10px_rgba(0,0,0,0.02)] transition-transform duration-300 ease-in-out
          ${showSidebar ? 'translate-x-0' : '-translate-x-full sm:translate-x-0 sm:hidden'} flex flex-col
        `}>
          {/* Mobile Sidebar Close Button */}
          <div className="flex sm:hidden justify-between items-center mb-4 pb-2 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-lg">Menu</h3>
            <button onClick={() => setShowSidebar(false)} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-2 mb-8">
            <div className="flex flex-col items-center justify-center text-center">
              <Building2 className="w-5 h-5 text-[#5b61f4] mb-1" />
              <span className="font-bold text-gray-900">{totalCompanies.toLocaleString()}</span>
              <span className="text-[10px] text-gray-500">Companies</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center">
              <Rocket className="w-5 h-5 text-red-500 mb-1" />
              <span className="font-bold text-gray-900">{totalStartups.toLocaleString()}</span>
              <span className="text-[10px] text-gray-500">Startups</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center">
              <Users className="w-5 h-5 text-teal-500 mb-1" />
              <span className="font-bold text-gray-900">{totalMNCs.toLocaleString()}</span>
              <span className="text-[10px] text-gray-500">MNCs</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center">
              <Building className="w-5 h-5 text-yellow-500 mb-1" />
              <span className="font-bold text-gray-900">{totalMidLevel.toLocaleString()}</span>
              <span className="text-[10px] text-gray-500">Mid-Level</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-sm">Top Companies</h3>
            <a href="#" className="text-xs font-medium text-[#5b61f4] hover:underline">View all</a>
          </div>

          <div className="flex flex-col gap-3 flex-1">
            {topCompanies.map((company, idx) => (
              <div 
                key={idx} 
                onClick={() => handleCompanyClick(company)}
                className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:border-blue-100 hover:bg-blue-50/30 transition-colors cursor-pointer bg-white shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${company.bg} overflow-hidden bg-white`}>
                    {company.logo && typeof company.logo === 'string' && company.logo.startsWith('http') ? (
                      <img src={company.logo} alt="logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      company.logo || company.name?.charAt(0) || ''
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm leading-tight">{company.name}</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">{company.category}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{company.location}</p>
                  </div>
                </div>
                {company.jobs > 0 && (
                  <div className="bg-[#f0f2ff] text-[#5b61f4] text-xs font-medium px-2.5 py-1 rounded-md whitespace-nowrap">
                    {company.jobs} Jobs
                  </div>
                )}
              </div>
            ))}
          </div>

          <button className="w-full mt-6 bg-[#eef0ff] text-[#5b61f4] font-medium py-3 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-[#e0e5ff] transition-colors">
            View All Companies <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative bg-blue-50">
          <MapContainer 
            center={[20.2961, 85.8245]} 
            zoom={12} 
            className="h-full w-full z-0"
            zoomControl={false}
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=cb1_3t4j_1_5b91505d13706a020613c5ec"
            />
            
            <MapEvents setBounds={setBounds} setZoom={setZoom} />

            {/* Render dynamic clusters and markers */}
            {clusters.map(cluster => {
              const [longitude, latitude] = cluster.geometry.coordinates;
              const { cluster: isCluster, point_count: pointCount } = cluster.properties;

              if (isCluster) {
                // For small clusters (2–6): use stacked logo group with hover-spread
                if (pointCount <= 6) {
                  const leaves = supercluster.getLeaves(cluster.id, 6);
                  const companyProps = leaves.map(l => l.properties);
                  return (
                    <Marker
                      key={`cluster-${cluster.id}`}
                      position={[latitude, longitude]}
                      icon={createGroupIcon(companyProps)}
                      eventHandlers={{
                        click: () => {
                          const expansionZoom = Math.min(supercluster.getClusterExpansionZoom(cluster.id), 18);
                          mapRef.current.setView([latitude, longitude], expansionZoom, { animate: true });
                        }
                      }}
                    />
                  );
                }

                // For large clusters: use the coloured bubble
                let colorClass = 'green';
                if (pointCount > 200) colorClass = 'red';
                else if (pointCount > 50) colorClass = 'orange';
                else if (pointCount > 10) colorClass = 'yellow';

                return (
                  <Marker
                    key={`cluster-${cluster.id}`}
                    position={[latitude, longitude]}
                    icon={createClusterIcon(pointCount, colorClass)}
                    eventHandlers={{
                      click: () => {
                        const expansionZoom = Math.min(supercluster.getClusterExpansionZoom(cluster.id), 18);
                        mapRef.current.setView([latitude, longitude], expansionZoom, { animate: true });
                      }
                    }}
                  />
                );
              }

              return (
                <Marker
                  key={`company-${cluster.properties.companyId}`}
                  position={[latitude, longitude]}
                  icon={createCompanyIcon(cluster.properties)}
                  eventHandlers={{
                    click: () => {
                      handleCompanyClick(cluster.properties);
                      mapRef.current.setView([latitude, longitude], 15, { animate: true });
                    }
                  }}
                />
              );
            })}
          </MapContainer>

          {/* Map Controls */}
          <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col">
              <button 
                onClick={() => mapRef.current?.zoomIn()}
                className="p-2 hover:bg-gray-50 active:bg-gray-100 border-b border-gray-100 text-gray-700"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              </button>
              <button 
                onClick={() => mapRef.current?.zoomOut()}
                className="p-2 hover:bg-gray-50 active:bg-gray-100 text-gray-700"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/></svg>
              </button>
            </div>
            <button 
              onClick={() => mapRef.current?.setView([20.2961, 85.8245], 12, { animate: true })}
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 text-gray-700 hover:bg-gray-50 active:bg-gray-100"
            >
              <Navigation className="w-5 h-5" />
            </button>
          </div>

          {/* Map Legend */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-lg border border-gray-100 flex items-center gap-3 sm:gap-6 w-[90%] sm:w-auto overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#8de098] border-2 border-[#dcf4e0]"></div>
              <span className="text-[10px] sm:text-xs font-semibold text-gray-800">1-10</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#ffda6c] border-2 border-[#fff2cc]"></div>
              <span className="text-[10px] sm:text-xs font-semibold text-gray-800">11-50</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#ffb076] border-2 border-[#ffe4d0]"></div>
              <span className="text-[10px] sm:text-xs font-semibold text-gray-800">51-200</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#ff7b88] border-2 border-[#ffdde0]"></div>
              <span className="text-[10px] sm:text-xs font-semibold text-gray-800">201+</span>
            </div>
          </div>

          {/* Floating Right Card */}
          {showRightCard && selectedCompany && (
            <div className="absolute top-auto bottom-0 sm:top-6 right-0 sm:right-6 w-full sm:w-[360px] bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border-t sm:border border-gray-100 z-[1000] flex flex-col overflow-hidden max-h-[70vh] sm:max-h-[calc(100%-48px)] transition-transform animate-in slide-in-from-bottom-full sm:slide-in-from-right-8">
              
              {/* Card Header with logo + close */}
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                    {selectedCompany.logo && typeof selectedCompany.logo === 'string' && selectedCompany.logo.startsWith('http') ? (
                      <img src={selectedCompany.logo} alt="logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="text-lg sm:text-xl font-bold text-[#5b61f4]">{selectedCompany.logo || selectedCompany.name?.charAt(0) || ''}</span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-1.5 leading-tight">
                      {selectedCompany.name}
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 fill-blue-50 shrink-0" />
                    </h2>
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">{selectedCompany.category}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRightCard(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                >
                  <X className="w-4 h-4 sm:w-4 sm:h-4" />
                </button>
              </div>

              {/* Card Body */}
              <div className="px-5 py-4 flex-1 overflow-y-auto flex flex-col gap-3">
                
                {/* Location */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-gray-700 leading-snug">
                      {selectedCompany.address || selectedCompany.location || 'Bhubaneswar, Odisha'}
                    </span>
                  </div>
                  <a
                    href={selectedCompany.googleMapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedCompany.name + ', ' + (selectedCompany.address || selectedCompany.location))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold shrink-0 hover:underline flex items-center gap-0.5"
                  >
                    <ExternalLink className="w-3 h-3" /> Map
                  </a>
                </div>

                {/* Phone */}
                {selectedCompany.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                    <a href={`tel:${selectedCompany.phone}`} className="text-xs text-gray-800 font-medium hover:text-[#5b61f4]">
                      {selectedCompany.phone}
                    </a>
                  </div>
                )}

                {/* Email */}
                {selectedCompany.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                    <a href={`mailto:${selectedCompany.email}`} className="text-xs text-gray-800 font-medium hover:text-[#5b61f4] truncate">
                      {selectedCompany.email}
                    </a>
                  </div>
                )}

                {/* Website */}
                {selectedCompany.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                    <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-xs text-[#5b61f4] font-medium hover:underline truncate">
                      {selectedCompany.website}
                    </a>
                  </div>
                )}

                {/* Founded + Team */}
                <div className="flex items-center gap-6 pt-1 text-xs border-t border-gray-100">
                  {selectedCompany.foundedYear && (
                    <div>
                      <span className="text-gray-500">Founded: </span>
                      <span className="text-gray-900 font-bold">{selectedCompany.foundedYear}</span>
                    </div>
                  )}
                  {selectedCompany.employeeCount && (
                    <div>
                      <span className="text-gray-500">Team Size: </span>
                      <span className="text-gray-900 font-bold">{selectedCompany.employeeCount}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {selectedCompany.description && (
                  <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                    {selectedCompany.description}
                  </p>
                )}

                {/* Open Jobs */}
                {selectedCompany.jobs > 0 && (
                  <div className="bg-[#f8f9fa] border border-gray-100 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-gray-900 text-sm">
                      <Briefcase className="w-4 h-4 text-gray-700" />
                      {selectedCompany.jobs} Open Jobs
                    </div>
                    <button className="text-[#5b61f4] bg-white border border-blue-100 font-medium text-xs px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                      View Jobs
                    </button>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {selectedCompany.website ? (
                    <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#5b61f4] border border-blue-200 bg-blue-50 rounded-lg py-2.5 hover:bg-blue-100 transition-colors">
                      <Globe className="w-3.5 h-3.5" /> Website ↗
                    </a>
                  ) : (
                    <button className="flex items-center justify-center gap-1.5 text-xs font-bold text-gray-400 border border-gray-200 rounded-lg py-2.5 cursor-not-allowed">
                      <Globe className="w-3.5 h-3.5" /> No Website
                    </button>
                  )}
                  <button className="bg-[#5b61f4] text-white text-xs font-medium rounded-lg py-2.5 hover:bg-blue-700 transition-colors">
                    View Profile
                  </button>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer Section */}
      <div className="h-32 bg-white border-t border-gray-100 shrink-0 flex items-center justify-between px-6 z-10 relative">
        <div className="flex items-center bg-[#f4f6fb] rounded-2xl p-4 w-[60%] justify-between mr-6 shadow-sm border border-blue-50/50">
           <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#5b61f4] shadow-sm">
                <Telescope className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Discover</h4>
                <p className="text-xs text-gray-500 mt-0.5 leading-tight">Find companies<br/>around the city</p>
              </div>
           </div>
           <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#5b61f4] shadow-sm">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Explore</h4>
                <p className="text-xs text-gray-500 mt-0.5 leading-tight">Filter by sector,<br/>stage & area</p>
              </div>
           </div>
           <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#5b61f4] shadow-sm">
                <Network className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Connect</h4>
                <p className="text-xs text-gray-500 mt-0.5 leading-tight">View contact details<br/>and open jobs</p>
              </div>
           </div>
           <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#5b61f4] shadow-sm">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Grow</h4>
                <p className="text-xs text-gray-500 mt-0.5 leading-tight">Build connections<br/>and grow together</p>
              </div>
           </div>
        </div>

        <div className="flex-1 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm h-full flex flex-col justify-center relative overflow-hidden">
           <div className="flex items-center justify-between mb-3">
             <h3 className="font-bold text-gray-900 text-sm">Latest News</h3>
             <a href="#" className="text-xs font-medium text-[#5b61f4] hover:underline">View all</a>
           </div>
           <div className="flex items-center gap-3 cursor-pointer group">
              <div className="w-14 h-14 bg-gray-200 rounded-lg shrink-0 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1596720426673-e4e14290f0cc?auto=format&fit=crop&q=80&w=200" alt="News" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-sm line-clamp-1 group-hover:text-[#5b61f4] transition-colors">Odisha Startup Policy 2025 Announced</h4>
                <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">New initiatives to boost startup ecosystem in Odisha.</p>
                <p className="text-[10px] text-gray-400 mt-1">15 Sep 2026</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
           </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
