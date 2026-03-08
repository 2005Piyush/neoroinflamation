import React from 'react'; 

interface CardProps extends React.HTMLAttributes < HTMLDivElement > { 
  children: React.ReactNode; 
  className?: string; 
 }

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => { 
  return (
 < div 
      className = {`bg-brand-purple/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] ${className}` }
      { ...props }
    >
      { children } 
    </div >
  ); 
}; 

