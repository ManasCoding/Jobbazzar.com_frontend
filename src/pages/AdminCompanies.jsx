import React, { useState, useContext } from 'react';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import { Building2, Plus, Search, Filter, LogOut, Loader2 } from 'lucide-react';
import AuthContext from '../context/AuthContext';

const AdminCompanies = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const initialFormState = {
    name: '', logo: '', companyType: '', description: '', website: '', 
    address: '', area: '', city: 'Bhubaneswar', state: 'Odisha', country: 'India', 
    linkedin: '', careersUrl: '', phone: '', email: '', foundedYear: ''
  };
  
  const [formData, setFormData] = useState(initialFormState);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchName, setFetchName] = useState('');

  const { userInfo } = useContext(AuthContext);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFetchData = async () => {
    if (!fetchName.trim()) {
      setError('Please enter a company name to fetch.');
      return;
    }
    
    setIsFetching(true);
    setError('');
    setMessage('');
    
    if (!userInfo) {
      setError('You are not authorized. Please log in as an admin.');
      setIsFetching(false);
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/v1/companies/fetch', { companyName: fetchName });
      
      const fetchedData = res.data.data;
      
      setFormData({
        ...formData,
        name: fetchedData.name || fetchName,
        logo: fetchedData.logo || '',
        website: fetchedData.website || '',
        description: fetchedData.description || '',
        linkedin: fetchedData.linkedin || '',
        facebook: fetchedData.facebook || '',
        careersUrl: fetchedData.careersUrl || '',
      });
      
      setMessage('Company information fetched successfully. Please review below.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch company data');
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    setError('');
    
    if (!userInfo) {
      setError('You are not authorized. Please log in as an admin.');
      setIsSaving(false);
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/v1/companies', formData);
      setMessage('Company added successfully.');
      setFormData(initialFormState);
      setFetchName('');
      setTimeout(() => setIsModalOpen(false), 2000);
    } catch (err) {
      if (err.response?.status === 409) {
        setError('This company already exists.');
      } else {
        setError(err.response?.data?.message || 'Failed to add company');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Companies</h2>
            <p className="text-sm text-gray-500 mt-1">Manage and view all registered companies on the platform.</p>
          </div>
          <button 
            onClick={() => {
              setIsModalOpen(true);
              setMessage('');
              setError('');
              setFormData(initialFormState);
              setFetchName('');
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Company
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search companies..." className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" />
            </div>
            <button className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <Building2 className="w-16 h-16 mb-4 text-gray-200" />
            <p className="text-lg font-medium text-gray-600">Company management coming soon</p>
            <p className="text-sm mt-1">This section will display a full data grid of companies.</p>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 sticky top-0 z-10">
              <h2 className="text-xl font-bold text-gray-900">Add New Company</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 bg-white rounded-full p-1 border shadow-sm">
                <LogOut className="w-4 h-4 transform rotate-180" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[75vh]">
              {message && <div className="bg-green-50 border border-green-100 text-green-700 p-3 rounded-lg mb-4 text-sm font-medium">{message}</div>}
              {error && <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm font-medium">{error}</div>}

              {/* Top Fetch Area */}
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Fetch Public Data by Company Name</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="text" 
                    value={fetchName} 
                    onChange={(e) => setFetchName(e.target.value)} 
                    className="flex-1 border border-gray-200 bg-white p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                    placeholder="Enter company name (e.g., Infosys)" 
                  />
                  <button 
                    onClick={handleFetchData}
                    disabled={isFetching}
                    className="bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors disabled:opacity-70 flex items-center gap-2 min-w-[160px] justify-center"
                  >
                    {isFetching ? <><Loader2 className="w-4 h-4 animate-spin" /> Fetching...</> : 'Fetch Company Data'}
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  {/* Basic Info */}
                  <div className="col-span-2"><h3 className="text-sm font-bold text-gray-900 border-b pb-2 mb-2">Basic Information</h3></div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Company Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Company Type</label>
                    <select name="companyType" value={formData.companyType} onChange={handleChange} required className="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                      <option value="" disabled>Select Type</option>
                      <option value="Startup">Startup</option>
                      <option value="MNC">MNC</option>
                      <option value="Agency">Agency</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Short Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} required className="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" rows="3" placeholder={isFetching ? "Information not available" : ""}></textarea>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Official Website URL</label>
                    <input type="url" name="website" value={formData.website} onChange={handleChange} className="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder={isFetching ? "Information not available" : ""} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Company Logo URL</label>
                    <input type="url" name="logo" value={formData.logo} onChange={handleChange} className="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder={isFetching ? "Information not available" : ""} />
                  </div>

                  {/* Contact & Links */}
                  <div className="col-span-2"><h3 className="text-sm font-bold text-gray-900 border-b pb-2 mb-2 mt-4">Contact & Links</h3></div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">LinkedIn URL</label>
                    <input type="url" name="linkedin" value={formData.linkedin} onChange={handleChange} className="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder={isFetching ? "Information not available" : ""} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Careers URL</label>
                    <input type="url" name="careersUrl" value={formData.careersUrl} onChange={handleChange} className="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder={isFetching ? "Information not available" : ""} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Phone</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder={isFetching ? "Information not available" : ""} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder={isFetching ? "Information not available" : ""} />
                  </div>

                  {/* Location */}
                  <div className="col-span-2"><h3 className="text-sm font-bold text-gray-900 border-b pb-2 mb-2 mt-4">Location Details</h3></div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Address</label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} required className="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Area / Location</label>
                    <input type="text" name="area" value={formData.area} onChange={handleChange} required className="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">City</label>
                    <input type="text" name="city" value={formData.city} onChange={handleChange} required className="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">State</label>
                    <input type="text" name="state" value={formData.state} onChange={handleChange} required className="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Country</label>
                    <input type="text" name="country" value={formData.country} onChange={handleChange} required className="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Founded Year</label>
                    <input type="number" name="foundedYear" value={formData.foundedYear} onChange={handleChange} className="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder={isFetching ? "Information not available" : ""} />
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={isSaving || isFetching} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm shadow-blue-200 disabled:opacity-70 flex items-center gap-2">
                    {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving company...</> : 'Submit & Save Company'}
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
