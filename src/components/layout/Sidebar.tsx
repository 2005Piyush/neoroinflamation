import React from 'react'; 
import { useNavigate, useLocation } from 'react-router-dom'; 
import { 
  LayoutDashboard, 
  Mic, 
  History, 
  FileText, 
  Settings, 
  LogOut, 
  Brain
 } from 'lucide-react'; 

export const Sidebar: React.FC = () => { 
  const navigate = useNavigate(); 
  const location = useLocation(); 

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' }, 
    { name: 'Language Analysis', icon: Mic, path: '/dashboard/analysis' }, 
    { name: 'History', icon: History, path: '/dashboard/history' }, 
    { name: 'Reports', icon: FileText, path: '/dashboard/reports' }, 
    { name: 'Settings', icon: Settings, path: '/dashboard/settings' }, 
]; 

  const handleLogout = () => { 
    navigate('/login'); 
 }; 

  return (
 < div className = "w-64 h-full bg-brand-purple/50 border-r border-white/5 backdrop-blur-xl flex flex-col" >
 < div className = "p-6 flex items-center space-x-3 mb-6" >
 < div className = "w-10 h-10 rounded-full bg-brand-cyan/20 flex items-center justify-center border border-brand-light/20" >
 < Brain className = "w-6 h-6 text-brand-light" />
        </div >
 < div className = "flex flex-col" >
 < span className = "text-white font-bold leading-tight" > NeurOlingo</span >
 < span className = "text-brand-light text-xs font-medium tracking-wider" > AI SYSTEM</span >
        </div >
      </div >

 < nav className = "flex-1 px-4 space-y-2" >
        { menuItems.map((item) => { 
          const isActive = location.pathname === item.path || (location.pathname === '/dashboard' && item.path === '/dashboard'); 
          return (
 < button
              key = { item.name }
              onClick = {() => navigate(item.path)}
              className = {`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-brand-accent/20 text-brand-light' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
 >
 < item.icon className = {`w-5 h-5 ${isActive ? 'text-brand-light' : 'text-gray-400'}`} />
              <span className="font-medium text-sm">{item.name}</span >
            </button >
          ); 
        })}
      </nav >

 < div className = "p-4 mt-auto mb-4" >
 < button
          onClick = { handleLogout }
          className = "w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
 >
 < LogOut className = "w-5 h-5" />
 < span className = "font-medium text-sm" > Logout</span >
        </button >
      </div >
    </div >
  ); 
}; 

