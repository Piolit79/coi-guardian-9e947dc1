import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { mockProjects } from '@/data/mockData';
import { COICard } from '@/components/COICard';
import { DropZone } from '@/components/DropZone';
import { GLPolicyViewer } from '@/components/GLPolicyViewer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, MapPin } from 'lucide-react';
import { COI } from '@/types/coi';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StatusBadge } from '@/components/StatusBadge';

export default function ProjectDetail() {
  const { id } = useParams();
  const project = mockProjects.find(p => p.id === id);
  const [selectedCOI, setSelectedCOI] = useState<COI | null>(null);

  if (!project) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <p className="text-muted-foreground">Project not found</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl">
        {/* Back link */}
        <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{project.client}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <MapPin className="h-3 w-3" />
            {project.address}
          </div>
        </div>

        {/* Drop zone */}
        <DropZone 
          className="mb-8" 
          onFilesDropped={(files) => {
            console.log('Files dropped:', files.map(f => f.name));
          }} 
        />

        {/* COI List */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Certificates of Insurance ({project.cois.length})
          </h2>
          <Button variant="outline" size="sm">Add COI Manually</Button>
        </div>

        {project.cois.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {project.cois.map((coi) => (
              <COICard key={coi.id} coi={coi} onClick={setSelectedCOI} />
            ))}
          </div>
        ) : (
          <Card className="border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">No COIs uploaded yet. Drag and drop certificates above to get started.</p>
          </Card>
        )}

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

                  {selectedCOI.glPolicy && (
                    <GLPolicyViewer policy={selectedCOI.glPolicy} />
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
