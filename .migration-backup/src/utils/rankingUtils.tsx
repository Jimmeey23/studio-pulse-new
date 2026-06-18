import React from 'react';
import { Trophy, Medal, Award, Crown, Star, TrendingDown, ArrowDownCircle, ThumbsDown } from 'lucide-react';

export const getRankingIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="w-4 h-4 text-yellow-500" />;
    case 2:
      return <Trophy className="w-4 h-4 text-yellow-600" />;
    case 3:
      return <Medal className="w-4 h-4 text-orange-500" />;
    case 4:
      return <Award className="w-4 h-4 text-blue-500" />;
    case 5:
      return <Star className="w-4 h-4 text-purple-500" />;
    default:
      return (
        <div className="w-4 h-4 bg-slate-400 text-white rounded-full flex items-center justify-center text-xs font-bold">
          {rank}
        </div>
      );
  }
};

export const getRankingDisplay = (rank: number) => {
  if (rank <= 5) {
    return getRankingIcon(rank);
  }
  return (
    <span className="text-slate-500 text-sm font-medium">#{rank}</span>
  );
};

// Variant-aware ranking display for Top vs Bottom lists
// - 'top': keeps existing crown/trophy/medal visuals
// - 'bottom': uses downward/negative metaphors in red/orange hues
export const getRankingDisplayVariant = (rank: number, variant: 'top' | 'bottom' = 'top') => {
  if (variant === 'top') return getRankingDisplay(rank);

  // Bottom ranking visuals
  switch (rank) {
    case 1:
      return <ArrowDownCircle className="w-5 h-5 text-red-600" />;
    case 2:
      return <TrendingDown className="w-5 h-5 text-rose-600" />;
    case 3:
      return <ThumbsDown className="w-5 h-5 text-orange-500" />;
    default:
      return (
        <span className="text-rose-600/80 text-xs font-semibold">#{rank}</span>
      );
  }
};