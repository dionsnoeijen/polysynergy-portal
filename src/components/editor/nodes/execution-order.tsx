import React from "react";
import { MockNode } from "@/stores/mockStore";

type ExecutionOrderProps = {
  mockNode: MockNode;
  centered?: boolean;
};

const ExecutionOrder: React.FC<ExecutionOrderProps> = ({
  mockNode,
  centered = true
}) => {
  const position = centered
    ? "left-[50%] -translate-x-1/2"
    : "right-[-20px]";

  return (
    <div
      className={`absolute top-[-20px] ${position} m-1 pointer-events-none select-none`}
    >
      <span
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
          "
      >
        <b>{mockNode.order + 1}</b>
      </span>
    </div>
  );
};

export default ExecutionOrder;