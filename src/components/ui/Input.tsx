import React from 'react'; 

interface InputProps extends React.InputHTMLAttributes < HTMLInputElement > { 
  label?: string; 
  error?: string; 
 }

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
({ label, error, className = '', ...props }, ref) => { 
    return (
 < div className = "w-full flex flex-col gap-1.5" >
        { label && <label className="text-sm font-medium text-brand-light">{label}</label> } 
 < input
          ref = { ref }
          className = {`w-full bg-brand-blue/50 border ${error ? 'border-red-500' : 'border-brand-cyan'} rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all ${className}` } 
          {...props } 
 />
        { error && <span className="text-xs text-red-500">{error}</span> } 
      </div >
    ); 
  }
); 

Input.displayName = 'Input'; 

