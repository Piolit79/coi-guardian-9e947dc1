import { COI } from '@/types/coi';
import { StatusBadge } from './StatusBadge';
import { Card } from '@/components/ui/card';
import { Building2, Calendar, FileText, ChevronRight } from 'lucide-react';

interface COICardProps {
  coi: COI;
  onClick?: (coi: COI) => void;
}

export function COICard({ coi, onClick }: COICardProps) {
  return (
    <Card
      className="group cursor-pointer border border-border p-4 transition-all hover:shadow-md hover:border-primary/20"
      onClick={() => onClick?.(coi)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-foreground truncate">{coi.company}</h4>
            <StatusBadge status={coi.status} daysUntilExpiry={coi.daysUntilExpiry} />
          </div>
          <p className="text-xs text-muted-foreground">{coi.subcontractor}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
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
          Exp: {coi.expirationDate}
        </span>
      </div>
    </Card>
  );
}
