import React from 'react'; 
import { Card } from '../ui/Card'; 
import { Button } from '../ui/Button'; 
import { Mic, UploadCloud, Type, PlayCircle } from 'lucide-react'; 

export const MonitoringSection: React.FC = () => { 
  return (
 < Card className = "p-6" >
 < div className = "flex items-center justify-between mb-6" >
<div>
 < h3 className = "text-xl font-bold text-white mb-1" > Speech & Language Monitoring</h3 >
 < p className = "text-sm text-gray-400" > Collect linguistic data for neural analysis</p >
        </div >
      </div >
      
 < div className = "grid grid-cols-1 md:grid-cols-3 gap-4 mb-6" >
 < Button variant = "outline" className = "h-24 flex flex-col items-center justify-center gap-2 border-dashed bg-white/5 hover:bg-brand-accent/10 border-brand-cyan/50" >
 < UploadCloud className = "w-6 h-6" />
 < span > Upload Speech Sample</span >
        </Button >
        
 < Button variant = "outline" className = "h-24 flex flex-col items-center justify-center gap-2 bg-brand-cyan/10 border-brand-cyan hover:bg-brand-cyan/20" >
 < Mic className = "w-6 h-6 text-brand-light" />
 < span className = "text-white" > Record Voice</span >
        </Button >
        
 < Button variant = "outline" className = "h-24 flex flex-col items-center justify-center gap-2 border-dashed bg-white/5 hover:bg-brand-accent/10 border-brand-cyan/50" >
 < Type className = "w-6 h-6" />
 < span > Enter Text Response</span >
        </Button >
      </div >

 < div className = "border-t border-white/10 pt-6" >
 < Button 
          variant = "primary" 
          size = "lg" 
          block 
          className = "h-14 font-semibold text-lg flex items-center justify-center gap-2"
 >
 < PlayCircle className = "w-6 h-6" />
          Run AI Analysis
        </Button >
      </div >
    </Card >
  ); 
 }; 

