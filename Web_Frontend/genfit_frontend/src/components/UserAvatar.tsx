import React from 'react';
import { useOtherUserProfilePicture } from '../lib';
import type { ChatUser } from '../lib/types/api';

interface UserAvatarProps {
  user: ChatUser;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user, className = '', size = 'md' }) => {
  const { data: profilePicture } = useOtherUserProfilePicture(user?.username);

  // Helper function to get user initials as fallback
  const getInitial = (user?: ChatUser) => {
    if (!user || !user.username) return '?';
    return user.username.charAt(0).toUpperCase();
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };

  const baseClasses = `${sizeClasses[size]} rounded-full flex items-center justify-center bg-gray-200 text-gray-700 font-medium overflow-hidden ${className}`;

  return (
    <div className={baseClasses}>
      {profilePicture ? (
        <img 
          src={profilePicture} 
          alt={`${user?.username || 'User'}'s profile`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // If image fails to load, hide it and show initials
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        getInitial(user)
      )}
    </div>
  );
};

export default UserAvatar;
