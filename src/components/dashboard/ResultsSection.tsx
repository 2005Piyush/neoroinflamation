import React from 'react'; 
import { Card } from '../ui/Card'; 
import { Activity, Brain, BatteryMedium } from 'lucide-react'; 

const CircularScore = ({ score, label, color, icon: Icon }: { score: number, label: string, color: string, icon: any }) => { 
  const radius = 36; 
  const circumference = 2 * Math.PI * radius; 
  const strokeDashoffset = circumference - (score / 100) * circumference; 

  return (
 < div className = "flex flex-col items-center justify-center p-4 bg-white/5 rounded-2xl border border-white/10" >
 < div className = "relative w-28 h-28 flex items-center justify-center mb-3" >
 < svg className = "w-full h-full transform -rotate-90" viewBox = "0 0 100 100" >
 < circle
            cx = "50"
            cy = "50"
            r = { radius }
            className = "stroke-current text-brand-purple/50"
            strokeWidth = "8"
            fill = "transparent"
 />
 < circle
            cx = "50"
            cy = "50"
            r = { radius }
            className = {`stroke-current ${color}` }
            strokeWidth = "8"
            fill = "transparent"
            strokeDasharray = { circumference }
            strokeDashoffset = { strokeDashoffset }
            strokeLinecap = "round"
            style = {{ transition: 'stroke-dashoffset 1.5s ease-in-out' }}
 />
        </svg >
 < div className = "absolute inset-0 flex flex-col items-center justify-center" >
 < Icon className = {`w-5 h-5 mb-1 ${color.replace('text-', 'text-')}`} />
          <span className="text-xl font-bold text-white">{score}%</span >
        </div >
      </div >
 < span className = "text-sm font-medium text-gray-300 text-center leading-tight" > { label }</span >
    </div >
  ); 
}; 

export const ResultsSection: React.FC = () => { 
  return (
 < Card className = "p-6" >
 < h3 className = "text-xl font-bold text-white mb-6" > Latest Analysis Results</h3 >
      
 < div className = "grid grid-cols-1 md:grid-cols-3 gap-6" >
 < CircularScore 
          score = { 12} 
          label = "Neuroinflammation Risk" 
          color = "text-brand-light" 
          icon = { Brain } 
 />
 < CircularScore 
          score = { 94} 
          label = "Linguistic Stability" 
          color = "text-brand-accent"
          icon = { Activity } 
 />
 < CircularScore 
          score = { 28} 
          label = "Cognitive Fatigue" 
          color = "text-brand-cyan"
          icon = { BatteryMedium } 
 />
      </div >

 < div className = "mt-8" >
 < h4 className = "text-sm font-medium text-gray-400 uppercase tracking-wider mb-4" > Detailed Metrics</h4 >
 < div className = "space-y-4" >
<div>
 < div className = "flex justify-between text-sm mb-1" >
 < span className = "text-gray-300" > Lexical Diversity</span >
 < span className = "text-brand-light font-medium" > Excellent(8.5 / 10)</span >
            </div >
 < div className = "h-2 bg-brand-purple/50 rounded-full overflow-hidden" >
 < div className = "h-full bg-brand-light rounded-full" style = {{ width: '85%' } }></div >
            </div >
          </div >
<div>
 < div className = "flex justify-between text-sm mb-1" >
 < span className = "text-gray-300" > Syntactic Complexity</span >
 < span className = "text-brand-accent font-medium" > Normal(7.2 / 10)</span >
            </div >
 < div className = "h-2 bg-brand-purple/50 rounded-full overflow-hidden" >
 < div className = "h-full bg-brand-accent rounded-full" style = {{ width: '72%' }}></div >
            </div >
          </div >
        </div >
      </div >
    </Card >
  ); 
}; 

