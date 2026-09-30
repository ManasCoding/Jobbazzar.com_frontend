import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import { 
  Building2, Plus, Search, Filter, LogOut, Loader2, Sparkles, 
  Globe, CheckCircle2, AlertCircle, Trash2, ExternalLink, 
  MapPin, Phone, Mail, Users, Calendar 
} from 'lucide-react';
import AuthContext from '../context/AuthContext';

const AdminCompanies = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const initialFormState = {
    name: '',
    logo: '',
    companyType: '',
    description: '',
    website: '', 
    linkedin: '',
    careersUrl: '',
    phone: '',
    email: '',
    address: '',
    area: '',
    city: 'Bhubaneswar',
    state: 'Odisha',
    country: 'India',
    googleMapUrl: '',
    foundedYear: '',
    employeeCount: '',
  };
  
  const [formData, setFormData] = useState(initialFormState);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchName, setFetchName] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const aiDropdownRef = useRef(null);

  // Fetch Bhubaneswar company suggestions as admin types in Add modal
  useEffect(() => {
    let isMounted = true;
    const fetchAiSuggestions = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/v1/companies/suggestions?q=${encodeURIComponent(fetchName)}`);
        if (isMounted && res.data?.success) {
          setAiSuggestions(res.data.data || []);
        }
      } catch (_) {}
    };

    const timer = setTimeout(fetchAiSuggestions, 150);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [fetchName]);

  // Click outside to close AI suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (aiDropdownRef.current && !aiDropdownRef.current.contains(e.target)) {
        setShowAiSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live Companies from MongoDB
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');

  const { userInfo } = useContext(AuthContext);

  const fetchCompaniesList = async () => {
    try {
      setLoadingCompanies(true);
      const res = await axios.get('http://localhost:5000/api/v1/companies?limit=100');
      const list = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.companies || []);
      setCompanies(list);
    } catch (err) {
      console.error('Failed to load companies:', err);
    } finally {
      setLoadingCompanies(false);
    }
  };

  useEffect(() => {
    fetchCompaniesList();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFetchData = async (nameOverride) => {
    const targetName = (typeof nameOverride === 'string' ? nameOverride : fetchName).trim();
    if (!targetName) {
      setError('Please enter a company name to fetch.');
      return;
    }
    
    setIsFetching(true);
    setError('');
    setMessage('');
    setShowAiSuggestions(false);
    
    if (!userInfo || userInfo.role !== 'admin') {
      setError('You are not authorized. Please log in as an admin.');
      setIsFetching(false);
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/v1/companies/fetch', { companyName: fetchName.trim() });
      const fetchedData = res.data.data;
      
      setFormData({
        ...formData,
        name: fetchedData.name || fetchName,
        logo: fetchedData.logo || '',
        website: fetchedData.website || '',
        description: fetchedData.description || '',
        linkedin: fetchedData.linkedin || '',
        careersUrl: fetchedData.careersUrl || formData.careersUrl || '',
        phone: fetchedData.phone || formData.phone || '',
        email: fetchedData.email || formData.email || '',
        address: fetchedData.address || formData.address || '',
        area: fetchedData.area || formData.area || '',
        city: fetchedData.city || formData.city || '',
        state: fetchedData.state || formData.state || '',
        country: fetchedData.country || formData.country || 'India',
        googleMapUrl: fetchedData.googleMapUrl || (fetchedData.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((fetchedData.name || fetchName) + ', ' + fetchedData.address)}` : ''),
        companyType: fetchedData.companyType || formData.companyType || '',
        foundedYear: fetchedData.foundedYear || formData.foundedYear || '',
        employeeCount: fetchedData.employeeCount || formData.employeeCount || '',
        latitude: fetchedData.latitude,
        longitude: fetchedData.longitude,
      });
      
      setMessage('✨ Data fetched! Basic info from LinkedIn, contacts & links from website & LinkedIn, and genuine location extracted.');
    } catch (err) {
      const msg = err.response?.data?.message;
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        setError('⚠️ Could not reach the server. Please make sure the backend is running on port 5000.');
      } else {
        setError(msg || 'Failed to fetch company data. Try typing the company name more specifically, or paste the LinkedIn URL.');
      }
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    setError('');
    
    if (!userInfo || userInfo.role !== 'admin') {
      setError('You are not authorized. Please log in as an admin.');
      setIsSaving(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        latitude: formData.latitude !== undefined && formData.latitude !== '' ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude !== undefined && formData.longitude !== '' ? parseFloat(formData.longitude) : undefined,
        foundedYear: formData.foundedYear ? parseInt(formData.foundedYear, 10) : undefined
      };
      await axios.post('http://localhost:5000/api/v1/companies', payload);
      setMessage('✅ Company saved successfully in MongoDB database!');
      setFormData(initialFormState);
      setFetchName('');
      await fetchCompaniesList();
      setTimeout(() => setIsModalOpen(false), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save company');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCompany = async (id, companyName) => {
    if (!window.confirm(`Are you sure you want to delete "${companyName}" from the database?`)) return;
    try {
      await axios.delete(`http://localhost:5000/api/v1/companies/${id}`);
      setCompanies(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete company');
    }
  };

  const filteredCompanies = companies.filter(c => {
    const matchesSearch = (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.area || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.companyType || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'All' || (c.companyType || '').toLowerCase().includes(selectedType.toLowerCase());
    return matchesSearch && matchesType;
  });

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Companies Management</h2>
            <p className="text-sm text-gray-500 mt-1">
              View, add, and manage all verified companies. Search, filter, and add any company from any city or industry.
            </p>
          </div>
          <button 
            onClick={() => {
              setIsModalOpen(true);
              setMessage('');
              setError('');
              setFormData(initialFormState);
              setFetchName('');
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Company
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Companies</p>
              <h3 className="text-xl font-bold text-gray-900">{companies.length}</h3>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Bhubaneswar Localities</p>
              <h3 className="text-xl font-bold text-gray-900">
                {new Set(companies.map(c => c.area).filter(Boolean)).size || 1}
              </h3>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Database Status</p>
              <h3 className="text-sm font-bold text-purple-700">MongoDB Atlas Connected</h3>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">AI Sourcing</p>
              <h3 className="text-sm font-bold text-orange-700">LinkedIn & Web Active</h3>
            </div>
          </div>
        </div>

        {/* Data Grid Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[450px]">
          {/* Filter Bar */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by company name, locality (e.g. Acharya Vihar, Patia), or category..." 
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" 
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Type:</span>
              <select 
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="text-xs font-medium text-gray-700 bg-white border border-gray-200 px-3 py-2 rounded-lg focus:outline-none"
              >
                <option value="All">All Types</option>
                <option value="IT Services">IT Services</option>
                <option value="Startup">Startup</option>
                <option value="MNC">MNC</option>
              </select>

              <button 
                onClick={fetchCompaniesList}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 border border-blue-100 px-3 py-2 rounded-lg transition-colors cursor-pointer"
              >
                ↻ Refresh List
              </button>
            </div>
          </div>
          
          {/* Table Area */}
          {loadingCompanies ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
              <p className="text-sm font-medium text-gray-600">Loading companies from MongoDB...</p>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-gray-400">
              <Building2 className="w-12 h-12 mb-3 text-gray-300" />
              <p className="text-base font-semibold text-gray-700">No companies found</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm text-center">
                {searchTerm ? 'No companies match your search criteria. Try a different query.' : 'No companies registered in MongoDB yet. Click "Add Company" above to auto-fill and save one!'}
              </p>
              {!searchTerm && (
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add First Company
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-100 bg-gray-50/50 font-medium text-xs">
                    <th className="py-3 px-4">Company</th>
                    <th className="py-3 px-4">Sector / Type</th>
                    <th className="py-3 px-4">Bhubaneswar Locality & Address</th>
                    <th className="py-3 px-4">Team & Founded</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Links</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCompanies.map((company) => (
                    <tr key={company._id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Name & Logo */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {company.logo ? (
                            <img 
                              src={company.logo} 
                              alt={company.name} 
                              className="w-9 h-9 rounded-lg bg-white p-1 border border-gray-200 object-contain shrink-0" 
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm shrink-0">
                              {company.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 text-sm truncate max-w-[200px]">{company.name}</p>
                            <p className="text-[11px] text-gray-400 line-clamp-1 max-w-[220px]">{company.description}</p>
                          </div>
                        </div>
                      </td>

                      {/* Sector / Category */}
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full inline-block">
                          {company.companyType || 'IT Services'}
                        </span>
                      </td>

                      {/* Locality & Address */}
                      <td className="py-3.5 px-4 max-w-[240px]">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-800">{company.area || 'Acharya Vihar'}, {company.city || 'Bhubaneswar'}</p>
                            <p className="text-[11px] text-gray-500 truncate" title={company.address}>{company.address || 'Address not available'}</p>
                            <a 
                              href={company.googleMapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(company.name + ', ' + (company.address || company.area))}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold mt-0.5 inline-flex items-center gap-1 hover:underline"
                              title="Open verified location on Google Maps"
                            >
                              <ExternalLink className="w-2.5 h-2.5" /> View on Google Maps
                            </a>
                          </div>
                        </div>
                      </td>

                      {/* Team & Founded */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs text-gray-700 flex flex-col gap-0.5">
                          {company.employeeCount && (
                            <span className="flex items-center gap-1 font-medium text-gray-700">
                              <Users className="w-3 h-3 text-gray-400" /> {company.employeeCount}
                            </span>
                          )}
                          {company.foundedYear && (
                            <span className="flex items-center gap-1 text-[11px] text-gray-500">
                              <Calendar className="w-3 h-3 text-gray-400" /> Est. {company.foundedYear}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs text-gray-600 flex flex-col gap-1">
                          {company.phone && (
                            <a href={`tel:${company.phone}`} className="flex items-center gap-1 text-gray-700 hover:text-blue-600 truncate">
                              <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                              <span className="truncate">{company.phone}</span>
                            </a>
                          )}
                          {company.email && (
                            <a href={`mailto:${company.email}`} className="flex items-center gap-1 text-gray-700 hover:text-blue-600 truncate">
                              <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                              <span className="truncate">{company.email}</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Links */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {company.website && (
                            <a 
                              href={company.website} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-gray-500 hover:text-blue-600 p-1 rounded hover:bg-gray-100 transition-colors"
                              title="Visit Website"
                            >
                              <Globe className="w-4 h-4" />
                            </a>
                          )}
                          {company.linkedin && (
                            <a 
                              href={company.linkedin} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-gray-500 hover:text-blue-700 p-1 rounded hover:bg-gray-100 transition-colors font-bold text-xs"
                              title="View LinkedIn Profile"
                            >
                              in
                            </a>
                          )}
                          {company.careersUrl && (
                            <a 
                              href={company.careersUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-gray-500 hover:text-emerald-600 p-1 rounded hover:bg-gray-100 transition-colors"
                              title="Careers Page"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button 
                          onClick={() => handleDeleteCompany(company._id, company.name)}
                          className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete company from database"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Company Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 leading-tight">Add New Company</h2>
                  <p className="text-xs text-gray-500">Auto-fill via LinkedIn & Web — any company, any city</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 bg-white rounded-full p-1.5 border shadow-sm cursor-pointer">
                <LogOut className="w-4 h-4 transform rotate-180" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[75vh]">
              {message && (
                <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <span>{message}</span>
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Top Fetch Area */}
              <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-purple-50/80 p-4 rounded-xl border border-blue-200/80 mb-6 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
                    <label className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                      Auto-Fill with AI (Powered by Gemini)
                    </label>
                  </div>
                  <span className="text-[10px] text-blue-700 font-medium bg-blue-100/70 px-2 py-0.5 rounded-full">
                    LinkedIn Profile & Official Website Grounding
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1" ref={aiDropdownRef}>
                    <input 
                      type="text" 
                      value={fetchName} 
                      onChange={(e) => {
                        setFetchName(e.target.value);
                        setShowAiSuggestions(true);
                      }} 
                      onFocus={() => setShowAiSuggestions(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleFetchData();
                        }
                      }}
                      className="w-full border border-blue-200 bg-white p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                      placeholder="Enter company name + city (e.g. MSC Hiretech Bhubaneswar, Oditech Global, https://linkedin.com/...)..." 
                    />

                    {/* Auto-Suggestion Dropdown */}
                    {showAiSuggestions && aiSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-12 bg-white rounded-xl shadow-xl border border-blue-100 overflow-hidden z-50 max-h-60 overflow-y-auto">
                        <div className="px-3 py-1.5 bg-blue-50 border-b border-blue-100 text-[11px] font-bold text-blue-900 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-blue-600" /> Bhubaneswar Companies
                          </span>
                          <span className="text-[10px] text-blue-600 font-normal">Click to auto-fill</span>
                        </div>
                        <div className="divide-y divide-gray-100">
                          {aiSuggestions.map((sug, i) => (
                            <div
                              key={i}
                              onClick={() => {
                                setFetchName(sug.name);
                                setShowAiSuggestions(false);
                                handleFetchData(sug.name);
                              }}
                              className="p-2.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between transition-colors group"
                            >
                              <div className="flex items-center gap-2.5">
                                {sug.logo ? (
                                  <img 
                                    src={sug.logo} 
                                    alt="logo" 
                                    className="w-7 h-7 rounded-md object-contain bg-white border p-0.5 shrink-0" 
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-md bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                                    {sug.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs font-bold text-gray-900 group-hover:text-blue-600 leading-tight">
                                    {sug.name}
                                  </p>
                                  <p className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                                    <span className="text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded text-[10px] flex items-center gap-0.5">
                                      <MapPin className="w-2.5 h-2.5" /> {sug.area}
                                    </span>
                                    <span>• {sug.companyType}</span>
                                    {sug.phone && <span className="text-gray-400">• {sug.phone}</span>}
                                  </p>
                                </div>
                              </div>
                              <span className="text-[11px] text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                Auto-Fill ⚡
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Search any company with AI */}
                        {fetchName.trim().length > 1 && (
                          <div
                            onClick={() => {
                              setShowAiSuggestions(false);
                              handleFetchData(fetchName);
                            }}
                            className="p-2.5 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 hover:from-blue-100 hover:to-indigo-100 cursor-pointer flex items-center justify-between text-blue-900 font-bold text-xs border-t border-blue-200 transition-colors"
                          >
                            <span className="flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                              <span>Fetch ALL information for "{fetchName}" with AI</span>
                            </span>
                            <span className="bg-blue-600 text-white px-2.5 py-0.5 rounded text-[10px] shadow-xs font-semibold">
                              Auto-Fill ⚡
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button 
                    type="button"
                    onClick={() => handleFetchData()}
                    disabled={isFetching}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-70 flex items-center gap-2 min-w-[160px] justify-center cursor-pointer shadow-sm shrink-0"
                  >
                    {isFetching ? <><Loader2 className="w-4 h-4 animate-spin" /> Fetching...</> : <><Sparkles className="w-4 h-4" /> Fetch Company Data</>}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 mt-2">
                  💡 <span className="font-semibold text-blue-700">Tip:</span> Include the city (e.g. <span className="text-gray-800 font-semibold">MSC Hiretech Bhubaneswar</span>) or paste the direct LinkedIn URL for the most accurate registered office address and Google Maps location.
                </p>
              </div>

              {/* Live Preview Card */}
              {formData.name && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    {formData.logo ? (
                      <img src={formData.logo} alt="Logo" className="w-10 h-10 rounded-lg bg-white p-1 border shadow-xs object-contain" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                        {formData.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-sm text-gray-900 flex items-center gap-2">
                        {formData.name}
                        {formData.companyType && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                            {formData.companyType}
                          </span>
                        )}
                        {formData.employeeCount && (
                          <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                            {formData.employeeCount}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center flex-wrap gap-2 mt-0.5">
                        {formData.area && <span className="font-semibold text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded">{formData.area}, {formData.city}</span>}
                        {formData.phone && <span>• 📞 {formData.phone}</span>}
                        {formData.email && <span>• ✉️ {formData.email}</span>}
                        {formData.foundedYear && <span>• Est. {formData.foundedYear}</span>}
                      </div>
                    </div>
                  </div>
                  {formData.website && (
                    <a href={formData.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5" /> Visit Website
                    </a>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  {/* 1. Basic Info */}
                  <div className="col-span-2 flex items-center justify-between border-b pb-2 mb-1">
                    <h3 className="text-sm font-bold text-gray-900">1. Basic Information</h3>
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
                      Sourced from LinkedIn Profile
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Company Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full border border-gray-200 bg-gray-50/50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Company Type / Sector *</label>
                    <input type="text" name="companyType" value={formData.companyType} onChange={handleChange} required className="w-full border border-gray-200 bg-gray-50/50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="e.g. IT Services and IT Consulting" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Team Size (LinkedIn Size)</label>
                    <input type="text" name="employeeCount" value={formData.employeeCount} onChange={handleChange} className="w-full border border-gray-200 bg-gray-50/50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="e.g. 11-50 employees" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Founded Year (LinkedIn)</label>
                    <input type="number" name="foundedYear" value={formData.foundedYear} onChange={handleChange} className="w-full border border-gray-200 bg-gray-50/50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="e.g. 2021" />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Overview / Description (LinkedIn About) *</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} required className="w-full border border-gray-200 bg-gray-50/50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" rows="3" placeholder="Brief summary of company offerings and products..."></textarea>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Official Website URL</label>
                    <input type="text" name="website" value={formData.website} onChange={handleChange} className="w-full border border-gray-200 bg-gray-50/50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Company Logo URL</label>
                    <input type="text" name="logo" value={formData.logo} onChange={handleChange} className="w-full border border-gray-200 bg-gray-50/50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="https://..." />
                  </div>

                  {/* 2. Contact & Links */}
                  <div className="col-span-2 flex items-center justify-between border-b pb-2 mb-1 mt-4">
                    <h3 className="text-sm font-bold text-gray-900">2. Contact & Links</h3>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                      Cross-verified from Website & LinkedIn
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">LinkedIn URL</label>
                    <input type="text" name="linkedin" value={formData.linkedin} onChange={handleChange} className="w-full border border-gray-200 bg-gray-50/50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="https://linkedin.com/company/..." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Careers URL</label>
                    <input type="text" name="careersUrl" value={formData.careersUrl} onChange={handleChange} className="w-full border border-gray-200 bg-gray-50/50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="https://.../careers" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Phone / Mobile Number</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full border border-gray-200 bg-gray-50/50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="+91-..." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Official Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border border-gray-200 bg-gray-50/50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="info@... or official@..." />
                  </div>

                  {/* 3. Location */}
                  <div className="col-span-2 flex items-center justify-between border-b pb-2 mb-1 mt-4">
                    <h3 className="text-sm font-bold text-gray-900">3. Location Details</h3>
                    <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-2.5 py-0.5 rounded-full">
                      Genuine Location from LinkedIn & Google Maps
                    </span>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Full Street Address *</label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} required className="w-full border border-gray-200 bg-gray-50/50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="e.g. 3rd Floor, Plot 15, MG Road, Koramangala, Bengaluru 560034" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Area / Locality *</label>
                    <input type="text" name="area" value={formData.area} onChange={handleChange} required className="w-full border border-gray-200 bg-gray-50/50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="e.g. Acharya Vihar or Patia" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">City *</label>
                    <input type="text" name="city" value={formData.city} onChange={handleChange} required className="w-full border border-gray-200 bg-gray-50/50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">State *</label>
                    <input type="text" name="state" value={formData.state} onChange={handleChange} required className="w-full border border-gray-200 bg-gray-50/50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Country *</label>
                    <input type="text" name="country" value={formData.country} onChange={handleChange} required className="w-full border border-gray-200 bg-gray-50/50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>

                  {/* Google Map Link */}
                  <div className="col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Google Map Location / Link
                      </label>
                      {formData.googleMapUrl && (
                        <a 
                          href={formData.googleMapUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                        >
                          <MapPin className="w-3.5 h-3.5 text-red-500" /> Verify on Google Maps ↗
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        name="googleMapUrl" 
                        value={formData.googleMapUrl} 
                        onChange={handleChange} 
                        className="w-full border border-gray-200 bg-gray-50/50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                        placeholder="https://www.google.com/maps/... (auto-generated from LinkedIn / Google Maps)" 
                      />
                      {formData.googleMapUrl && (
                        <a 
                          href={formData.googleMapUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-blue-700 text-xs font-bold flex items-center gap-1 shrink-0 transition-colors"
                          title="Open Google Maps in new tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View Map
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">Cancel</button>
                  <button type="submit" disabled={isSaving || isFetching} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm shadow-blue-200 disabled:opacity-70 flex items-center gap-2 cursor-pointer">
                    {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving to MongoDB...</> : 'Submit & Save Company'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCompanies;
