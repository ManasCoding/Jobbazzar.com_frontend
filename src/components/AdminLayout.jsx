import React, { useContext, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { 
  LayoutDashboard, Building2, Briefcase, Users, FileText, Grid, Tag, 
  MapPin, TrendingUp, Settings, FileBarChart, LogOut, Search, Bell, ChevronDown, Menu, Loader2 
} from 'lucide-react';

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userInfo, loading, logout } = useContext(AuthContext);
  const currentPath = location.pathname;

  const isActive = (path) => currentPath === path;

  useEffect(() => {
    if (!loading && (!userInfo || userInfo.role !== 'admin')) {
      navigate('/signin');
    }
  }, [userInfo, loading, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-600 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="text-sm font-medium">Checking admin authorization...</span>
      </div>
    );
  }

  if (!userInfo || userInfo.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex h-screen bg-[#f3f4f6] font-sans overflow-hidden text-gray-800">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#1a2234] text-gray-300 flex flex-col shrink-0 overflow-y-auto">
        <div className="h-16 flex items-center px-6 border-b border-gray-700">
          <Link to="/" className="flex items-center gap-2 text-white">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight">JobBazzar</h1>
              <p className="text-[9px] text-gray-400">Find Jobs • Build Careers</p>
            </div>
          </Link>
        </div>

        <div className="p-4">
          <Link 
            to="/admin-dashboard" 
            className={`rounded-lg px-4 py-2.5 flex items-center gap-3 font-medium shadow-sm mb-6 transition-colors ${
              isActive('/admin-dashboard') ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>

          <div className="text-[10px] font-bold text-gray-500 tracking-wider mb-3 px-4">MANAGE</div>
          <nav className="flex flex-col gap-1 mb-6">
            {[
              { icon: Building2, label: 'Companies', path: '/admin-companies' },
              { icon: Briefcase, label: 'Jobs', path: '/admin-jobs' },
              { icon: Users, label: 'Users', path: '/admin-users' },
              { icon: FileText, label: 'Applications', path: '/admin-applications' },
              { icon: Grid, label: 'Categories / Sectors', path: '#' },
              { icon: Tag, label: 'Tags', path: '#' },
              { icon: MapPin, label: 'Locations', path: '#' },
              { icon: TrendingUp, label: 'Funding Stages', path: '#' },
            ].map((item, idx) => (
              <Link 
                key={idx} 
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  isActive(item.path) ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-gray-800 hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4 opacity-70" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="text-[10px] font-bold text-gray-500 tracking-wider mb-3 px-4">ADMIN CONTROLS</div>
          <nav className="flex flex-col gap-1">
            {[
              { icon: FileBarChart, label: 'Content Management' },
              { icon: TrendingUp, label: 'Reports & Analytics' },
              { icon: Settings, label: 'System Settings' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-800 hover:text-white rounded-lg cursor-pointer transition-colors text-sm font-medium">
                <item.icon className="w-4 h-4 opacity-70" />
                {item.label}
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-gray-700">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-800 hover:text-white rounded-lg cursor-pointer transition-colors text-sm font-medium">
            <LogOut className="w-4 h-4 opacity-70" />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* TOPBAR */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <Menu className="w-5 h-5 text-gray-500 cursor-pointer" />
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search companies, jobs, users..." className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-80 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="relative cursor-pointer">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full text-[9px] font-bold text-white flex items-center justify-center">3</span>
            </div>
            <div className="flex items-center gap-2 cursor-pointer border-l pl-5">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                {(userInfo?.name?.[0] || 'A').toUpperCase()}
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-bold text-gray-800 leading-tight">{userInfo?.name || 'Admin'}</div>
                <div className="text-[10px] text-gray-500 capitalize">{userInfo?.role || 'Admin'} <ChevronDown className="inline w-3 h-3" /></div>
              </div>
            </div>
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
