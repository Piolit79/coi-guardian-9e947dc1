import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  FolderOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut } from
'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import slabLogo from '@/assets/slab-builders-logo.svg';

const navItems = [
{ path: '/', icon: LayoutDashboard, label: 'Dashboard' },
{ path: '/projects', icon: FolderKanban, label: 'Projects' },
{ path: '/files', icon: FolderOpen, label: 'Files' },
{ path: '/settings', icon: Settings, label: 'Settings' }];


function SidebarLogo({ compact = false }: {compact?: boolean;}) {
  if (compact) return null;
  return (
    <div className="flex flex-col items-start pt-4 w-full">
      <a href="/"><img src={slabLogo} alt="SLAB Builders" className="w-full max-w-[200px]" /></a>
    </div>
  );

}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (isMobile) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center gap-3 border-b border-border bg-background px-4 my-0">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 -ml-1.5">
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <a href="/"><img src={slabLogo} alt="SLAB Builders" className="h-7" /></a>
          <span className="text-[11px] font-medium tracking-[0.08em] uppercase px-[9px] py-[11px] my-0 mx-[4px] pr-[26px] pb-[7px]" style={{ color: '#7b7c81' }}>COI Tracker</span>
        </div>

        {mobileOpen &&
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setMobileOpen(false)}>
            <aside
            className="absolute left-0 top-0 h-full w-[260px] bg-sidebar border-r border-sidebar-border flex flex-col animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}>

              <div className="flex h-14 items-center justify-end border-b border-sidebar-border px-4">
                <button onClick={() => setMobileOpen(false)} className="p-1">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              <nav className="flex-1 space-y-1 px-3 py-4">
                {navItems.map((item) => {
                const isActive = location.pathname === item.path ||
                item.path !== '/' && location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive ?
                      "bg-sidebar-accent text-sidebar-accent-foreground" :
                      "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    )}>

                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      <span>{item.label}</span>
                    </Link>);

              })}
              </nav>
              <div className="border-t border-sidebar-border px-3 py-3">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors">
                  <LogOut className="h-[18px] w-[18px] shrink-0" />
                  <span>Log out</span>
                </button>
              </div>
            </aside>
          </div>
        }
      </>);

  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}>

      <div className={cn("flex items-center border-b border-sidebar-border", collapsed ? "h-16 justify-center px-2" : "px-4 py-5")}>
        {collapsed ?
        <span className="text-xs font-bold text-foreground">SB</span> :

        <SidebarLogo />
        }
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        <span className="block text-base font-semibold uppercase tracking-widest text-muted-foreground px-3 pb-2">COI Tracker</span>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
          item.path !== '/' && location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ?
                "bg-sidebar-accent text-sidebar-accent-foreground" :
                "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}>

              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>);

        })}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-3">
        <button
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors",
            collapsed && "justify-center px-0"
          )}>
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex h-12 items-center justify-center border-t border-sidebar-border text-sidebar-muted hover:text-sidebar-foreground transition-colors">

        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>);

}