export type COIStatus = 'valid' | 'expiring' | 'expired';

export interface CoverageProvision {
  name: string;
  status: 'included' | 'excluded' | 'unknown';
  details?: string;
}

export interface GLPolicy {
  policyNumber: string;
  carrier: string;
  effectiveDate: string;
  expirationDate: string;
  coverageLimit: string;
  provisions: CoverageProvision[];
  fileUrl?: string;
}

export interface COI {
  id: string;
  subcontractor: string;
  company: string;
  policyNumber: string;
  carrier: string;
  effectiveDate: string;
  expirationDate: string;
  status: COIStatus;
  daysUntilExpiry: number;
  glPolicy?: GLPolicy;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  address: string;
  status: 'active' | 'completed' | 'on-hold';
  coiCount: number;
  expiringCount: number;
  expiredCount: number;
  cois: COI[];
  createdAt: string;
}

export function getStatusFromDays(days: number): COIStatus {
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring';
  return 'valid';
}
