"use client";

import { useState, useEffect, useMemo, JSX } from "react";
import Link from "next/link";
import Color from "color";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Define interfaces for component props and state
interface DecorativeCircleProps {
  size?: "sm" | "md" | "lg" | "xl";
  position?: string;
  color?: "primary" | "secondary" | "accent";
  className?: string;
}

interface AnimatedBackgroundProps {
  className?: string;
  children: React.ReactNode;
}

interface Settings {
  logoUrl: string;
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
}

// Enhanced animations from homepage
const enhancedStyles = `
  @keyframes float-slow {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(0, -20px); }
  }
  @keyframes float-slow-reverse {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(0, 20px); }
  }
  @keyframes float-medium {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(0, -15px); }
  }
  @keyframes float-fast {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(0, -10px); }
  }
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 0 rgba(140, 53, 234, 0.4); }
    50% { box-shadow: 0 0 20px rgba(140, 53, 234, 0.6); }
  }
  @keyframes shimmer {
    0% { background-position: -100% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes rotate-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .animate-pulse-glow {
    animation: pulse-glow 3s ease-in-out infinite;
  }
  .animate-shimmer {
    background: linear-gradient(90deg, transparent, rgba(140, 53, 234, 0.1), transparent);
    background-size: 200% 100%;
    animation: shimmer 3s infinite;
  }
  .animate-rotate-slow {
    animation: rotate-slow 15s linear infinite;
  }
`;

function DecorativeCircle({
  size = "md",
  position,
  color = "primary",
  className = "",
}: DecorativeCircleProps) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
    xl: "w-48 h-48",
  };
  const colorClasses = {
    primary: "bg-primary/10",
    secondary: "bg-primary-200/20",
    accent: "bg-primary-300/15",
  };
  return (
    <div
      className={`absolute rounded-full animate-rotate-slow ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
    ></div>
  );
}

function AnimatedBackground({
  className = "",
  children,
}: AnimatedBackgroundProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-10 left-10 w-64 h-64 bg-primary-100/30 rounded-full animate-float-slow"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-primary-100/30 rounded-full animate-float-slow-reverse"></div>
        <div className="absolute top-1/4 right-1/4 w-20 h-20 bg-primary-200/30 rounded-full animate-float-medium"></div>
        <div className="absolute bottom-1/3 left-1/3 w-16 h-16 bg-primary-300/20 rounded-full animate-float-fast"></div>
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// Parse content into JSX elements as a single cohesive block
function parseContent(content: string, siteName: string, supportEmail: string, supportPhone: string) {
  const lines = content.split("\n").filter((line) => line.trim());
  const elements: JSX.Element[] = [];

  // Replace placeholders with actual values
  const processedContent = content
    .replace(/\[Your Banking App Name\]/g, siteName || "Our App")
    .replace(/\[Insert Date\]/g, new Date().toLocaleDateString())
    .replace(/\[support@yourbankapp.com\]/g, supportEmail || "support@example.com")
    .replace(/\[Insert Contact Number\]/g, supportPhone || "N/A");

  const processedLines = processedContent.split("\n").filter((line) => line.trim());

  let currentList: JSX.Element[] = [];
  let isInList = false;

  processedLines.forEach((line, index) => {
    const trimmedLine = line.trim();

    // Handle numbered headings (e.g., "1. Information We Collect")
    if (/^\d+\.\s/.test(trimmedLine)) {
      if (isInList && currentList.length > 0) {
        elements.push(
          <ul key={`ul-${index}`} className="list-disc pl-6 mt-2 space-y-1">
            {currentList}
          </ul>
        );
        currentList = [];
        isInList = false;
      }
      elements.push(
        <h2
          key={`h2-${index}`}
          className="text-xl font-semibold mt-6 mb-2 text-gray-900"
        >
          {trimmedLine}
        </h2>
      );
    }
    // Handle bullet points
    else if (trimmedLine.startsWith("-")) {
      isInList = true;
      currentList.push(
        <li key={`li-${index}`} className="text-gray-600">
          {trimmedLine.replace("-", "").trim()}
        </li>
      );
    }
    // Handle main title
    else if (trimmedLine.match(/^(Privacy Policy|Terms of Service)$/i)) {
      // Skip, as title is handled separately
    }
    // Handle "Effective Date" or similar lines
    else if (trimmedLine.startsWith("Effective Date")) {
      elements.push(
        <p key={`p-${index}`} className="text-gray-600 italic mb-4">
          {trimmedLine}
        </p>
      );
    }
    // Handle paragraphs
    else if (trimmedLine) {
      if (isInList && currentList.length > 0) {
        elements.push(
          <ul key={`ul-${index}`} className="list-disc pl-6 mt-2 space-y-1">
            {currentList}
          </ul>
        );
        currentList = [];
        isInList = false;
      }
      elements.push(
        <p key={`p-${index}`} className="text-gray-600 mb-4">
          {trimmedLine}
        </p>
      );
    }
  });

  // Push any remaining bullet points
  if (isInList && currentList.length > 0) {
    elements.push(
      <ul key={`ul-final`} className="list-disc pl-6 mt-2 space-y-1">
        {currentList}
      </ul>
    );
  }

  return elements;
}

export default function PrivacyPolicyPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [colors, setColors] = useState<{
    primaryColor: string;
    secondaryColor: string;
  } | null>(null);
  const [policyData, setPolicyData] = useState<{
    privacyPolicy: string;
    updatedAt: string;
    siteName: string;
    supportEmail: string;
    supportPhone: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch settings for logo and social media URLs
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/home");
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        } else {
          console.error("Failed to fetch settings");
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, []);

  // Fetch colors and set CSS variables
  useEffect(() => {
    const fetchColors = async () => {
      try {
        const response = await fetch("/api/colors");
        if (response.ok) {
          const data = await response.json();
          setColors(data);

          const primary = Color(data.primaryColor);
          const secondary = Color(data.secondaryColor);

          const generateShades = (color: typeof Color.prototype) => ({
            50: color.lighten(0.5).hex(),
            100: color.lighten(0.4).hex(),
            200: color.lighten(0.3).hex(),
            300: color.lighten(0.2).hex(),
            400: color.lighten(0.1).hex(),
            500: color.hex(),
            600: color.darken(0.1).hex(),
            700: color.darken(0.2).hex(),
            800: color.darken(0.3).hex(),
            900: color.darken(0.4).hex(),
          });

          const primaryShades = generateShades(primary);
          const secondaryShades = generateShades(secondary);

          Object.entries(primaryShades).forEach(([shade, color]) => {
            document.documentElement.style.setProperty(
              `--primary-${shade}`,
              color
            );
          });

          Object.entries(secondaryShades).forEach(([shade, color]) => {
            document.documentElement.style.setProperty(
              `--secondary-${shade}`,
              color
            );
          });
        } else {
          console.error("Failed to fetch colors");
        }
      } catch (error) {
        console.error("Error fetching colors:", error);
      }
    };
    fetchColors();
  }, []);

  // Fetch privacy policy content
  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/privacy-policy");
        if (response.ok) {
          const data = await response.json();
          setPolicyData(data);
        } else {
          setError("Failed to load privacy policy");
        }
      } catch (error) {
        console.error("Error fetching privacy policy:", error);
        setError("An error occurred while loading the privacy policy");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPolicy();
  }, []);

  // Memoize parsed content
  const parsedContent = useMemo(() => {
    if (!policyData?.privacyPolicy) return [];
    return parseContent(
      policyData.privacyPolicy,
      policyData.siteName,
      policyData.supportEmail,
      policyData.supportPhone
    );
  }, [policyData]);

  return (
    <div className="flex flex-col min-h-screen">
      <style jsx global>{`
        ${enhancedStyles}
      `}</style>
      <header className="border-b border-border bg-gradient-to-r from-primary-800 to-secondary-900 sticky top-0 z-50 shadow-sm">
        <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <img
              src={settings?.logoUrl || "/placeholder.svg"}
              alt="Site Logo"
              className="h-8 w-auto"
              loading="lazy"
            />
          </div>
          <div className="ml-auto flex items-center gap-4">
            <Button
              variant="outline"
              className="bg-white text-primary-600 border-white hover:bg-primary-600 hover:text-white"
              asChild
            >
              <Link href="/login">Sign In</Link>
            </Button>
            <Button
              className="bg-white text-primary-800 hover:bg-gray-100 animate-pulse-glow"
              asChild
            >
              <Link href="/register">Register</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <AnimatedBackground className="w-full py-12 md:py-24 bg-gradient-to-br from-primary-50 via-white to-secondary-50">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <Button
                  variant="ghost"
                  asChild
                  className="p-0 mb-4 text-primary-600 hover:text-primary-700"
                >
                  <Link href="/register">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Registration
                  </Link>
                </Button>
                <div className="inline-block rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-700 animate-shimmer mb-4">
                  Privacy Policy
                </div>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600">
                  Privacy Policy
                </h1>
                <p className="text-gray-600 mt-2">
                  Last updated:{" "}
                  {policyData?.updatedAt
                    ? new Date(policyData.updatedAt).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>

              {isLoading ? (
                <div className="text-center text-gray-600">
                  Loading privacy policy...
                </div>
              ) : error ? (
                <div className="text-center text-red-600">
                  {error}
                </div>
              ) : (
                <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-primary-200 transition-all duration-300">
                  {parsedContent}
                </div>
              )}

              <div className="mt-12 text-center">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:bg-gradient-to-r hover:from-primary-700 hover:to-secondary-700 text-white animate-pulse-glow"
                  asChild
                >
                  <Link href="/register">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
          <DecorativeCircle
            size="lg"
            position="top-left"
            className="-top-16 -left-16 opacity-30"
          />
          <DecorativeCircle
            size="md"
            position="bottom-right"
            color="secondary"
            className="-bottom-12 -right-12 opacity-40"
          />
        </AnimatedBackground>
      </main>

      <footer className="bg-gradient-to-b from-secondary-900 to-primary-900 text-white py-8">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-4">
              <img
                src={settings?.logoUrl || "/placeholder.svg"}
                alt="Site Logo"
                className="h-8 w-auto"
                loading="lazy"
              />
              <p className="text-white text-sm">
                © {new Date().getFullYear()} DP Security & Company. All rights
                reserved.
              </p>
            </div>
            <div className="flex space-x-6">
              {settings?.facebookUrl && (
                <Link
                  href={settings.facebookUrl}
                  className="text-white hover:text-primary-300 transition-colors duration-300"
                  aria-label="Facebook"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 hover:scale-110 transition-transform duration-300"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </Link>
              )}
              {settings?.twitterUrl && (
                <Link
                  href={settings.twitterUrl}
                  className="text-white hover:text-primary-300 transition-colors duration-300"
                  aria-label="Twitter"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 hover:scale-110 transition-transform duration-300"
                  >
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                  </svg>
                </Link>
              )}
              {settings?.instagramUrl && (
                <Link
                  href={settings.instagramUrl}
                  className="text-white hover:text-primary-300 transition-colors duration-300"
                  aria-label="Instagram"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 hover:scale-110 transition-transform duration-300"
                  >
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}