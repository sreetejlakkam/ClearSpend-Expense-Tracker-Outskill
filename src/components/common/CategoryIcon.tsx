import React from 'react';
import * as Icons from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  color?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  name,
  className = 'w-5 h-5',
  color,
  size = 20,
}) => {
  // Lucide icon mapping
  const IconComponent = (Icons as any)[name] || (Icons as any)['Tag'] || Icons.Circle;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg ${className}`}
      style={color ? { color } : undefined}
    >
      <IconComponent size={size} strokeWidth={2.2} />
    </span>
  );
};
