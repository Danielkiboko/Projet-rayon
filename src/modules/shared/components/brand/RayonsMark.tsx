import React from "react";

interface RayonsMarkProps {
  className?: string;
  size?: number | string;
  color?: string;
}

export function RayonsMark({ 
  className = "", 
  size = 32, 
  color = "#C7D300" 
}: RayonsMarkProps) {
  const pixelSize = typeof size === "number" ? `${size}px` : size;

  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block flex-shrink-0 transition-transform ${className}`}
      aria-label="Logo Rayons"
    >
      {/* Barre Supérieure avec aile aérodynamique */}
      <path
        d="M 28 16 
           C 20 16, 14 22, 14 30 
           C 14 38, 20 44, 28 44 
           L 78 44 
           C 87 44, 95 38, 97 29 
           C 98 25, 96 19, 90 17 
           C 85 16, 75 16, 68 16 
           Z"
        fill={color}
      />
      {/* Barre Médiane */}
      <path
        d="M 20 47 
           C 12 47, 6 53, 6 61 
           C 6 69, 12 75, 20 75 
           L 72 75 
           C 80 75, 87 69, 87 61 
           C 87 53, 80 47, 72 47 
           Z"
        fill={color}
      />
      {/* Barre Inférieure */}
      <path
        d="M 12 78 
           C 5 78, 0 84, 0 91 
           C 0 98, 5 104, 12 104 
           L 58 104 
           C 66 104, 72 98, 72 91 
           C 72 84, 66 78, 58 78 
           Z"
        transform="translate(4, -8)"
        fill={color}
      />
    </svg>
  );
}
