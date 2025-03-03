import React, { useState } from "react";
import Image from "next/image";

// A simple spinner component; you can replace this with your own spinner or library component
const Spinner = () => (
  <div className="spinner">
    {/* This can be a CSS spinner or any spinner component */}
    <svg
      className="animate-spin h-8 w-8 text-gray-500"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8H4z"
      ></path>
    </svg>
  </div>
);

const SpinnerImage = ({ src, alt, width, height, className }) => {
  const [loading, setLoading] = useState(true);

  return (
    <div
      className={`object-cover ${className}`}
      style={{ width: width, height: height }}
    >
      {loading && (
        <div className="flex items-center justify-center bg-gray-100 w-full h-full">
          <Spinner />
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        onLoadingComplete={() => setLoading(false)}
      />
    </div>
  );
};

export default SpinnerImage;
