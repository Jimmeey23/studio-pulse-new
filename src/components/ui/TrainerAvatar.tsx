import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';

const normalizeTrainerName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Mapping of trainer names to their image files
const TRAINER_IMAGE_MAP: Record<string, string> = {
  // Exact mappings based on available images
  'Anisha': '001-1_Anisha-1-e1590837044475.jpg',
  'Atulan': '002-Atulan-Image-1.jpg',
  'Cauveri': '003-Cauveri-1.jpg',
  'Kajol': '004-Kajol-Kanchan-1.jpg',
  'Kajol Kanchan': '004-Kajol-Kanchan-1.jpg',
  'Karan': '005-Karan-Bhatia-1-1.jpeg',
  'Karan Bhatia': '005-Karan-Bhatia-1-1.jpeg',
  'Mrigakshi': '007-Mrigakshi-Image-2.jpg',
  'Pranjali': '008-Pranjali-Image-1.jpg',
  'Pushyank': '009-Pushyank-Nahar-1.jpeg',
  'Pushyank Nahar': '009-Pushyank-Nahar-1.jpeg',
  'Reshma': '010-Reshma-Image-3.jpg',
  'Richard': '011-Richard-Image-3.jpg',
  'Rohan': '012-Rohan-Image-3.jpg',
  'Saniya': '013-Saniya-Image-1.jpg',
  'Shruti': '014-Shruti-Kulkarni.jpeg',
  'Shruti Kulkarni': 'Shruti-Kulkarni.jpeg',
  'Vivaran': '015-Vivaran-Image-4.jpg',
  'Anmol': 'Anmol.jpeg',
  'Bret': 'Bret.jpeg',
  'Janhavi': 'Janhavi.jpg',
  'Kabir': 'Kabir.jpg',
  'Karanvir': 'Karanveer.jpg',
  'Nishanth': 'Nishanth.jpg',
  'Raunak': 'Raunak.jpeg',
  'Simonelle': 'Simonelle.jpeg',
  'Simran': 'Simran.jpeg',
  'Sovena': 'Sovena.jpeg',
  'Upasna': 'Upasana.jpg',
  'Veena': 'Veena.jpeg'
};

// Additional mappings for variations in names
const NAME_VARIATIONS: Record<string, string> = {
  'shruti kulkarni': 'Shruti Kulkarni',
  'kajol kanchan': 'Kajol Kanchan',
  'karan bhatia': 'Karan Bhatia',
  'karanvir bhatia': 'Karan Bhatia',
  'karanveer bhatia': 'Karan Bhatia',
  'pushyank nahar': 'Pushyank Nahar',
  'upasna paranjpe': 'Upasna',
  'upasana paranjpe': 'Upasna',
  'richard dcosta': 'Richard',
  'richard d costa': 'Richard',
  'mrigakshi jaiswal': 'Mrigakshi',
  'simonelle de vitre': 'Simonelle',
  'sovena shetty': 'Sovena',
  'cauveri vikrant': 'Cauveri',
  'nishanth raj': 'Nishanth',
  'reshma sharma': 'Reshma',
  'pranjali jain': 'Pranjali',
  'anisha shah': 'Anisha',
  'atulan purohit': 'Atulan',
  'janhavi jain': 'Janhavi',
  'rohan dahima': 'Rohan',
  'vivaran dhasmana': 'Vivaran',
  'saniya jaiswal': 'Saniya',
  'anmol sharma': 'Anmol',
  'bret saldanha': 'Bret',
  'kabir varma': 'Kabir',
  'raunak khemuka': 'Raunak',
  'simran dutt': 'Simran'
};

const NORMALIZED_IMAGE_MAP: Record<string, string> = Object.entries(TRAINER_IMAGE_MAP).reduce(
  (acc, [key, fileName]) => {
    acc[normalizeTrainerName(key)] = fileName;
    return acc;
  },
  {} as Record<string, string>
);

/**
 * Get the image path for a trainer
 */
export const getTrainerImage = (trainerName: string): string => {
  if (!trainerName) return '';

  const normalizedName = normalizeTrainerName(trainerName);

  // Try exact match first
  if (TRAINER_IMAGE_MAP[trainerName]) {
    return `/images/${TRAINER_IMAGE_MAP[trainerName]}`;
  }

  // Try normalized full-name match
  if (NORMALIZED_IMAGE_MAP[normalizedName]) {
    return `/images/${NORMALIZED_IMAGE_MAP[normalizedName]}`;
  }

  // Try normalized alias match
  const canonicalVariation = NAME_VARIATIONS[normalizedName];
  if (canonicalVariation) {
    const normalizedCanonical = normalizeTrainerName(canonicalVariation);
    if (TRAINER_IMAGE_MAP[canonicalVariation]) {
      return `/images/${TRAINER_IMAGE_MAP[canonicalVariation]}`;
    }
    if (NORMALIZED_IMAGE_MAP[normalizedCanonical]) {
      return `/images/${NORMALIZED_IMAGE_MAP[normalizedCanonical]}`;
    }
  }

  // Try first name match
  const firstName = normalizedName.split(' ')[0];
  if (firstName && NORMALIZED_IMAGE_MAP[firstName]) {
    return `/images/${NORMALIZED_IMAGE_MAP[firstName]}`;
  }
  
  return '';
};

/**
 * Get trainer initials for fallback
 */
export const getTrainerInitials = (trainerName: string): string => {
  if (!trainerName) return 'T';
  
  const nameParts = trainerName.trim().split(' ');
  if (nameParts.length >= 2) {
    return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
  }
  return trainerName.slice(0, 2).toUpperCase();
};

/**
 * Trainer Avatar Component with image support
 */
interface TrainerAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showName?: boolean;
}

export const TrainerAvatar: React.FC<TrainerAvatarProps> = ({ 
  name, 
  size = 'sm', 
  className = '',
  showName = true 
}) => {
  const imageFileName = getTrainerImage(name);
  const initials = getTrainerInitials(name);
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10', 
    lg: 'w-12 h-12'
  };
  
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Avatar className={sizeClasses[size]}>
        {imageFileName && (
          <AvatarImage 
            src={imageFileName}
            alt={name}
            className="object-cover"
          />
        )}
        <AvatarFallback className={`${textSizes[size]} font-medium bg-gradient-to-br from-blue-500 to-purple-600 text-white`}>
          {initials}
        </AvatarFallback>
      </Avatar>
      {showName && (
        <span className={`font-medium text-gray-900 ${textSizes[size]} truncate`}>
          {name}
        </span>
      )}
    </div>
  );
};

/**
 * Simple trainer name cell with avatar - for table use
 */
interface TrainerNameCellProps {
  name: string; 
  className?: string;
  showName?: boolean;
}

export const TrainerNameCell: React.FC<TrainerNameCellProps> = ({ 
  name, 
  className = '',
  showName = true 
}) => {
  return (
    <div className={`flex items-center gap-2 min-w-0 ${className}`}>
      <TrainerAvatar name={name} size="sm" showName={false} />
      {showName && (
        <span className="font-medium text-gray-900 truncate text-sm">
          {name}
        </span>
      )}
    </div>
  );
};

export default TrainerAvatar;