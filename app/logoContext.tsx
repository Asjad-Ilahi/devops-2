"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

// Define the shape of the context
interface LogoContextType {
  logoUrl: string | null;
  setLogoUrl: (url: string | null) => void;
}

// Create the context with a default value
const LogoContext = createContext<LogoContextType | undefined>(undefined);

// Logo Provider component
export const LogoProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Fetch logo settings from API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/home");
        if (response.ok) {
          const data = await response.json();
          setLogoUrl(data.logoUrl || "/zelle-logo.svg"); // Fallback to default logo
        } else {
          console.error("Failed to fetch settings");
          setLogoUrl("/zelle-logo.svg"); // Fallback logo
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        setLogoUrl("/zelle-logo.svg"); // Fallback logo
      }
    };
    fetchSettings();
  }, []);

  return (
    <LogoContext.Provider value={{ logoUrl, setLogoUrl }}>
      {children}
    </LogoContext.Provider>
  );
};

// Custom hook to use the LogoContext
export const useLogo = () => {
  const context = useContext(LogoContext);
  if (!context) {
    throw new Error("useLogo must be used within a LogoProvider");
  }
  return context;
};