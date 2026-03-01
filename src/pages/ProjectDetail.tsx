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
import { useGCSettings } from '@/hooks/useGCSettings';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Loader2, FileText, ExternalLink, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { COI } from '@/types/coi';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StatusBadge } from '@/components/StatusBadge';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

function CoverageComplianceCheck({ label, value, minValue }: { label: string; value: string; minValue: string }) {
  const parse = (s: string) => parseFloat((s || '0').replace(/[^0-9.]/g, ''));
  const actual = parse(value);
  const min = parse(minValue);
  const compliant = min <= 0 || actual >= min;

  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="font-medium text-foreground">{value || 'N/A'}</span>
        {min > 0 && (
          compliant ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-status-valid" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 text-status-expired" />
          )
        )}
      </div>
    </div>
  );
}

function FileViewButton({ filePath, label }: { filePath: string; label: string }) {
  const [loading, setLoading] = useState(false);

  const openFile = async () => {
    setLoading(true);
    const newTab = window.open('', '_blank');
    try {
      const { data } = await supabase.storage
        .from('certificates')
        .createSignedUrl(filePath, 300);
      if (data?.signedUrl && newTab) {
        newTab.location.href = data.signedUrl;
      } else {
        newTab?.close();
      }
    } catch (e) {
      console.error(e);
      newTab?.close();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={openFile} disabled={loading} className="gap-1.5 text-xs h-7 px-2">
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ExternalLink className="h-3 w-3" />}
      {label}
    </Button>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { data: project, isLoading: projLoading } = useProject(id);
  const { data: cois, isLoading: coisLoading } = useProjectCOIs(id);
  const { data: settings } = useGCSettings();
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
                  <DialogTitle className="flex items-center gap-2 flex-wrap">
                    {selectedCOI.subcontractor}
                    <StatusBadge status={selectedCOI.status} daysUntilExpiry={selectedCOI.daysUntilExpiry} />
                    <ComplianceBadge coi={selectedCOI} />
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  {/* Insurer & Carrier */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground">Insured</span>
                      <p className="font-medium text-foreground">{selectedCOI.subcontractor}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Carrier</span>
                      <p className="font-medium text-foreground">{selectedCOI.carrier}</p>
                    </div>
                  </div>

                  {/* GL Details with compliance checks */}
                  {selectedCOI.glPolicy && (
                    <div className="rounded-lg border border-border p-4">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">General Liability</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div>
                          <span className="text-xs text-muted-foreground">Policy #</span>
                          <p className="font-mono text-xs font-medium text-foreground">{selectedCOI.glPolicy.policyNumber}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Period</span>
                          <p className="text-xs font-medium text-foreground">{selectedCOI.glPolicy.effectiveDate} — {selectedCOI.glPolicy.expirationDate}</p>
                        </div>
                      </div>
                      <div className="space-y-2 rounded-md bg-muted/30 p-3">
                        <CoverageComplianceCheck
                          label="Coverage Limit"
                          value={selectedCOI.glPolicy.coverageLimit}
                          minValue={settings?.min_gl_coverage_limit || ''}
                        />
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Additional Insured</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-foreground capitalize">{selectedCOI.additional_insured || 'unknown'}</span>
                            {settings?.additional_insured_required && (
                              selectedCOI.additional_insured === 'confirmed' ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-status-valid" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5 text-status-expired" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* WC Coverage */}
                  {selectedCOI.wcPolicy ? (
                    <div className="rounded-lg border border-border p-4">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Workers' Compensation</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-xs text-muted-foreground">Policy #</span><p className="font-mono text-xs font-medium text-foreground">{selectedCOI.wcPolicy.policyNumber}</p></div>
                        <div><span className="text-xs text-muted-foreground">Carrier</span><p className="text-xs font-medium text-foreground">{selectedCOI.wcPolicy.carrier}</p></div>
                        <div><span className="text-xs text-muted-foreground">Effective</span><p className="text-xs font-medium text-foreground">{selectedCOI.wcPolicy.effectiveDate}</p></div>
                        <div>
                          <span className="text-xs text-muted-foreground">Expiration</span>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-medium text-foreground">{selectedCOI.wcPolicy.expirationDate}</p>
                            <StatusBadge status={selectedCOI.wcPolicy.status} daysUntilExpiry={selectedCOI.wcPolicy.daysUntilExpiry} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : settings?.wc_required ? (
                    <div className="rounded-lg border border-status-expired/30 bg-status-expired-bg p-4 flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-status-expired shrink-0" />
                      <p className="text-xs font-medium text-status-expired">Workers' Compensation policy required but not provided</p>
                    </div>
                  ) : null}

                  {/* Uploaded Documents */}
                  <div className="rounded-lg border border-border p-4">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Documents</h4>
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedCOI.coi_file_path && (
                        <FileViewButton filePath={selectedCOI.coi_file_path} label="View COI PDF" />
                      )}
                      {selectedCOI.gl_policy_file_path && (
                        <FileViewButton filePath={selectedCOI.gl_policy_file_path} label="View GL Policy PDF" />
                      )}
                      <PolicyUploadButton
                        coiId={selectedCOI.id}
                        projectId={project.id}
                        currentFilePath={selectedCOI.gl_policy_file_path}
                      />
                    </div>
                    {!selectedCOI.gl_policy_file_path && (
                      <p className="text-[11px] text-muted-foreground mt-2">
                        Upload the GL policy PDF to enable in-depth AI review.
                      </p>
                    )}
                  </div>

                  {/* Coverage Provisions + Policy Review (only if provisions have data or GL policy uploaded) */}
                  {selectedCOI.glPolicy && (
                    <div className="rounded-lg border border-border p-4">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Coverage Provisions & Policy Review</h4>
                      {selectedCOI.glPolicy.provisions.some(p => p.status !== 'unknown') ? (
                        <div className="space-y-2 mb-3">
                          {selectedCOI.glPolicy.provisions.map((provision) => {
                            const Icon = provision.status === 'included' ? CheckCircle2 : provision.status === 'excluded' ? XCircle : AlertTriangle;
                            const color = provision.status === 'included' ? 'text-status-valid' : provision.status === 'excluded' ? 'text-status-expired' : 'text-status-warning';
                            return (
                              <div key={provision.name} className="flex items-start gap-2.5 rounded-lg bg-muted/50 px-3 py-2.5">
                                <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", color)} />
                                <div className="flex-1 min-w-0">
                                  <span className="text-xs font-medium text-foreground">{provision.name}</span>
                                  {provision.details && (
                                    <p className="text-[11px] text-muted-foreground mt-0.5">{provision.details}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted-foreground mb-3">
                          No provision data yet. Upload a GL policy and run a review to analyze coverage provisions.
                        </p>
                      )}
                      {selectedCOI.gl_policy_file_path && (
                        <PolicyReviewDialog
                          coiId={selectedCOI.id}
                          filePath={selectedCOI.gl_policy_file_path}
                          subcontractorName={selectedCOI.subcontractor}
                        />
                      )}
                    </div>
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
