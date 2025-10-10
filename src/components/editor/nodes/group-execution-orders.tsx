import React from 'react';

type GroupExecutionOrdersProps = {
    orders: number[];
};

const GroupExecutionOrders: React.FC<GroupExecutionOrdersProps> = ({ orders }) => {
    if (orders.length === 0) {
        return null;
    }

    return (
        <div className="absolute top-[-20px] left-[50%] -translate-x-1/2 m-1 pointer-events-none select-none z-10">
            <div className="inline-flex items-center">
                {orders.map((order, idx) => (
                    <span
                        key={order}
                        className="
                            inline-flex
                            items-center
                            justify-center
                            h-8
                            min-w-8
                            px-2
                            bg-sky-500
                            text-white
                            text-lg
                            rounded-full
                            ring-2
                            ring-white
                            dark:ring-gray-800
                        "
                        style={{ marginLeft: idx > 0 ? '-4px' : '0' }}
                    >
                        <b>{order + 1}</b>
                    </span>
                ))}
            </div>
        </div>
    );
};

export default GroupExecutionOrders;
