import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockProjects } from '@/data/mockData';
import { Link } from 'react-router-dom';
import { Plus, MapPin, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const projectStatusStyles = {
  active: 'bg-status-valid-bg text-status-valid',
  completed: 'bg-muted text-muted-foreground',
  'on-hold': 'bg-status-warning-bg text-status-warning',
};

export default function Projects() {
  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Projects</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage COIs per project</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        <div className="grid gap-4">
          {mockProjects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`}>
              <Card className="group flex items-center gap-4 border border-border p-5 transition-all hover:shadow-md hover:border-primary/20">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1">
                    <h3 className="text-base font-semibold text-foreground truncate">{project.name}</h3>
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                      projectStatusStyles[project.status]
                    )}>
                      {project.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{project.client}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1.5">
                    <MapPin className="h-3 w-3" />
                    {project.address}
                  </div>
                </div>

                <div className="flex items-center gap-6 text-center shrink-0">
                  <div>
                    <p className="text-lg font-bold text-foreground">{project.coiCount}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">COIs</p>
                  </div>
                  {project.expiringCount > 0 && (
                    <div>
                      <p className="text-lg font-bold text-status-warning">{project.expiringCount}</p>
                      <p className="text-[10px] text-status-warning uppercase tracking-wider">Expiring</p>
                    </div>
                  )}
                  {project.expiredCount > 0 && (
                    <div>
                      <p className="text-lg font-bold text-status-expired">{project.expiredCount}</p>
                      <p className="text-[10px] text-status-expired uppercase tracking-wider">Expired</p>
                    </div>
                  )}
                  <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
