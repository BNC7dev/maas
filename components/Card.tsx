import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
}

export default function Card({ children, className = '', title, icon }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${className}`}>
      {title && (
        <div className="flex items-center gap-2 mb-4">
          {icon && <div className="text-primary">{icon}</div>}
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        </div>
      )}
      {children}
    </div>
  );
}
