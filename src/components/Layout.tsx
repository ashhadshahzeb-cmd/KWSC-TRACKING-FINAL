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

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
];

const categories = [
  {
    id: "book-section",
    label: "Book Section",
    items: [
      { to: "/book-section/file-tracking", label: "File Tracking" },
    ]
  }
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>("book-section");
  const location = useLocation();
  const { signOut } = useAuth();
  const mainRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    setMobileOpen(false); // Auto close mobile drawer on route change
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
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
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
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="text-sm font-bold tracking-wide text-foreground truncate">
                FinLedger
              </span>
            )}
          </div>
          {/* Mobile Close Button */}
          <button 
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(false)}
          >
             <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}

          {/* Accordion Categories */}
          <div className="flex flex-col mt-2 border-t border-border/50 pt-2">
            {categories.map((category) => {
              const isOpen = openCategory === category.id;
              return (
                <div key={category.id} className="flex flex-col">
                  <button
                    onClick={() => !collapsed && setOpenCategory(isOpen ? null : category.id)}
                    className={cn(
                      "flex items-center w-full px-4 py-3 text-sm transition-colors text-sidebar-foreground",
                      isOpen ? "bg-black/40 font-medium" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    {!collapsed ? (
                      <span>{category.label}</span>
                    ) : (
                      <span className="w-full text-center text-xs font-semibold">{category.label.charAt(0)}</span>
                    )}
                  </button>
                  
                  {!collapsed && isOpen && (
                    <div className="flex flex-col bg-black/10 py-2 space-y-1">
                      {category.items.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          className={({ isActive }) =>
                            cn(
                              "px-8 py-2 text-sm transition-colors flex items-center",
                              isActive
                                ? "text-primary font-medium"
                                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                            )
                          }
                        >
                          <span className="truncate">{item.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            
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
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-full p-2 rounded-md text-muted-foreground hover:bg-sidebar-accent transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-auto w-full relative">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center p-4 border-b border-white/5 bg-sidebar/80 backdrop-blur-md sticky top-0 z-30">
           <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2 text-foreground/80 hover:text-primary">
             <Menu className="w-6 h-6" />
           </button>
           <div className="ml-2 font-bold tracking-widest text-primary flex items-center gap-2">
              <Shield className="w-5 h-5" /> FINLEDGER
           </div>
        </div>

        <div ref={mainRef} className="p-4 md:p-6 w-full max-w-[1400px] mx-auto opacity-0 flex-1">{children}</div>
      </main>
    </div>
  );
}
