import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { useIsMobile } from '@/hooks/use-mobile';

export function AppLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className={isMobile ? "pt-14 min-h-screen" : "ml-[240px] min-h-screen transition-all duration-300"}>
        {children}
      </main>
    </div>
  );
}
