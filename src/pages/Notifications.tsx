import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { Bell, CheckCircle2 } from 'lucide-react';
import { mockCOIs } from '@/data/mockData';
import { StatusBadge } from '@/components/StatusBadge';

export default function Notifications() {
  const alerts = mockCOIs
    .filter(c => c.status === 'expiring' || c.status === 'expired')
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">COI expiration alerts and reminders</p>
        </div>

        {alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map((coi) => (
              <Card key={coi.id} className="flex items-start gap-3 border border-border p-4">
                <Bell className="h-4 w-4 text-status-warning mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-foreground">{coi.company}</p>
                    <StatusBadge status={coi.status} daysUntilExpiry={coi.daysUntilExpiry} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {coi.status === 'expired'
                      ? `Policy ${coi.policyNumber} expired on ${coi.expirationDate}. Request updated certificate immediately.`
                      : `Policy ${coi.policyNumber} expires on ${coi.expirationDate}. Send renewal reminder to ${coi.subcontractor}.`}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="flex flex-col items-center justify-center border border-border p-12 text-center">
            <CheckCircle2 className="h-10 w-10 text-status-valid mb-3" />
            <p className="text-sm font-medium text-foreground">All clear!</p>
            <p className="text-xs text-muted-foreground mt-1">No expiring or expired certificates.</p>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
