import React, { useState } from 'react'; 
import { Card } from '../ui/Card'; 
import { Input } from '../ui/Input'; 
import { User } from 'lucide-react'; 

export const UserInfoSection: React.FC = () => { 
  const [age, setAge] = useState<string>(''); 
  const [error, setError] = useState<string>(''); 

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const val = e.target.value; 
    setAge(val); 
    
    if (val !== '') { 
      const num = parseInt(val, 10); 
      if (isNaN(num) || num < 10 || num > 100) { 
        setError('Age must be between 10 and 100'); 
 } else { 
        setError(''); 
 } 
 } else { 
      setError(''); 
 } 
 }; 

  return (
 < Card className = "p-6" >
 < div className = "flex items-center space-x-3 mb-6" >
 < div className = "p-2 bg-brand-cyan/20 rounded-lg text-brand-light" >
 < User className = "w-5 h-5" />
        </div >
 < h3 className = "text-lg font-semibold text-white" > Patient Profile</h3 >
      </div >
      
 < div className = "max-w-xs" >
 < Input
          label = "Enter Your Age"
          type = "number"
          placeholder = "e.g. 65"
          value = { age }
          onChange = { handleAgeChange }
          min = { 10}
          max = { 100}
          error = { error }
 />
      </div >
    </Card >
  ); 
 }; 

