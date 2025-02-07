import React from "react";
import { MockNode } from "@/stores/mockStore";

const ExecutionOrder: React.FC<{ mockNode: MockNode, centered: boolean }> = ({ mockNode, centered = true }) => {
    const position = centered ? "left-[50%] -translate-x-1/2" : "right-[-20px] ";
    return (
      <div className={`absolute top-[-20px] ${position} m-1 pointer-events-none user-select-none`}>
        <span className="text-lg bg-black/70 text-white p-3 rounded-full user-select-none">
            <b>{mockNode.order+1}</b>
        </span>
    </div>
    );
};

export default ExecutionOrder;