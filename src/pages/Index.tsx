import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { mockProjects } from '@/data/mockData';
import { StatusBadge } from '@/components/StatusBadge';
import { 
  ChevronDown,
  ChevronRight,
  MapPin,
  Building2,
  FileText,
  Calendar,
  Shield,
  FolderKanban,
  AlertTriangle,
  XCircle,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { COI } from '@/types/coi';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { GLPolicyViewer } from '@/components/GLPolicyViewer';

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
    value: mockProjects.reduce((sum, p) => sum + p.cois.filter(c => c.status === 'valid').length, 0),
    icon: CheckCircle2,
    color: 'text-status-valid',
    bg: 'bg-status-valid-bg',
  },
  {
    label: 'Expiring Soon',
    value: mockProjects.reduce((sum, p) => sum + p.cois.filter(c => c.status === 'expiring').length, 0),
    icon: AlertTriangle,
    color: 'text-status-warning',
    bg: 'bg-status-warning-bg',
  },
  {
    label: 'Expired',
    value: mockProjects.reduce((sum, p) => sum + p.cois.filter(c => c.status === 'expired').length, 0),
    icon: XCircle,
    color: 'text-status-expired',
    bg: 'bg-status-expired-bg',
  },
];

const projectStatusStyles = {
  active: 'bg-status-valid-bg text-status-valid',
  completed: 'bg-muted text-muted-foreground',
  'on-hold': 'bg-status-warning-bg text-status-warning',
};

const Index = () => {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [selectedCOI, setSelectedCOI] = useState<COI | null>(null);

  const toggleProject = (id: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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

        {/* Projects with expandable subs */}
        <div className="space-y-3">
          {mockProjects.map((project) => {
            const isOpen = expandedProjects.has(project.id);
            return (
              <Collapsible key={project.id} open={isOpen} onOpenChange={() => toggleProject(project.id)}>
                <Card className="border border-border overflow-hidden">
                  <CollapsibleTrigger className="w-full text-left">
                    <div className="flex items-center gap-4 p-4 hover:bg-muted/40 transition-colors">
                      <div className={cn(
                        "flex h-5 w-5 items-center justify-center transition-transform",
                        isOpen && "rotate-0"
                      )}>
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-sm font-semibold text-foreground truncate">{project.name}</h3>
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                            projectStatusStyles[project.status]
                          )}>
                            {project.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-muted-foreground">{project.client}</span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {project.address}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-5 text-center shrink-0">
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
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border-t border-border bg-muted/20">
                      {project.cois.length > 0 ? (
                        <div className="divide-y divide-border">
                          {project.cois.map((coi) => (
                            <button
                              key={coi.id}
                              onClick={() => setSelectedCOI(coi)}
                              className="w-full flex items-center gap-4 px-6 py-3 text-left hover:bg-muted/40 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-sm font-medium text-foreground">{coi.company}</span>
                                  <StatusBadge status={coi.status} daysUntilExpiry={coi.daysUntilExpiry} />
                                </div>
                                <p className="text-xs text-muted-foreground">{coi.subcontractor}</p>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {coi.carrier}
                                </span>
                                <span className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  {coi.policyNumber}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {coi.expirationDate}
                                </span>
                                {coi.glPolicy && (
                                  <span title="GL Policy on file"><Shield className="h-3.5 w-3.5 text-primary" /></span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="px-6 py-6 text-center">
                          <p className="text-sm text-muted-foreground">No COIs uploaded yet.</p>
                          <Link to={`/projects/${project.id}`} className="text-xs text-primary hover:underline mt-1 inline-block">
                            Go to project to add COIs →
                          </Link>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>

        {/* COI Detail Dialog */}
        <Dialog open={!!selectedCOI} onOpenChange={() => setSelectedCOI(null)}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            {selectedCOI && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {selectedCOI.company}
                    <StatusBadge status={selectedCOI.status} daysUntilExpiry={selectedCOI.daysUntilExpiry} />
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground">Subcontractor</span>
                      <p className="font-medium text-foreground">{selectedCOI.subcontractor}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Carrier</span>
                      <p className="font-medium text-foreground">{selectedCOI.carrier}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Policy Number</span>
                      <p className="font-mono text-xs font-medium text-foreground">{selectedCOI.policyNumber}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Expiration</span>
                      <p className="font-medium text-foreground">{selectedCOI.expirationDate}</p>
                    </div>
                  </div>
                  {selectedCOI.glPolicy && <GLPolicyViewer policy={selectedCOI.glPolicy} />}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Index;
