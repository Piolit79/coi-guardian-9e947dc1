import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useProject } from '@/hooks/useProjects';
import { useProjectCOIs } from '@/hooks/useCOIs';
import { COICard } from '@/components/COICard';
import { DropZone } from '@/components/DropZone';
import { GLPolicyViewer } from '@/components/GLPolicyViewer';
import { CreateCOIDialog } from '@/components/CreateCOIDialog';
import { PolicyUploadButton } from '@/components/PolicyUploadButton';
import { PolicyReviewDialog } from '@/components/PolicyReviewDialog';
import { ComplianceBadge } from '@/components/ComplianceBadge';
import { Card } from '@/components/ui/card';
import { ArrowLeft, MapPin, Loader2 } from 'lucide-react';
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
  const { data: project, isLoading: projLoading } = useProject(id);
  const { data: cois, isLoading: coisLoading } = useProjectCOIs(id);
  const [selectedCOI, setSelectedCOI] = useState<COI | null>(null);

  if (projLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

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
        <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />Back to Projects
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{project.client}</p>
          {project.address && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <MapPin className="h-3 w-3" />{project.address}
            </div>
          )}
        </div>

        <DropZone className="mb-8" projectId={project.id} />

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Certificates of Insurance ({(cois || []).length})
          </h2>
          <CreateCOIDialog projectId={project.id} />
        </div>

        {coisLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (cois || []).length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {(cois || []).map((coi) => (
              <COICard key={coi.id} coi={coi} onClick={setSelectedCOI} />
            ))}
          </div>
        ) : (
          <Card className="border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">No COIs yet. Click "Add COI" or drag and drop certificates above.</p>
          </Card>
        )}

        <Dialog open={!!selectedCOI} onOpenChange={() => setSelectedCOI(null)}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            {selectedCOI && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {selectedCOI.subcontractor}
                    <StatusBadge status={selectedCOI.status} daysUntilExpiry={selectedCOI.daysUntilExpiry} />
                    <ComplianceBadge coi={selectedCOI} />
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-xs text-muted-foreground">Carrier</span><p className="font-medium text-foreground">{selectedCOI.carrier}</p></div>
                    <div><span className="text-xs text-muted-foreground">Policy Number</span><p className="font-mono text-xs font-medium text-foreground">{selectedCOI.policyNumber}</p></div>
                    <div><span className="text-xs text-muted-foreground">Expiration</span><p className="font-medium text-foreground">{selectedCOI.expirationDate}</p></div>
                  </div>

                  {/* GL Policy Upload & Review */}
                  <div className="rounded-lg border border-border p-4">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">GL Policy Document</h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <PolicyUploadButton
                        coiId={selectedCOI.id}
                        projectId={project.id}
                        currentFilePath={selectedCOI.gl_policy_file_path}
                      />
                      {selectedCOI.gl_policy_file_path && (
                        <PolicyReviewDialog
                          coiId={selectedCOI.id}
                          filePath={selectedCOI.gl_policy_file_path}
                          subcontractorName={selectedCOI.subcontractor}
                        />
                      )}
                    </div>
                    {!selectedCOI.gl_policy_file_path && (
                      <p className="text-[11px] text-muted-foreground mt-2">
                        Upload the full GL policy PDF for an in-depth AI review of exclusions and provisions.
                      </p>
                    )}
                  </div>

                  {selectedCOI.wcPolicy && (
                    <div className="rounded-lg border border-border p-4">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Workers' Compensation</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-xs text-muted-foreground">WC Policy #</span><p className="font-mono text-xs font-medium text-foreground">{selectedCOI.wcPolicy.policyNumber}</p></div>
                        <div><span className="text-xs text-muted-foreground">WC Carrier</span><p className="text-xs font-medium text-foreground">{selectedCOI.wcPolicy.carrier}</p></div>
                        <div><span className="text-xs text-muted-foreground">Effective</span><p className="text-xs font-medium text-foreground">{selectedCOI.wcPolicy.effectiveDate}</p></div>
                        <div>
                          <span className="text-xs text-muted-foreground">WC Expiration</span>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-medium text-foreground">{selectedCOI.wcPolicy.expirationDate}</p>
                            <StatusBadge status={selectedCOI.wcPolicy.status} daysUntilExpiry={selectedCOI.wcPolicy.daysUntilExpiry} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedCOI.glPolicy && <GLPolicyViewer policy={selectedCOI.glPolicy} insuredName={selectedCOI.subcontractor} />}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
