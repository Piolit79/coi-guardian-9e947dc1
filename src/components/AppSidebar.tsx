import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  FolderOpen,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight } from
'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
{ path: '/', icon: LayoutDashboard, label: 'Dashboard' },
{ path: '/projects', icon: FolderKanban, label: 'Projects' },
{ path: '/files', icon: FolderOpen, label: 'Files' },
{ path: '/settings', icon: Settings, label: 'Settings' }];


export function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}>

      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        {!collapsed &&
        <div className="flex flex-col">
            <span className="font-display text-base font-semibold text-foreground">SLAB COI Tracker</span>
            <span className="text-[10px] text-sidebar-muted">Insurance Management</span>
          </div>
        }
      </div>

      {/* Nav */}
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
              {!collapsed && <span>{item.label}</span>}
            </Link>);

        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex h-12 items-center justify-center border-t border-sidebar-border text-sidebar-muted hover:text-sidebar-foreground transition-colors">

        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>);

}