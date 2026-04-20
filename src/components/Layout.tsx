import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Landmark,
  ArrowLeftRight,
  FileText,
  ListTree,
  Shield,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Users,
  Stethoscope,
  Briefcase,
  Lock,
  AlertCircle,
  CreditCard,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTheme } from "@/components/ThemeProvider";
import { Sun, Moon } from "lucide-react";

const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "GOOD MORNING";
  if (hour >= 12 && hour < 17) return "GOOD AFTERNOON";
  if (hour >= 17 && hour < 21) return "GOOD EVENING";
  return "GOOD NIGHT";
};

const WelcomeCFO = ({ onComplete }: { onComplete: () => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const greeting = getTimeBasedGreeting();
  const fullText = `${greeting} CFO, HOW ARE YOU?`;

  useGSAP(() => {
    const tl = gsap.timeline({ onComplete });
    
    tl.fromTo(containerRef.current, 
      { opacity: 0 }, 
      { opacity: 1, duration: 0.5 }
    );

    tl.fromTo(".welcome-char", 
      { y: 50, opacity: 0, rotateX: -90 }, 
      { y: 0, opacity: 1, rotateX: 0, duration: 0.6, stagger: 0.02, ease: "back.out(2)" },
      "-=0.2"
    );

    tl.to(".welcome-char", {
      scale: 1.1,
      color: "#0ea5e9",
      duration: 0.4,
      stagger: { each: 0.015, from: "center" },
      ease: "power2.inOut"
    });

    tl.to(containerRef.current, {
      opacity: 0,
      scale: 1.1,
      filter: "blur(30px)",
      duration: 1,
      delay: 1.5,
      ease: "power4.in"
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#09090b]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0ea5e9]/10 blur-[130px] rounded-full animate-pulse" />
      </div>
      
      <div className="text-center relative z-10 px-6">
        <div className="mb-10 flex justify-center">
          <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-tr from-[#0ea5e9] via-blue-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-[#0ea5e9]/30 transform rotate-12">
            <Shield className="w-10 h-10 text-white -rotate-12" />
          </div>
        </div>
        <h1 className="welcome-text text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter text-[#f4f4f5] flex flex-wrap justify-center gap-x-4">
          {fullText.split(" ").map((word, i) => (
            <span key={i} className="inline-flex">
               {word.split("").map((char, j) => (
                 <span key={j} className="welcome-char inline-block">{char}</span>
               ))}
            </span>
          ))}
        </h1>
        <div className="mt-10 flex flex-col items-center gap-3">
          <p className="text-[#0ea5e9]/70 font-bold tracking-[0.4em] uppercase text-[10px] animate-pulse">
            KW&SC FINANCE - Executive Suite
          </p>
          <div className="w-64 h-[1px] bg-gradient-to-r from-transparent via-[#0ea5e9]/30 to-transparent" />
        </div>
      </div>
    </div>
  );
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>("book-section");
  const location = useLocation();
  const { signOut, userRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const mainRef = useRef<HTMLDivElement>(null);
  
  const isCFORole = userRole === 'cfo';

  const [showSplash, setShowSplash] = useState(() => {
    if (!isCFORole) return false;
    return true;
  });

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const topNavItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/book-section/file-tracking", icon: Shield, label: "File Tracking" },
  ];

  const categories = isCFORole ? [
    {
      id: "book-section",
      label: "Sections Management",
      items: [
        { to: "/book-section/emp-details", label: "Employee Details", icon: ListTree },
        { to: "/book-section/medical", label: "Medical Section", icon: Stethoscope },
        { to: "/book-section/contractor", label: "Contractor Section", icon: Briefcase },
        { to: "/book-section/security-deposit", label: "Security Deposit", icon: Lock },
        { to: "/book-section/pol-bills", label: "POL Bills", icon: FileText },
        { to: "/book-section/contingencies", label: "Contingencies", icon: AlertCircle },
        { to: "/book-section/bill-dispatch", label: "Bill Dispatch", icon: ArrowLeftRight },
      ]
    }
  ] : [];

  const bottomNavItems = isCFORole ? [
    { to: "/general-ledger", icon: BookOpen, label: "General Ledger" },
    { to: "/book-section/cheque-record", icon: CreditCard, label: "Cheque Record" },
    { to: "/bank-accounts", icon: Landmark, label: "Bank Accounts" },
    { to: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
    { to: "/bank-entries", icon: CreditCard, label: "Bank Entries" },
  ] : [];

  useGSAP(() => {
    setMobileOpen(false);
    if (mainRef.current) {
      gsap.fromTo(
        mainRef.current,
        { opacity: 0, y: 30, filter: "blur(10px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7, ease: "power3.out", clearProps: "filter" }
      );
    }
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-background relative">
      {showSplash && <WelcomeCFO onComplete={handleSplashComplete} />}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed lg:relative inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-sidebar transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "h-full"
        )}
      >
        <div className="flex items-center gap-2 px-4 py-5 border-b border-border justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-md bg-[#0ea5e9]/10 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-[#0ea5e9]" />
            </div>
            {!collapsed && (
              <span className="text-sm font-black tracking-tight text-[#0ea5e9] truncate">
                KW&SC FINANCE
              </span>
            )}
          </div>
          <button
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {topNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-[#0ea5e9]/10 text-[#0ea5e9] font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}

          {categories.map((category) => {
            const isOpen = openCategory === category.id;
            return (
              <div key={category.id} className="flex flex-col mt-2 border-t border-border/50 pt-2">
                <button
                  onClick={() => !collapsed && setOpenCategory(isOpen ? null : category.id)}
                  className={cn(
                    "flex items-center w-full px-4 py-3 text-sm transition-colors text-sidebar-foreground",
                    isOpen ? "bg-sidebar-accent font-medium text-[#0ea5e9]" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  {!collapsed ? (
                    <span>{category.label}</span>
                  ) : (
                    <Shield className="w-4 h-4 mx-auto" />
                  )}
                </button>

                {!collapsed && isOpen && (
                  <div className="flex flex-col bg-sidebar-accent/30 py-2 space-y-1">
                    {category.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                          cn(
                            "px-8 py-2 text-sm transition-colors flex items-center gap-2",
                            isActive
                              ? "text-[#0ea5e9] font-medium bg-[#0ea5e9]/5"
                              : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                          )
                        }
                      >
                        {item.icon && <item.icon className="w-3.5 h-3.5 shrink-0 opacity-70" />}
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className={cn("pt-2 border-t border-border/50 space-y-1", !isCFORole && "hidden")}>
            {bottomNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-[#0ea5e9]/10 text-[#0ea5e9] font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="p-2 border-t border-border space-y-2">
          <button
            onClick={signOut}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors text-rose-500 hover:bg-rose-500/10",
              collapsed && "justify-center"
            )}
            title="Logout"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>

          <button
            onClick={toggleTheme}
            className={cn(
                  "flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors hover:bg-sidebar-accent",
                  collapsed && "justify-center"
                )}
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="w-4 h-4 shrink-0 text-yellow-500" />
                    {!collapsed && <span>Light Mode</span>}
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 shrink-0 text-indigo-400" />
                    {!collapsed && <span>Dark Mode</span>}
                  </>
                )}
              </button>
    
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="hidden lg:flex items-center justify-center w-full p-2 rounded-md text-muted-foreground hover:bg-sidebar-accent transition-colors"
              >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>
          </aside>
    
          <main className="flex-1 flex flex-col overflow-auto w-full relative">
            <div className="lg:hidden flex items-center p-4 border-b border-white/5 bg-sidebar/80 backdrop-blur-md sticky top-0 z-30">
              <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2 text-foreground/80 hover:text-primary">
                <Menu className="w-6 h-6" />
              </button>
              <div className="ml-2 font-black tracking-tighter text-[#0ea5e9] flex items-center gap-2">
                <Shield className="w-5 h-5" />
                KW&SC FINANCE
              </div>
            </div>
    
            <div ref={mainRef} className="p-4 md:p-6 w-full max-w-[1400px] mx-auto opacity-0 flex-1">{children}</div>
          </main>
        </div>
      );
    }
