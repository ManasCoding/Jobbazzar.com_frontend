import React from 'react';
import AdminLayout from '../components/AdminLayout';
import { Briefcase, Plus, Search, Filter } from 'lucide-react';

const AdminJobs = () => {
  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Jobs</h2>
            <p className="text-sm text-gray-500 mt-1">Manage job postings, drafts, and expired listings.</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors">
            <Plus className="w-4 h-4" /> Post Job
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search jobs..." className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" />
            </div>
            <button className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <Briefcase className="w-16 h-16 mb-4 text-gray-200" />
            <p className="text-lg font-medium text-gray-600">Job management coming soon</p>
            <p className="text-sm mt-1">This section will list all active and closed job postings.</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminJobs;
