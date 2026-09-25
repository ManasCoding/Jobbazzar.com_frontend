import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import { 
  LayoutDashboard, Building2, Briefcase, Users, FileText, Grid, Tag, 
  MapPin, TrendingUp, Settings, FileBarChart, LogOut, Search, Bell, 
  Calendar, MoreVertical, Plus, ChevronDown, Menu, CheckCircle2, AlertCircle
} from 'lucide-react';

// --- MOCK DATA ---
const stats = [
  { title: 'Total Companies', value: '248', increase: '+ 12%', icon: <Building2 className="text-blue-500 w-5 h-5" />, bg: 'bg-blue-50' },
  { title: 'Total Jobs', value: '1,542', increase: '+ 18%', icon: <Briefcase className="text-green-500 w-5 h-5" />, bg: 'bg-green-50' },
  { title: 'Total Users', value: '12,860', increase: '+ 25%', icon: <Users className="text-purple-500 w-5 h-5" />, bg: 'bg-purple-50' },
  { title: 'Total Applications', value: '8,421', increase: '+ 32%', icon: <FileText className="text-orange-500 w-5 h-5" />, bg: 'bg-orange-50' },
  { title: 'Total Revenue', value: '₹ 4,82,320', increase: '+ 20%', icon: <span className="font-bold text-teal-600">₹</span>, bg: 'bg-teal-50' },
  { title: 'Active Companies', value: '221', increase: '+ 9%', icon: <Building2 className="text-red-500 w-5 h-5" />, bg: 'bg-red-50' },
];

const recentCompanies = [
  { name: 'Airbound', location: 'Bengaluru, KA', sector: 'Deeptech', status: 'Approved', logo: 'a' },
  { name: 'Zerodha', location: 'Bengaluru, KA', sector: 'Fintech', status: 'Approved', logo: 'z' },
  { name: 'Healthium', location: 'Bengaluru, KA', sector: 'Healthtech', status: 'Pending', logo: 'h' },
  { name: 'Stellapps', location: 'Bengaluru, KA', sector: 'SaaS', status: 'Approved', logo: 's' },
  { name: 'Groww', location: 'Bengaluru, KA', sector: 'Fintech', status: 'Approved', logo: 'g' },
];

const recentJobs = [
  { title: 'Frontend Developer', company: 'Airbound', location: 'Bengaluru', status: 'Published' },
  { title: 'DevOps Engineer', company: 'Zerodha', location: 'Bengaluru', status: 'Published' },
  { title: 'Data Analyst', company: 'Healthium', location: 'Hoskote', status: 'Published' },
  { title: 'Full Stack Developer', company: 'Stellapps', location: 'Bengaluru', status: 'Draft' },
  { title: 'UI/UX Designer', company: 'Groww', location: 'Remote', status: 'Published' },
];

const pendingApprovals = [
  { title: 'New Company Registrations', count: 12, color: 'text-blue-600', bg: 'bg-blue-100', icon: <Building2 className="w-4 h-4" /> },
  { title: 'Job Post Approvals', count: 8, color: 'text-purple-600', bg: 'bg-purple-100', icon: <Briefcase className="w-4 h-4" /> },
  { title: 'User Verifications', count: 23, color: 'text-green-600', bg: 'bg-green-100', icon: <Users className="w-4 h-4" /> },
  { title: 'Content Reports', count: 5, color: 'text-red-600', bg: 'bg-red-100', icon: <AlertCircle className="w-4 h-4" /> },
];

const topSectors = [
  { name: 'Tech & Software', percentage: 32, color: 'bg-blue-500' },
  { name: 'Deeptech', percentage: 18, color: 'bg-indigo-500' },
  { name: 'Healthtech', percentage: 12, color: 'bg-purple-500' },
  { name: 'Fintech', percentage: 10, color: 'bg-orange-500' },
  { name: 'Others', percentage: 28, color: 'bg-gray-300' },
];

const recentApplications = [
  { name: 'Rohit Sharma', title: 'Frontend Developer', company: 'Airbound', status: 'Applied', date: 'May 26, 2025' },
  { name: 'Priya Singh', title: 'Data Analyst', company: 'Healthium', status: 'Interview', date: 'May 25, 2025' },
  { name: 'Amit Verma', title: 'DevOps Engineer', company: 'Zerodha', status: 'Shortlisted', date: 'May 24, 2025' },
  { name: 'Neha Iyer', title: 'UI/UX Designer', company: 'Stellapps', status: 'Applied', date: 'May 23, 2025' },
  { name: 'Siddharth Rao', title: 'Full Stack Developer', company: 'Groww', status: 'Rejected', date: 'May 22, 2025' },
];

import AuthContext from '../context/AuthContext';

const AdminDashboard = () => {
  // Modal state for Add Company
  const { userInfo } = useContext(AuthContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '', description: '', address: '', area: '', companyType: '', lat: '', lng: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    if (!userInfo) {
      setError('You are not authorized. Please log in as an admin.');
      return;
    }
    try {
      const payload = {
        ...formData,
        latitude: parseFloat(formData.lat) || 20.2961,
        longitude: parseFloat(formData.lng) || 85.8245
      };
      await axios.post('http://localhost:5000/api/v1/companies', payload);
      setMessage('Company added successfully!');
      setFormData({ name: '', description: '', address: '', area: '', companyType: '', lat: '', lng: '' });
      setTimeout(() => setIsModalOpen(false), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add company');
    }
  };

  const StatusBadge = ({ status }) => {
    let color = 'bg-gray-100 text-gray-700';
    if (status === 'Approved' || status === 'Published') color = 'bg-green-100 text-green-700';
    if (status === 'Pending' || status === 'Draft' || status === 'Shortlisted') color = 'bg-yellow-100 text-yellow-700';
    if (status === 'Applied' || status === 'Interview') color = 'bg-blue-100 text-blue-700';
    if (status === 'Rejected') color = 'bg-red-100 text-red-700';
    
    return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${color}`}>{status}</span>;
  };

  return (
    <AdminLayout>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">Welcome back, Admin! Here's what's happening on JobBazzar.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 font-medium bg-white px-4 py-2 border border-gray-200 rounded-lg shadow-sm">
          Mon, 26 May 2025 <Calendar className="w-4 h-4" />
        </div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex items-start gap-3 mb-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${stat.bg}`}>
                {stat.icon}
              </div>
              <div className="flex-1">
                <p className="text-[11px] text-gray-500 font-medium leading-tight">{stat.title}</p>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
                ↑ {stat.increase.replace('+', '')} <span className="text-gray-400 font-normal text-[10px]">vs last month</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="col-span-2 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Platform Growth</h3>
            <div className="flex gap-4 text-[11px] font-medium text-gray-600">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Companies</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Jobs</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Users</span>
            </div>
          </div>
          <div className="h-48 w-full relative bg-gray-50/50 flex items-end">
            {/* Mock Chart SVG */}
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="20" x2="100" y2="20" stroke="#f3f4f6" strokeWidth="0.5" />
              <line x1="0" y1="40" x2="100" y2="40" stroke="#f3f4f6" strokeWidth="0.5" />
              <line x1="0" y1="60" x2="100" y2="60" stroke="#f3f4f6" strokeWidth="0.5" />
              <line x1="0" y1="80" x2="100" y2="80" stroke="#f3f4f6" strokeWidth="0.5" />
              
              <path d="M0,60 Q20,55 40,50 T80,40 T100,30" fill="none" stroke="#a855f7" strokeWidth="1.5" />
              <path d="M0,75 Q20,70 40,65 T80,50 T100,45" fill="none" stroke="#22c55e" strokeWidth="1.5" />
              <path d="M0,90 Q20,85 40,85 T80,75 T100,70" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
              <path d="M0,90 Q20,85 40,85 T80,75 T100,70 L100,100 L0,100 Z" fill="url(#gradBlue)" border="none" />
              
              <circle cx="0" cy="90" r="1.5" fill="#3b82f6" />
              <circle cx="20" cy="86" r="1.5" fill="#3b82f6" />
              <circle cx="40" cy="85" r="1.5" fill="#3b82f6" />
              <circle cx="60" cy="80" r="1.5" fill="#3b82f6" />
              <circle cx="80" cy="75" r="1.5" fill="#3b82f6" />
              <circle cx="100" cy="70" r="1.5" fill="#3b82f6" />
            </svg>
            <div className="absolute -bottom-5 left-0 w-full flex justify-between text-[10px] text-gray-400">
              <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
            </div>
          </div>
        </div>
        
        <div className="col-span-1 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Job Status</h3>
            <a href="#" className="text-xs text-blue-500 font-medium hover:underline">View All</a>
          </div>
          <div className="flex items-center justify-center mt-2">
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f3f4f6" strokeWidth="4" />
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#22c55e" strokeWidth="4" strokeDasharray="76 24" />
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="4" strokeDasharray="14 86" strokeDashoffset="-76" />
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#ef4444" strokeWidth="4" strokeDasharray="7 93" strokeDashoffset="-90" />
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#6b7280" strokeWidth="4" strokeDasharray="3 97" strokeDashoffset="-97" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-bold text-xl text-gray-900">1,542</span>
                <span className="text-[9px] text-gray-500 uppercase tracking-wide">Total Jobs</span>
              </div>
            </div>
            <div className="ml-6 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-medium"><div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>Published <span className="ml-auto font-bold text-gray-900">1,182 <span className="text-gray-400 font-normal">(76%)</span></span></div>
              <div className="flex items-center gap-2 text-xs font-medium"><div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>Draft <span className="ml-auto font-bold text-gray-900">218 <span className="text-gray-400 font-normal">(14%)</span></span></div>
              <div className="flex items-center gap-2 text-xs font-medium"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>Closed <span className="ml-auto font-bold text-gray-900">102 <span className="text-gray-400 font-normal">(7%)</span></span></div>
              <div className="flex items-center gap-2 text-xs font-medium"><div className="w-2.5 h-2.5 rounded-full bg-gray-500"></div>Expired <span className="ml-auto font-bold text-gray-900">40 <span className="text-gray-400 font-normal">(3%)</span></span></div>
            </div>
          </div>
        </div>
      </div>

      {/* TABLES ROW */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        <div className="col-span-4 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Recent Companies</h3>
            <Link to="/admin-companies" className="text-xs text-blue-500 font-medium hover:underline">View All</Link>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100 font-medium">
                <th className="pb-3 text-xs">Company</th>
                <th className="pb-3 text-xs">Sector</th>
                <th className="pb-3 text-xs">Status</th>
                <th className="pb-3 text-xs text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentCompanies.map((c, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="py-2.5 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center font-bold text-xs uppercase text-gray-600 border border-gray-200 shadow-sm">{c.logo}</div>
                    <div>
                      <div className="font-bold text-gray-800 text-[13px]">{c.name}</div>
                      <div className="text-[10px] text-gray-400">{c.location}</div>
                    </div>
                  </td>
                  <td className="py-2.5 text-[12px] font-medium text-blue-600 bg-blue-50/50 px-2 rounded">{c.sector}</td>
                  <td className="py-2.5"><StatusBadge status={c.status} /></td>
                  <td className="py-2.5 text-right"><MoreVertical className="w-4 h-4 text-gray-400 inline cursor-pointer hover:text-gray-700" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="col-span-5 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Recent Jobs</h3>
            <Link to="/admin-jobs" className="text-xs text-blue-500 font-medium hover:underline">View All</Link>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100 font-medium">
                <th className="pb-3 text-xs">Job Title</th>
                <th className="pb-3 text-xs">Company</th>
                <th className="pb-3 text-xs">Location</th>
                <th className="pb-3 text-xs">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentJobs.map((j, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="py-2.5 flex items-center gap-2">
                    <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded flex items-center justify-center"><Briefcase className="w-3 h-3" /></div>
                    <span className="font-bold text-gray-800 text-[13px]">{j.title}</span>
                  </td>
                  <td className="py-2.5 text-gray-600 text-xs">{j.company}</td>
                  <td className="py-2.5 text-gray-600 text-xs">{j.location}</td>
                  <td className="py-2.5"><StatusBadge status={j.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="col-span-3 bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Pending Approvals</h3>
            <a href="#" className="text-xs text-blue-500 font-medium hover:underline">View All</a>
          </div>
          <div className="flex flex-col gap-3 flex-1">
            {pendingApprovals.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${p.bg} ${p.color}`}>
                    {p.icon}
                  </div>
                  <span className="text-xs font-semibold text-gray-700 leading-tight">{p.title}</span>
                </div>
                <div className="font-bold text-blue-600 text-lg">{p.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900">Top Sectors</h3>
            <a href="#" className="text-xs text-blue-500 font-medium hover:underline">View All</a>
          </div>
          <div className="flex flex-col gap-4">
            {topSectors.map((s, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-xs font-medium text-gray-700 mb-1">
                  <span>{s.name}</span>
                  <span className="text-gray-400">{s.percentage}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full ${s.color}`} style={{ width: `${s.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-6 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Recent Applications</h3>
            <Link to="/admin-applications" className="text-xs text-blue-500 font-medium hover:underline">View All</Link>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100 font-medium">
                <th className="pb-3 text-xs">Applicant</th>
                <th className="pb-3 text-xs">Job Title</th>
                <th className="pb-3 text-xs">Company</th>
                <th className="pb-3 text-xs">Status</th>
                <th className="pb-3 text-xs text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentApplications.map((a, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="py-3 font-bold text-gray-800 text-[13px]">{a.name}</td>
                  <td className="py-3 text-gray-600 text-xs">{a.title}</td>
                  <td className="py-3 text-gray-500 text-xs">{a.company}</td>
                  <td className="py-3"><StatusBadge status={a.status} /></td>
                  <td className="py-3 text-right text-gray-400 text-[11px] font-medium">{a.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="col-span-3 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors shadow-sm shadow-blue-200"
            >
              <Plus className="w-6 h-6 border-2 border-white rounded-full p-0.5" />
              <span className="text-[11px] font-bold text-center">Add New Company</span>
            </button>
            <button className="bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors shadow-sm shadow-emerald-200">
              <Briefcase className="w-6 h-6" />
              <span className="text-[11px] font-bold text-center">Post New Job</span>
            </button>
            <button className="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors shadow-sm shadow-purple-200">
              <Users className="w-6 h-6" />
              <span className="text-[11px] font-bold text-center">Add New User</span>
            </button>
            <button className="bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors shadow-sm shadow-orange-200">
              <FileBarChart className="w-6 h-6" />
              <span className="text-[11px] font-bold text-center">View Reports</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Company Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">Add New Company</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 bg-white rounded-full p-1 border shadow-sm">
                <LogOut className="w-4 h-4 transform rotate-180" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              {message && <div className="bg-green-50 border border-green-100 text-green-700 p-3 rounded-lg mb-4 text-sm font-medium">{message}</div>}
              {error && <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm font-medium">{error}</div>}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Company Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Company Type</label>
                    <input type="text" name="companyType" value={formData.companyType} onChange={handleChange} required className="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="e.g. Startup, MNC" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Description</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} required className="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" rows="3"></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Address</label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} required className="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Area / Location</label>
                    <input type="text" name="area" value={formData.area} onChange={handleChange} required className="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="e.g. Patia" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Latitude (optional)</label>
                    <input type="number" step="any" name="lat" value={formData.lat} onChange={handleChange} className="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="20.2961" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Longitude (optional)</label>
                    <input type="number" step="any" name="lng" value={formData.lng} onChange={handleChange} className="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="85.8245" />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm shadow-blue-200">
                  Save Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
