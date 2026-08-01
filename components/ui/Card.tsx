import React from "react";

const Card = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={`bg-white border border-gray-200 shadow-xs rounded-2xl ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
