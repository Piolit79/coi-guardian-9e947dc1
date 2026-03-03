export const DEFAULT_REMINDER_SUBJECT = 'COI Reminder – {subcontractor} – {project}';

export const DEFAULT_REMINDER_BODY = `Dear {subcontractor},

Your {policies} is expired. Please email an updated certificate for this project at your earliest convenience.

Thank you,
SLAB Builders`;

export function applyReminderTemplate(
  template: string,
  vars: { subcontractor: string; project: string; policies: string },
): string {
  return template
    .replaceAll('{subcontractor}', vars.subcontractor)
    .replaceAll('{project}', vars.project)
    .replaceAll('{policies}', vars.policies);
}
