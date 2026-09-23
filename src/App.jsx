import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, ZoomControl, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import useSupercluster from 'use-supercluster';
import { 
  MapPin, Search, ChevronDown, User, Building2, Rocket, 
  Users, Briefcase, Map, List, Globe, Navigation, X, CheckCircle2,
  Telescope, Layers, Network, TrendingUp, ArrowRight, Map as MapIcon, ChevronRight
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
            ${company.logo}
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
const initialCompanies = [
  { id: 1, name: 'Oditech Global', category: 'IT Services & Consulting', location: 'Patia, Bhubaneswar', jobs: 12, logo: 'O', bg: 'bg-blue-100 text-blue-800 font-bold text-lg', lat: 20.352, lng: 85.818 },
  { id: 2, name: 'Tata Technologies', category: 'Product Engineering', location: 'Infocity, Bhubaneswar', jobs: 28, logo: 'TATA', bg: 'bg-white text-blue-900 font-bold text-[10px]', lat: 20.355, lng: 85.815 },
  { id: 3, name: 'CureMD Healthcare', category: 'HealthTech', location: 'Saheed Nagar', jobs: 18, logo: 'CureMD', bg: 'bg-white text-cyan-600 font-semibold text-[8px]', lat: 20.295, lng: 85.845 },
  { id: 4, name: 'Wipro', category: 'IT Services', location: 'Chandrasekharpur', jobs: 35, logo: 'wipro', bg: 'bg-white text-red-500 font-bold text-[10px]', lat: 20.320, lng: 85.820 },
  { id: 5, name: 'Mindfire Solutions', category: 'Software Development', location: 'Rasulgarh', jobs: 8, logo: 'Mindfire', bg: 'bg-white text-red-600 font-bold text-[8px]', lat: 20.285, lng: 85.860 },
];

// Seed 150 more companies densely packed around Bhubaneswar to force clusters
for (let i = 6; i <= 155; i++) {
  // Center roughly around Bhubaneswar [20.2961, 85.8245]
  const lat = 20.22 + (Math.random() * 0.15); // Spread across ~15km
  const lng = 85.75 + (Math.random() * 0.12);
  
  initialCompanies.push({
    id: i,
    name: `Startup ${i}`,
    category: 'Technology',
    location: 'Bhubaneswar',
    jobs: Math.random() > 0.7 ? Math.floor(Math.random() * 5) + 1 : 0,
    logo: `${i}`,
    bg: 'bg-gray-100 text-gray-500 font-bold text-xs',
    lat,
    lng
  });
}

const topCompanies = initialCompanies.slice(0, 5);

const App = () => {
  const [showRightCard, setShowRightCard] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState(topCompanies[0]);

  // Clustering state
  const mapRef = useRef();
  const [bounds, setBounds] = useState(null);
  const [zoom, setZoom] = useState(12);

  // Convert companies to GeoJSON feature points for supercluster
  const points = initialCompanies.map(company => ({
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

  const handleCompanyClick = (company) => {
    setSelectedCompany(company);
    setShowRightCard(true);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#f8f9fa] font-sans overflow-hidden">
      
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3 w-72">
          <div className="w-10 h-10 bg-[#eef0ff] rounded-xl flex items-center justify-center">
            <MapPin className="text-[#5b61f4] w-6 h-6 fill-[#5b61f4]" />
          </div>
          <div className="leading-tight">
            <h1 className="font-bold text-gray-900 text-lg">Bhubaneswar</h1>
            <h2 className="font-bold text-gray-900 text-lg">Startup Map</h2>
          </div>
        </div>

        <div className="flex-1 max-w-3xl px-8">
          <div className="relative flex items-center w-full h-11 bg-gray-50 rounded-lg border border-gray-100 px-4">
            <Search className="w-5 h-5 text-gray-400 mr-3" />
            <input 
              type="text" 
              placeholder="Search startups, companies, sectors, founders..." 
              className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 w-72 justify-end">
          <button className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900">
            Explore <ChevronDown className="w-4 h-4" />
          </button>
          <button className="bg-[#5b61f4] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Add Company
          </button>
          <button className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-200 px-4 py-2.5 rounded-lg">
            <User className="w-4 h-4" /> Sign In
          </button>
        </div>
      </header>

      {/* Secondary Filter Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-[#5b61f4] text-white px-4 py-2 rounded-lg text-sm font-medium">
            All Types <ChevronDown className="w-4 h-4 opacity-80" />
          </button>
          <button className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium bg-white hover:bg-gray-50">
            All Areas <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          <button className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium bg-white hover:bg-gray-50">
            All Sectors <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          <button className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium bg-white hover:bg-gray-50">
            All Stages <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          
          <div className="h-8 w-px bg-gray-200 mx-1"></div>
          
          <div className="flex items-center gap-2 px-3">
            <div className="w-5 h-5 rounded-full bg-[#f0f2ff] flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-[#5b61f4]"></div>
            </div>
            <span className="text-sm font-medium text-gray-700">Hiring Now</span>
            <div className="w-8 h-4 bg-gray-200 rounded-full ml-1 relative">
              <div className="w-3.5 h-3.5 bg-white rounded-full absolute left-0.5 top-0.5 shadow-sm"></div>
            </div>
          </div>
          
          <button className="text-sm font-medium text-gray-500 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 ml-2">
            Clear Filters
          </button>
        </div>

        <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1 bg-gray-50">
          <button className="flex items-center gap-2 bg-white text-[#5b61f4] px-4 py-1.5 rounded-md text-sm font-medium shadow-sm">
            <MapIcon className="w-4 h-4" /> Map View
          </button>
          <button className="flex items-center gap-2 text-gray-600 px-4 py-1.5 rounded-md text-sm font-medium hover:text-gray-900">
            <List className="w-4 h-4" /> List View
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar */}
        <div className="w-80 bg-white border-r border-gray-100 flex flex-col overflow-y-auto shrink-0 z-10 p-6 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-2 mb-8">
            <div className="flex flex-col items-center justify-center text-center">
              <Building2 className="w-5 h-5 text-[#5b61f4] mb-1" />
              <span className="font-bold text-gray-900">1,248</span>
              <span className="text-[10px] text-gray-500">Companies</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center">
              <Rocket className="w-5 h-5 text-red-500 mb-1" />
              <span className="font-bold text-gray-900">347</span>
              <span className="text-[10px] text-gray-500">Startups</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center">
              <Users className="w-5 h-5 text-teal-500 mb-1" />
              <span className="font-bold text-gray-900">82</span>
              <span className="text-[10px] text-gray-500">MNCs</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center">
              <Briefcase className="w-5 h-5 text-yellow-500 mb-1" />
              <span className="font-bold text-gray-900">420</span>
              <span className="text-[10px] text-gray-500">Open Jobs</span>
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
                    {company.logo}
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
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-white px-5 py-2.5 rounded-full shadow-lg border border-gray-100 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-[#8de098] border-2 border-[#dcf4e0]"></div>
              <span className="text-xs font-semibold text-gray-800">1-10</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-[#ffda6c] border-2 border-[#fff2cc]"></div>
              <span className="text-xs font-semibold text-gray-800">11-50</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-[#ffb076] border-2 border-[#ffe4d0]"></div>
              <span className="text-xs font-semibold text-gray-800">51-200</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-[#ff7b88] border-2 border-[#ffdde0]"></div>
              <span className="text-xs font-semibold text-gray-800">201+</span>
            </div>
          </div>

          {/* Floating Right Card */}
          {showRightCard && selectedCompany && (
            <div className="absolute top-6 right-6 w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-[1000] flex flex-col overflow-hidden max-h-[calc(100%-140px)]">
              {/* Header Image */}
              <div className="h-32 bg-gray-200 relative w-full shrink-0">
                <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800" alt="Office" className="w-full h-full object-cover" />
                <button 
                  onClick={() => setShowRightCard(false)}
                  className="absolute top-3 right-3 bg-white/90 rounded-full p-1.5 shadow-sm hover:bg-white text-gray-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-6 pb-6 relative pt-12 flex-1 overflow-y-auto">
                {/* Logo floating */}
                <div className="absolute -top-10 left-6 w-20 h-20 bg-white rounded-xl shadow-md border border-gray-100 flex items-center justify-center overflow-hidden">
                  <div className={`w-full h-full flex items-center justify-center ${selectedCompany.bg} text-2xl`}>
                    {selectedCompany.logo}
                  </div>
                </div>

                <div className="flex items-start justify-between mb-1">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      {selectedCompany.name}
                      <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-50" />
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">{selectedCompany.category}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{selectedCompany.location}, Odisha</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <a href="#" className="text-[#5b61f4] hover:underline">www.{selectedCompany.name.toLowerCase().replace(/\s+/g, '')}.com</a>
                  </div>
                </div>

                <div className="flex items-center gap-6 mt-4 text-sm">
                  <div><span className="text-gray-500 font-medium">Founded:</span> <span className="text-gray-900 font-medium">2022</span></div>
                  <div><span className="text-gray-500 font-medium">Team Size:</span> <span className="text-gray-900 font-medium">11-50</span></div>
                </div>

                <div className="flex flex-wrap gap-2 mt-5">
                  {['Web Development', 'AI Solutions', 'SaaS', 'Mobile App'].map(tag => (
                    <span key={tag} className="bg-gray-50 border border-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full font-medium">
                      {tag}
                    </span>
                  ))}
                </div>

                <p className="text-sm text-gray-600 mt-5 leading-relaxed">
                  {selectedCompany.name} is a technology company providing innovative digital solutions, product development, and IT consulting services.
                </p>

                {selectedCompany.jobs > 0 && (
                  <div className="mt-6 bg-[#f8f9fa] border border-gray-100 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-gray-900">
                      <Briefcase className="w-5 h-5 text-gray-700" />
                      {selectedCompany.jobs} Open Jobs
                    </div>
                    <button className="text-[#5b61f4] bg-white border border-blue-100 font-medium text-sm px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                      View Jobs
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 mt-6">
                  <button className="flex items-center justify-center gap-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg py-2.5 hover:bg-gray-50">
                    <Globe className="w-4 h-4" /> Website
                  </button>
                  <button className="flex items-center justify-center gap-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg py-2.5 hover:bg-gray-50">
                    <Navigation className="w-4 h-4" /> Directions
                  </button>
                  <button className="bg-[#5b61f4] text-white text-sm font-medium rounded-lg py-2.5 hover:bg-blue-700 transition-colors">
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

export default App;
