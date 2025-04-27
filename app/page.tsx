"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Color from "color";
import {
  ArrowRight,
  CheckCircle,
  CreditCard,
  Shield,
  Smartphone,
  Zap,
  ChevronDown,
  ChevronUp,
  Clock,
  Lock,
  HeadphonesIcon,
  BadgeCheck,
  ShieldCheck,
  Users,
  Award,
  LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Define interfaces for component props
interface FeatureItemProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface FaqItemProps {
  question: string;
  answer: string;
}

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  checkItems: string[];
}

interface TrustBadgeProps {
  icon: LucideIcon;
  text: string;
}

interface AnimatedBackgroundProps {
  className?: string;
  children: React.ReactNode;
}

interface DecorativeCircleProps {
  size?: "sm" | "md" | "lg" | "xl";
  position?: string;
  color?: "primary" | "secondary" | "accent";
  className?: string;
}

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}

// Enhanced animations and effects (unchanged)
const enhancedStyles = `
  @keyframes float-slow {
    0 perspective: all;
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

function FeatureItem({ icon: Icon, title, description }: FeatureItemProps) {
  return (
    <div className="flex items-start group hover:bg-primary-50 p-3 rounded-lg transition-all duration-300">
      <div className="p-2 bg-primary-100 rounded-full mr-4 group-hover:bg-primary-200 transition-colors duration-300">
        <Icon className="h-5 w-5 text-primary-600 group-hover:text-primary-700 transition-colors duration-300" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors duration-300">
          {title}
        </h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
}

function FaqItem({ question, answer }: FaqItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="group">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-5 rounded-xl text-left transition-all duration-200 ${
          isOpen
            ? "bg-primary shadow-lg"
            : "bg-white hover:bg-primary-50 text-gray-900 border border-gray-200"
        } cursor-pointer`}
        aria-expanded={isOpen}
      >
        <span
          className={`font-medium text-lg ${
            isOpen
              ? "bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600"
              : "text-gray-900"
          }`}
        >
          {question}
        </span>
        <span
          className={`transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-white" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-900" />
          )}
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div
          className={`p-5 bg-white border-x border-b rounded-b-xl ${
            isOpen ? "animate-accordion-down" : "animate-accordion-up"
          }`}
        >
          <p className="text-gray-600">{answer}</p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  checkItems,
}: FeatureCardProps) {
  return (
    <div className="flex flex-col h-full p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-primary-200 transition-all duration-300 hover:-translate-y-1 group">
      <div className="p-3 bg-primary-100 rounded-full w-12 h-12 flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors duration-300">
        <Icon className="h-6 w-6 text-primary-600 group-hover:text-primary-600 transition-colors duration-300" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors duration-300">
        {title}
      </h3>
      <p className="text-gray-600 flex-grow">{description}</p>
      <ul className="mt-4 space-y-2">
        {checkItems.map((item, index) => (
          <li key={index} className="flex items-center text-gray-600">
            <CheckCircle className="h-4 w-4 text-primary mr-2 group-hover:text-primary-600 transition-colors duration-300" />
            <span className="text-sm">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TrustBadge({ icon: Icon, text }: TrustBadgeProps) {
  return (
    <div className="flex items-center transition-all duration-300 hover:scale-110 hover:text-primary-600 group">
      <Icon className="h-4 w-4 sm:h-5 md:h-6 sm:w-5 md:w-6 text-primary-600 mr-2 group-hover:text-primary-700" />
      <span className="text-sm sm:text-base font-medium group-hover:text-primary-600">
        {text}
      </span>
    </div>
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

function AnimatedCounter({
  end,
  duration = 2000,
  prefix = "",
  suffix = "",
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      setCount(Math.floor(percentage * end));
      if (percentage < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);
  return (
    <span className="font-bold text-4xl text-primary-600">
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function Home() {
  const [settings, setSettings] = useState<any>(null);
  const [colors, setColors] = useState<{
    primaryColor: string;
    secondaryColor: string;
  } | null>(null);

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

  // Fetch colors from the new endpoint and set CSS variables
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

  return (
    <div className="flex flex-col min-h-screen">
      <style jsx global>{`
        ${enhancedStyles}
      `}</style>
      <header className="border-b border-border bg-gradient-to-r from-primary-800 to-secondary-900 sticky top-0 z-50 shadow-sm">
        <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
          {settings?.logoUrl ? (
  <img
    src={settings.logoUrl}
    alt="Site Logo"
    className="h-8 w-auto"
    loading="lazy"
  />
) : (
  <img
    src="/zelle-logo.svg"
    alt="Zelle"
    className="h-8 w-auto"
    loading="lazy"
  />
)}
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
        {/* Hero Section */}
        <AnimatedBackground className="w-full py-8 md:py-16 lg:py-24 bg-gradient-to-br from-primary-50 via-white to-secondary-50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-6 -mt-20">
                <div className="inline-block rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-700 animate-shimmer">
                  Banking Reimagined
                </div>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600">
                  Banking made simple, secure, and fast
                </h1>
                <p className="text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed max-w-[600px]">
                  Access your accounts, send money instantly, and manage your
                  finances with our secure banking platform.
                </p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:bg-gradient-to-r hover:from-primary-700 hover:to-secondary-700 text-white animate-pulse-glow"
                    asChild
                  >
                    <Link href="/register">
                      Get Started <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-white text-primary-600 border-primary-600 hover:bg-primary-600 hover:text-white"
                    asChild
                  >
                    <Link href="/login">Sign In</Link>
                  </Button>
                </div>
              </div>
              <div className="relative mx-auto w-auto max-w-[400px] lg:max-w-none group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-200/20 to-primary-100/20 rounded-3xl transform rotate-3 group-hover:rotate-0 transition-transform duration-500"></div>
                <img
                  src="/banking-app-mockup.svg"
                  alt="Banking app interface"
                  className="relative z-10 w-full h-auto rounded-2xl shadow-2xl transition-transform duration-500 group-hover:scale-105"
                  style={{ imageRendering: "crisp-edges" }}
                />
                <DecorativeCircle
                  size="md"
                  position="top-right"
                  className="-top-8 -right-8"
                />
                <DecorativeCircle
                  size="sm"
                  position="bottom-left"
                  color="accent"
                  className="-bottom-4 -left-4"
                />
              </div>
            </div>
          </div>
        </AnimatedBackground>

        {/* Stats Section */}
        <section className="w-full py-6 sm:py-10 bg-gradient-to-r from-primary-50 to-white">
          <div className="container px-2 sm:px-4 md:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 text-center">
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary-600">
                  Zelle
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Instant Transfers
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary-600">
                  Free
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Checking Account
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary-600">
                  Free
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Savings Account
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary-600">
                  AES-256
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Wire Transfers
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Badges Section */}
        <section className="w-full py-4 sm:py-8 bg-white border-y border-gray-100">
          <div className="container px-2 sm:px-4 md:px-6">
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 md:gap-12">
              <TrustBadge icon={ShieldCheck} text="Bank-Level Security" />
              <TrustBadge icon={Lock} text="End-to-End Encryption" />
              <TrustBadge icon={BadgeCheck} text="FDIC Insured" />
              <TrustBadge icon={Clock} text="24/7 Monitoring" />
              <TrustBadge icon={Award} text="Award-Winning Service" />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <AnimatedBackground className="w-full py-12 md:py-24 bg-white">
          <div className="container px-4 md:px-6 space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={Shield}
                title="Secure Banking"
                description="Advanced security features including two-factor authentication keep your money safe."
                checkItems={[
                  "End-to-end encryption",
                  "Two Factor Authentication",
                  "Biometric authentication (Future)",
                ]}
              />
              <FeatureCard
                icon={Zap}
                title="Instant Transfers"
                description="Send money instantly to friends, family, or businesses with just a few clicks."
                checkItems={[
                  "Real-time Account Transfers",
                  "No hidden fees",
                  "Zelle Enabled Banking",
                ]}
              />
              <FeatureCard
                icon={Smartphone}
                title="User-Friendly"
                description="An intuitive interface makes banking accessible and easy to understand."
                checkItems={[
                  "Simple navigation",
                  "Open 5 Days a week",
                  "Avg 2 minutes answer times",
                ]}
              />
            </div>
          </div>
        </AnimatedBackground>

        {/* Partners & Integrations Section */}
        <section className="w-full py-16 md:py-24 bg-gray-50 overflow-hidden relative">
          <DecorativeCircle
            size="xl"
            position="top-left"
            className="-top-24 -left-24 opacity-30"
          />
          <DecorativeCircle
            size="lg"
            position="bottom-right"
            color="secondary"
            className="-bottom-16 -right-16 opacity-40"
          />
          <div className="container px-4 md:px-6 relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-gray-900 mb-4">
                Connecting You With the World
              </h2>
              <p className="mx-auto max-w-[700px] text-gray-600 md:text-xl/relaxed">
                We accept international transfers from all major banks and
                cryptocurrencies all in one place
              </p>
            </div>
            <div className="relative max-w-5xl mx-auto h-[400px] md:h-[500px]">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 text-center w-[280px] sm:w-[320px] md:w-[380px] lg:w-[420px]">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                  Accept international transfers from anywhere in the world
                </h3>
              </div>
              <div className="absolute top-[15%] left-[18%] transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 hover:scale-110">
                <div className="bg-white rounded-2xl shadow-lg p-4 w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
                  <img
                    src="/logos/chase.svg"
                    alt="Chase Bank"
                    className="w-16 h-16 object-contain"
                  />
                </div>
              </div>
              <div className="absolute top-[75%] left-[22%] transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 hover:scale-110">
                <div className="bg-white rounded-2xl shadow-lg p-4 w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
                  <img
                    src="/logos/bofa.svg"
                    alt="Bank of America"
                    className="w-16 h-16 object-contain"
                  />
                </div>
              </div>
              <div className="absolute top-[35%] left-[10%] transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 hover:scale-110">
                <div className="bg-white rounded-2xl shadow-lg p-4 w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
                  <img
                    src="/logos/wells-fargo.svg"
                    alt="Wells Fargo"
                    className="w-16 h-16 object-contain"
                  />
                </div>
              </div>
              <div className="absolute top-[60%] left-[30%] transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 hover:scale-110">
                <div className="bg-white rounded-2xl shadow-lg p-4 w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
                  <img
                    src="/logos/citi.svg"
                    alt="Citibank"
                    className="w-16 h-16 object-contain"
                  />
                </div>
              </div>
              <div className="absolute top-[20%] right-[15%] transform translate-x-1/2 -translate-y-1/2 transition-all duration-500 hover:scale-110">
                <div className="bg-white rounded-2xl shadow-lg p-4 w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
                  <img
                    src="/logos/bitcoin.svg"
                    alt="Bitcoin"
                    className="w-16 h-16 object-contain"
                  />
                </div>
              </div>
              <div className="absolute top-[65%] right-[18%] transform translate-x-1/2 -translate-y-1/2 transition-all duration-500 hover:scale-110">
                <div className="bg-white rounded-2xl shadow-lg p-4 w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
                  <img
                    src="/logos/ethereum.svg"
                    alt="Ethereum"
                    className="w-16 h-16 object-contain"
                  />
                </div>
              </div>
              <div className="absolute top-[40%] right-[8%] transform translate-x-1/2 -translate-y-1/2 transition-all duration-500 hover:scale-110">
                <div className="bg-white rounded-2xl shadow-lg p-4 w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
                  <img
                    src="/logos/litecoin.svg"
                    alt="Litecoin"
                    className="w-16 h-16 object-contain"
                  />
                </div>
              </div>
              <div className="absolute top-[85%] right-[25%] transform translate-x-1/2 -translate-y-1/2 transition-all duration-500 hover:scale-110">
                <div className="bg-white rounded-2xl shadow-lg p-4 w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
                  <img
                    src="/logos/ripple.svg"
                    alt="Ripple"
                    className="w-16 h-16 object-contain"
                  />
                </div>
              </div>
            </div>
            <div className="mt-8 text-center">
              <Button
                className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:bg-gradient-to-r hover:from-primary-700 hover:to-secondary-700 text-white animate-pulse-glow"
                asChild
              >
                <Link href="/register">
                  Sign Up Now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Security & Protection Section */}
        <section className="w-full py-16 md:py-24 bg-white">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="order-2 lg:order-1 space-y-6">
                <div className="inline-block rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-700 animate-shimmer">
                  Bank-Grade Security
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-gray-900">
                  Your Security is Our Top Priority
                </h2>
                <p className="text-gray-600 md:text-xl/relaxed">
                  We employ multiple layers of security to ensure your financial
                  information and transactions remain protected at all times.
                </p>
                <div className="space-y-4">
                  <FeatureItem
                    icon={Lock}
                    title="Advanced Encryption"
                    description="256-bit encryption protects all sensitive data and communications."
                  />
                  <FeatureItem
                    icon={ShieldCheck}
                    title="Fraud Monitoring"
                    description="Real-time transaction monitoring to detect and prevent suspicious activities."
                  />
                  <FeatureItem
                    icon={BadgeCheck}
                    title="Bank Exclusive: DP Security"
                    description="We surpass all banking regulations and security standards with bank exclusive DP Security."
                  />
                </div>
              </div>
              <div className="order-1 lg:order-2 relative overflow-hidden rounded-2xl group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-200/20 to-primary-100/20 rounded-3xl transform -rotate-2 group-hover:rotate-0 transition-transform duration-500"></div>
                <div className="relative z-10 w-full h-80 rounded-2xl shadow-xl overflow-hidden">
                  <img
                    src="/security-protection.jpg"
                    alt="Bank security visualization"
                    className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <DecorativeCircle
                  size="md"
                  position="top-right"
                  color="accent"
                  className="-top-6 -right-6"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Transparency Section */}
        <section className="w-full py-16 md:py-24 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="relative overflow-hidden rounded-2xl group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-200/20 to-primary-100/20 rounded-3xl transform rotate-2 group-hover:rotate-0 transition-transform duration-500"></div>
                <div className="relative z-10 w-full h-80 rounded-2xl shadow-xl overflow-hidden">
                  <img
                    src="/transparency.jpg"
                    alt="Transparent banking"
                    className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <DecorativeCircle
                  size="md"
                  position="bottom-right"
                  color="secondary"
                  className="-bottom-6 -right-6"
                />
              </div>
              <div className="space-y-6">
                <div className="inline-block rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-700 animate-shimmer">
                  Full Transparency
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-gray-900">
                  No Hidden Fees, No Surprises
                </h2>
                <p className="text-gray-600 md:text-xl/relaxed">
                  We believe in complete transparency. All our fees and rates
                  are clearly displayed, and we'll never surprise you with
                  hidden charges.
                </p>
                <div className="space-y-4">
                  <FeatureItem
                    icon={CheckCircle}
                    title="Clear Fee Structure"
                    description="All fees are clearly displayed before you confirm any transaction."
                  />
                  <FeatureItem
                    icon={CheckCircle}
                    title="Real-Time Notifications"
                    description="Get instant alerts for all account activities and transactions."
                  />
                  <FeatureItem
                    icon={CheckCircle}
                    title="Detailed Statements"
                    description="Access comprehensive monthly statements with all transaction details."
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 24/7 Support Section */}
        <AnimatedBackground className="w-full py-16 md:py-24 bg-white">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="space-y-6">
                <div className="inline-block rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-700 animate-shimmer">
                  Here For You
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-gray-900">
                  5 Day A Week Customer Support
                </h2>
                <p className="text-gray-600 md:text-xl/relaxed">
                  Our dedicated support team is available around the clock to
                  assist you with any questions or concerns.
                </p>
                <div className="space-y-4">
                  <FeatureItem
                    icon={HeadphonesIcon}
                    title="Live Chat Support"
                    description="Connect with a support agent instantly through our bot-free phone lines."
                  />
                  <FeatureItem
                    icon={Users}
                    title="Dedicated Account Managers"
                    description="Premium accounts receive personalized support from dedicated managers."
                  />
                  <FeatureItem
                    icon={Zap}
                    title="Quick Response Time"
                    description="Our average response time is under 2 minutes."
                  />
                </div>
              </div>
              <div className="relative overflow-hidden rounded-2xl group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-200/20 to-primary-100/20 rounded-3xl transform -rotate-2 group-hover:rotate-0 transition-transform duration-500"></div>
                <div className="relative z-10 w-full h-80 rounded-2xl shadow-xl overflow-hidden">
                  <img
                    src="/customer-support.jpg"
                    alt="24/7 Customer support"
                    className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <DecorativeCircle
                  size="sm"
                  position="top-left"
                  color="accent"
                  className="-top-4 -left-4"
                />
              </div>
            </div>
          </div>
        </AnimatedBackground>

        {/* FAQ Section */}
        <section className="w-full py-16 md:py-24 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary-100 rounded-full opacity-50 transform -translate-x-1/2 -translate-y-1/2 animate-float-slow"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-primary-100 rounded-full opacity-50 transform translate-x-1/3 translate-y-1/3 animate-float-slow-reverse"></div>
          <div className="absolute top-1/4 right-1/4 w-20 h-20 bg-primary-200 rounded-full opacity-30 animate-float-medium"></div>
          <div className="absolute bottom-1/3 left-1/3 w-16 h-16 bg-primary-300 rounded-full opacity-20 animate-float-fast"></div>
          <div className="container px-4 md:px-6 relative z-10">
            <div className="text-center space-y-4 mb-12">
              <div className="inline-flex items-center justify-center p-1 px-3 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-2 animate-shimmer">
                Got Questions?
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600">
                Frequently Asked Questions
              </h2>
              <p className="mx-auto max-w-[700px] text-gray-600 md:text-xl/relaxed">
                Find answers to common questions about our banking services.
              </p>
            </div>
            <div className="max-w-3xl mx-auto">
              <div className="space-y-4">
                <FaqItem
                  question="How do I open a new account?"
                  answer="Opening a new account is simple. Click on the 'Register' button, fill out the required information, and follow the verification process. Once approved, you can immediately access your new account."
                />
                <FaqItem
                  question="Is my money safe with Zelle?"
                  answer="Absolutely. We use industry-leading security measures including end-to-end encryption, two-factor authentication, and continuous monitoring to keep your funds secure. Additionally, deposits are insured up to the maximum allowed by law."
                />
                <FaqItem
                  question="How quickly can I transfer money?"
                  answer="Transfers between Zelle accounts happen instantly. Transfers to external accounts typically process within 1-2 business days, depending on the receiving bank."
                />
                <FaqItem
                  question="Are there any fees for using Zelle?"
                  answer="Basic accounts have no monthly maintenance fees. Certain premium services and international transfers may incur nominal fees. You can view our complete fee schedule on our website."
                />
                <FaqItem
                  question="How do I access my crypto wallet?"
                  answer="After logging in, navigate to the Accounts section and select the Crypto tab. From there, you can view your holdings, buy, sell, or transfer cryptocurrencies."
                />
                <FaqItem
                  question="What if I forget my password?"
                  answer="If you forget your password, click on the 'Forgot Password' link on the login page. We'll send you a secure link to reset your password to your registered email address."
                />
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 bg-gradient-to-r from-primary-800 to-secondary-900 relative overflow-hidden">
          <DecorativeCircle
            size="xl"
            position="top-right"
            className="opacity-10 -top-32 -right-32"
          />
          <DecorativeCircle
            size="lg"
            position="bottom-left"
            className="opacity-10 -bottom-24 -left-24"
          />
          <div className="container px-4 md:px-6 text-center relative z-10">
            <div className="mx-auto max-w-[800px] space-y-6">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white">
                Ready to Transform Your Banking Experience?
              </h2>
              <p className="text-white md:text-xl/relaxed">
                Join thousands of satisfied customers who have switched to Zelle
                for a better banking experience.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  size="lg"
                  className="bg-white text-primary-800 hover:bg-gray-100 animate-pulse-glow"
                  asChild
                >
                  <Link href="/register">
                    Get Started Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white text-primary-600 border-white hover:bg-primary-600 hover:text-white"
                  asChild
                >
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Redesigned Footer */}
      <footer className="bg-gradient-to-b from-secondary-900 to-primary-900 text-white py-8">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-4">
            {settings?.logoUrl ? (
  <img
    src={settings.logoUrl}
    alt="Site Logo"
    className="h-8 w-auto"
    loading="lazy"
  />
) : (
  <img
    src="/zelle-logo.svg"
    alt="Zelle"
    className="h-8 w-auto"
    loading="lazy"
  />
)}
              <p className="text-white text-sm">
                © {new Date().getFullYear()} Iu Bank. All rights
                reserved.
              </p>
            </div>
            <div className="flex space-x-6">
              {settings?.facebookUrl && (
                <Link
                  href={settings.facebookUrl}
                  className="text-white hover:text-primary-300 transition-colors duration-300"
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
