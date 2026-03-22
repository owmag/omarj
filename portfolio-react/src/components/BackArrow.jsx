import React, { forwardRef } from "react";

export const BackArrow = forwardRef(function BackArrow({ onClick }, ref) {
  return (
    <div
      ref={ref}
      className="back-arrow"
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      role="button"
      tabIndex={0}
      aria-label="Go back"
    >
      ←
    </div>
  );
});
