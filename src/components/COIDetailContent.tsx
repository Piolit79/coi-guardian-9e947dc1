import { ReactNode, useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Loader2, ExternalLink, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { ComplianceBadge } from '@/components/ComplianceBadge';
import { PolicyUploadButton } from '@/components/PolicyUploadButton';
import { PolicyReviewDialog } from '@/components/PolicyReviewDialog';
import { COI, getStatusFromDays } from '@/types/coi';
import { GCSettings } from '@/hooks/useGCSettings';
import { createSignedFileUrl } from '@/lib/storageFile';
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
        {min > 0 && (compliant
          ? <CheckCircle2 className="h-3.5 w-3.5 text-status-valid" />
          : <AlertTriangle className="h-3.5 w-3.5 text-status-expired" />
        )}
      </div>
    </div>
  );
}

function FileViewButton({ filePath, label }: { filePath: string; label: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    createSignedFileUrl(filePath).then(({ url }) => setUrl(url)).catch(console.error);
  }, [filePath]);
  if (!url) {
    return (
      <Button variant="ghost" size="sm" disabled className="gap-1.5 text-xs h-7 px-2">
        <Loader2 className="h-3 w-3 animate-spin" />{label}
      </Button>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7 px-2">
        <ExternalLink className="h-3 w-3" />{label}
      </Button>
    </a>
  );
}

interface COIDetailContentProps {
  coi: COI & { project_id?: string };
  projectId: string;
  settings: GCSettings | undefined;
  footer?: ReactNode;
}

export function COIDetailHeader({ coi }: { coi: COI }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {coi.subcontractor}
      <StatusBadge status={coi.status} daysUntilExpiry={coi.daysUntilExpiry} />
      <ComplianceBadge coi={coi} />
    </div>
  );
}

export function COIDetailContent({ coi, projectId, settings, footer }: COIDetailContentProps) {
  return (
    <>
      <div className="space-y-4 mt-2">
        {/* Insured & Carrier */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-xs text-muted-foreground">Insured</span>
            <p className="font-medium text-foreground">{coi.subcontractor}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Carrier</span>
            <p className="font-medium text-foreground">{coi.carrier}</p>
          </div>
        </div>

        {/* Contact Emails */}
        {(coi.contact_email_1 || coi.contact_email_2) && (
          <div className="rounded-lg border border-border p-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Contact</h4>
            <div className="space-y-2">
              {coi.contact_email_1 && (
                <a href={`mailto:${coi.contact_email_1}`} className="flex items-center gap-2 text-xs text-foreground hover:text-primary transition-colors">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  {coi.contact_email_1}
                </a>
              )}
              {coi.contact_email_2 && (
                <a href={`mailto:${coi.contact_email_2}`} className="flex items-center gap-2 text-xs text-foreground hover:text-primary transition-colors">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  {coi.contact_email_2}
                </a>
              )}
            </div>
          </div>
        )}

        {/* GL Details */}
        {coi.glPolicy && (
          <div className="rounded-lg border border-border p-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">General Liability</h4>
            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div>
                <span className="text-xs text-muted-foreground">Policy #</span>
                <p className="font-mono text-xs font-medium text-foreground">{coi.glPolicy.policyNumber}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Expiration</span>
                <p className="text-xs font-medium text-foreground">{coi.glPolicy.expirationDate}</p>
              </div>
            </div>
            <div className="space-y-2 rounded-md bg-muted/30 p-3">
              <CoverageComplianceCheck
                label="Each Occurrence"
                value={coi.glPolicy.perOccurrenceLimit || coi.glPolicy.coverageLimit}
                minValue={settings?.min_gl_coverage_limit || ''}
              />
              <CoverageComplianceCheck
                label="General Aggregate"
                value={coi.glPolicy.aggregateLimit || 'N/A'}
                minValue={settings?.min_gl_coverage_limit || ''}
              />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Additional Insured</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-foreground capitalize">{coi.additional_insured || 'unknown'}</span>
                  {settings?.additional_insured_required && (
                    coi.additional_insured === 'confirmed'
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-status-valid" />
                      : <XCircle className="h-3.5 w-3.5 text-status-expired" />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Certificate Holder</span>
                <div className="flex items-center gap-1.5">
                  {(coi.certificate_holder || '').toUpperCase().includes('SLAB') ? (
                    <>
                      <span className="font-medium text-foreground">SLAB Builders</span>
                      <CheckCircle2 className="h-3.5 w-3.5 text-status-valid" />
                    </>
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-status-expired" />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Umbrella / Excess */}
        {coi.umbrellaPolicy && (
          <div className="rounded-lg border border-border p-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Umbrella / Excess Liability</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-xs text-muted-foreground">Policy #</span><p className="font-mono text-xs font-medium text-foreground">{coi.umbrellaPolicy.policyNumber}</p></div>
              <div><span className="text-xs text-muted-foreground">Carrier</span><p className="text-xs font-medium text-foreground">{coi.umbrellaPolicy.carrier}</p></div>
              <div><span className="text-xs text-muted-foreground">Limit</span><p className="text-xs font-semibold text-foreground">{coi.umbrellaPolicy.limit}</p></div>
              <div>
                <span className="text-xs text-muted-foreground">Expiration</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs font-medium text-foreground">{coi.umbrellaPolicy.expirationDate}</p>
                  {(() => {
                    const parts = (coi.umbrellaPolicy!.expirationDate || '').split('/');
                    if (parts.length !== 3) return null;
                    const exp = new Date(+parts[2], +parts[0] - 1, +parts[1]);
                    const days = Math.floor((exp.getTime() - Date.now()) / 86400000);
                    return <StatusBadge status={getStatusFromDays(days)} daysUntilExpiry={days} />;
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WC Coverage */}
        {coi.wcPolicy ? (
          <div className="rounded-lg border border-border p-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Workers' Compensation</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-xs text-muted-foreground">Policy #</span><p className="font-mono text-xs font-medium text-foreground">{coi.wcPolicy.policyNumber}</p></div>
              <div><span className="text-xs text-muted-foreground">Carrier</span><p className="text-xs font-medium text-foreground">{coi.wcPolicy.carrier}</p></div>
              <div><span className="text-xs text-muted-foreground">Effective</span><p className="text-xs font-medium text-foreground">{coi.wcPolicy.effectiveDate}</p></div>
              <div>
                <span className="text-xs text-muted-foreground">Expiration</span>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-foreground">{coi.wcPolicy.expirationDate}</p>
                  <StatusBadge status={coi.wcPolicy.status} daysUntilExpiry={coi.wcPolicy.daysUntilExpiry} />
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

        {/* Documents */}
        <div className="rounded-lg border border-border p-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Documents</h4>
          <div className="flex flex-wrap items-center gap-2">
            {coi.coi_file_path && <FileViewButton filePath={coi.coi_file_path} label="View COI PDF" />}
            {coi.gl_policy_file_path && <FileViewButton filePath={coi.gl_policy_file_path} label="View GL Policy PDF" />}
            <PolicyUploadButton coiId={coi.id} projectId={projectId} currentFilePath={coi.gl_policy_file_path} />
          </div>
          {!coi.gl_policy_file_path && (
            <p className="text-[11px] text-muted-foreground mt-2">Upload the GL policy PDF to enable in-depth AI review.</p>
          )}
        </div>

        {/* Coverage Provisions & Policy Review */}
        {coi.gl_policy_file_path && coi.glPolicy && coi.glPolicy.provisions.some(p => p.status !== 'unknown') && (
          <div className="rounded-lg border border-border p-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Coverage Provisions & Policy Review</h4>
            <div className="space-y-2 mb-3">
              {coi.glPolicy.provisions.map((provision) => {
                const Icon = provision.status === 'included' ? CheckCircle2 : provision.status === 'excluded' ? XCircle : AlertTriangle;
                const color = provision.status === 'included' ? 'text-status-valid' : provision.status === 'excluded' ? 'text-status-expired' : 'text-status-warning';
                return (
                  <div key={provision.name} className="flex items-start gap-2.5 rounded-lg bg-muted/50 px-3 py-2.5">
                    <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', color)} />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-foreground">{provision.name}</span>
                      {provision.details && <p className="text-[11px] text-muted-foreground mt-0.5">{provision.details}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
            <PolicyReviewDialog coiId={coi.id} filePath={coi.gl_policy_file_path} subcontractorName={coi.subcontractor} />
          </div>
        )}
      </div>

      {footer}
    </>
  );
}
