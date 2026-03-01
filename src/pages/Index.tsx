import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { mockProjects, mockCOIs } from '@/data/mockData';
import { StatusBadge } from '@/components/StatusBadge';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  FolderKanban,
  ArrowRight,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';

const stats = [
  {
    label: 'Active Projects',
    value: mockProjects.filter(p => p.status === 'active').length,
    icon: FolderKanban,
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    label: 'Valid COIs',
    value: mockCOIs.filter(c => c.status === 'valid').length,
    icon: CheckCircle2,
    color: 'text-status-valid',
    bg: 'bg-status-valid-bg',
  },
  {
    label: 'Expiring Soon',
    value: mockCOIs.filter(c => c.status === 'expiring').length,
    icon: AlertTriangle,
    color: 'text-status-warning',
    bg: 'bg-status-warning-bg',
  },
  {
    label: 'Expired',
    value: mockCOIs.filter(c => c.status === 'expired').length,
    icon: XCircle,
    color: 'text-status-expired',
    bg: 'bg-status-expired-bg',
  },
];

const Index = () => {
  const urgentCOIs = mockCOIs
    .filter(c => c.status === 'expiring' || c.status === 'expired')
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Certificate of Insurance overview</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className="flex items-center gap-4 border border-border p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Urgent attention */}
          <Card className="border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-status-warning" />
                <h2 className="text-sm font-semibold text-foreground">Needs Attention</h2>
              </div>
              <span className="text-xs text-muted-foreground">{urgentCOIs.length} items</span>
            </div>
            <div className="space-y-3">
              {urgentCOIs.map((coi) => (
                <div key={coi.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{coi.company}</p>
                    <p className="text-xs text-muted-foreground">Exp: {coi.expirationDate}</p>
                  </div>
                  <StatusBadge status={coi.status} daysUntilExpiry={coi.daysUntilExpiry} />
                </div>
              ))}
              {urgentCOIs.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">All COIs are up to date!</p>
              )}
            </div>
          </Card>

          {/* Projects */}
          <Card className="border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">Recent Projects</h2>
              <Link to="/projects" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {mockProjects.slice(0, 4).map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5 hover:bg-muted transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{project.name}</p>
                    <p className="text-xs text-muted-foreground">{project.client}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                    <span>{project.coiCount} COIs</span>
                    {project.expiringCount > 0 && (
                      <span className="text-status-warning font-medium">{project.expiringCount} expiring</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
