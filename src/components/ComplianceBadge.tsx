import { useGCSettings } from '@/hooks/useGCSettings';
import { COI } from '@/types/coi';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ComplianceBadgeProps {
  coi: COI & { additional_insured?: string };
  className?: string;
}

export function ComplianceBadge({ coi, className }: ComplianceBadgeProps) {
  const { data: settings } = useGCSettings();
  if (!settings) return null;

  const issues: string[] = [];

  // Check GL coverage limit
  if (settings.min_gl_coverage_limit) {
    const minLimit = parseFloat(settings.min_gl_coverage_limit.replace(/[^0-9.]/g, ''));
    const coiLimit = coi.glPolicy?.coverageLimit
      ? parseFloat(coi.glPolicy.coverageLimit.replace(/[^0-9.]/g, ''))
      : 0;
    if (minLimit > 0 && coiLimit < minLimit) {
      issues.push(`GL coverage below minimum ($${coiLimit.toLocaleString()} < $${minLimit.toLocaleString()})`);
    }
  }

  // Check WC required
  if (settings.wc_required && !coi.wcPolicy) {
    issues.push('Missing Workers\' Compensation policy');
  }

  // Check additional insured
  if (settings.additional_insured_required && coi.additional_insured !== 'confirmed') {
    issues.push('Additional Insured not confirmed');
  }

  // Check certificate holder
  if (coi.certificate_holder && !coi.certificate_holder.includes('✓') && coi.certificate_holder !== 'unknown') {
    issues.push('Certificate Holder mismatch');
  }

  if (issues.length === 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("inline-flex items-center gap-1 rounded-full bg-status-valid-bg px-2 py-0.5 text-[10px] font-semibold text-status-valid", className)}>
            <CheckCircle2 className="h-3 w-3" />
            Compliant
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Meets all minimum coverage requirements</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("inline-flex items-center gap-1 rounded-full bg-status-warning-bg px-2 py-0.5 text-[10px] font-semibold text-status-warning", className)}>
          <AlertTriangle className="h-3 w-3" />
          {issues.length} Issue{issues.length > 1 ? 's' : ''}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <ul className="text-xs space-y-1">
          {issues.map((issue, i) => (
            <li key={i}>• {issue}</li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}
