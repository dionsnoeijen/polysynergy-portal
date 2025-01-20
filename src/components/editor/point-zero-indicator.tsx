import React from 'react';

const PointZeroIndicator: React.FC = () => {
    return (
        <div
            className="absolute top-0 left-0 h-[200px] w-[200px] bg-transparent"
        >
            <div className="absolute top-1/2 left-0 w-full border-t border-dashed border-red-500/80" />
            <div className="absolute left-1/2 top-0 h-full border-l border-dashed border-green-500/80" />
        </div>
    );
};

export default PointZeroIndicator;