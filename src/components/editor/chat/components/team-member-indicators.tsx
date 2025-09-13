import React, { useMemo } from 'react';
import useChatViewStore from '@/stores/chatViewStore';

const TeamMemberIndicators: React.FC = () => {
    const activeTeamMembersRaw = useChatViewStore((state) => state.activeTeamMembers);
    
    const activeTeamMembers = useMemo(() => 
        Object.values(activeTeamMembersRaw).filter(member => member.isActive),
        [activeTeamMembersRaw]
    );

    if (activeTeamMembers.length === 0) {
        return null;
    }

    return (
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <span className="text-gray-500">Active team members:</span>
            <div className="flex gap-2">
                {activeTeamMembers.map((member) => (
                    <div
                        key={member.id}
                        className="flex items-center gap-1.5"
                        title={`${member.name} is active`}
                    >
                        {/* Green pulsing dot */}
                        <div className="relative">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75"></div>
                        </div>
                        
                        {/* Member name */}
                        <span className="text-green-600 dark:text-green-400 font-medium">
                            {member.name}
                        </span>
                        
                        {/* Member index badge */}
                        {member.memberIndex !== undefined && (
                            <span className="px-1.5 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                                #{member.memberIndex + 1}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TeamMemberIndicators;