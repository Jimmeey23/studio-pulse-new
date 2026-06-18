import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const trainerImageMap: Record<string, string> = {
  'Anisha': '/images/001-1_Anisha-1-e1590837044475.jpg',
  'Atulan': '/images/002-Atulan-Image-1.jpg',
  'Cauveri': '/images/003-Cauveri-1.jpg',
  'Kajol': '/images/004-Kajol-Kanchan-1.jpg',
  'Kajol Kanchan': '/images/004-Kajol-Kanchan-1.jpg',
  'Karan': '/images/005-Karan-Bhatia-1-1.jpeg',
  'Karan Bhatia': '/images/005-Karan-Bhatia-1-1.jpeg',
  'Mrigakshi': '/images/007-Mrigakshi-Image-2.jpg',
  'Pranjali': '/images/008-Pranjali-Image-1.jpg',
  'Pushyank': '/images/009-Pushyank-Nahar-1.jpeg',
  'Pushyank Nahar': '/images/009-Pushyank-Nahar-1.jpeg',
  'Reshma': '/images/010-Reshma-Image-3.jpg',
  'Richard': '/images/011-Richard-Image-3.jpg',
  'Rohan': '/images/012-Rohan-Image-3.jpg',
  'Saniya': '/images/013-Saniya-Image-1.jpg',
  'Shruti': '/images/014-Shruti-Kulkarni.jpeg',
  'Shruti Kulkarni': '/images/014-Shruti-Kulkarni.jpeg',
  'Vivaran': '/images/015-Vivaran-Image-4.jpg',
  'Anmol': '/images/Anmol.jpeg',
  'Bret': '/images/Bret.jpeg',
  'Karanveer': '/images/Karanveer.jpg',
  'Raunak': '/images/Raunak.jpeg',
  'Simonelle': '/images/Simonelle.jpeg',
  'Simran': '/images/Simran.jpeg',
  'Sovena': '/images/Sovena.jpeg',
  'Veena': '/images/Veena.jpeg',
  'Kabir': '/images/Kabir.jpg',
  'Upasna': '/images/Upasana.jpg',
  'Janhavi': '/images/Janhavi.jpg',
  'Nishanth': '/images/Nishanth.jpg'
};

/**
 * Get trainer avatar URL based on trainer name
 * Falls back to placeholder if no image is found
 */
export const getTrainerAvatar = (trainerName: string): string => {
  if (!trainerName) return '/placeholder.svg';
  
  // Try exact match first
  if (trainerImageMap[trainerName]) {
    return trainerImageMap[trainerName];
  }
  
  // Try partial match (case-insensitive)
  const nameKey = Object.keys(trainerImageMap).find(key => 
    key.toLowerCase().includes(trainerName.toLowerCase()) ||
    trainerName.toLowerCase().includes(key.toLowerCase())
  );
  
  if (nameKey && trainerImageMap[nameKey]) {
    return trainerImageMap[nameKey];
  }
  
  // Fallback to placeholder
  return '/placeholder.svg';
};

/**
 * Get trainer initials for avatar fallback
 */
export const getTrainerInitials = (trainerName: string): string => {
  if (!trainerName) return '??';
  
  const names = trainerName.trim().split(' ');
  if (names.length === 1) {
    return names[0].substring(0, 2).toUpperCase();
  }
  
  return names
    .slice(0, 2)
    .map(name => name[0])
    .join('')
    .toUpperCase();
};

/**
 * Check if trainer has a custom image
 */
export const hasTrainerImage = (trainerName: string): boolean => {
  if (!trainerName) return false;
  
  // Exact match
  if (trainerImageMap[trainerName]) return true;
  
  // Partial match
  return Object.keys(trainerImageMap).some(key => 
    key.toLowerCase().includes(trainerName.toLowerCase()) ||
    trainerName.toLowerCase().includes(key.toLowerCase())
  );
};

/**
 * Get all available trainer names that have images
 */
export const getAvailableTrainers = (): string[] => {
  return Object.keys(trainerImageMap).sort();
};

/**
 * Component for trainer avatar with automatic image selection
 */
interface TrainerAvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTooltip?: boolean;
}

export const TrainerAvatar: React.FC<TrainerAvatarProps> = ({
  name,
  size = 'md',
  className,
  showTooltip = false
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm', 
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };

  return (
    <Avatar 
      className={cn(sizeClasses[size], className)}
      title={showTooltip ? name : undefined}
    >
      <AvatarImage 
        src={getTrainerAvatar(name)} 
        alt={name}
        className="object-cover"
      />
      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
        {getTrainerInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
};
