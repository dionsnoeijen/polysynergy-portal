import React from "react";

const Info: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-md p-4 my-6">
        <p className="font-semibold">{title}</p>
        <div className="text-sm mt-1">{children}</div>
    </div>
);

export default Info;