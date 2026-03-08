import React from 'react'; 
import { Bell, User } from 'lucide-react'; 

export const Topbar: React.FC = () => { 
  return (
 < header className = "h-20 border-b border-white/5 bg-brand-blue/30 backdrop-blur-md px-8 flex items-center justify-between z-10 sticky top-0" >
<div>
 < h2 className = "text-xl font-semibold text-white tracking-wide" > Monitoring Dashboard</h2 >
 < p className = "text-xs text-brand-light mt-1 opacity-80" > AI Healthcare Subsystem Active</p >
      </div >

 < div className = "flex items-center space-x-6" >
 < button className = "relative text-gray-400 hover:text-white transition-colors" >
 < Bell className = "w-6 h-6" />
 < span className = "absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-brand-blue" ></span >
        </button >

 < div className = "flex items-center space-x-3 bg-white/5 py-1.5 px-3 rounded-full border border-white/10" >
 < div className = "w-8 h-8 rounded-full bg-brand-purple flex items-center justify-center" >
 < User className = "w-5 h-5 text-brand-light" />
          </div >
 < div className = "hidden sm:block text-right" >
 < p className = "text-sm font-medium text-white leading-tight" > Dr.Sarah C.</p >
 < p className = "text-[10px] text-gray-400" > Neurology Dept</p >
          </div >
        </div >
      </div >
    </header >
  ); 
 }; 

