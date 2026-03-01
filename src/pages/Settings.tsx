import { AppLayout } from '@/components/AppLayout';
import { useGCSettings, useUpdateGCSettings } from '@/hooks/useGCSettings';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2, CheckCircle } from 'lucide-react';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function Settings() {
  const { data: settings, isLoading } = useGCSettings();
  const updateSettings = useUpdateGCSettings();
  const [uploading, setUploading] = useState(false);

  const handleAgreementUpload = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const filePath = `agreements/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('certificates')
          .upload(filePath, file, { contentType: file.type });
        if (uploadError) throw uploadError;
        await updateSettings.mutateAsync({ agreement_file_path: filePath });
        toast.success('Subcontractor agreement uploaded');
      } catch (err) {
        toast.error('Failed to upload agreement');
        console.error(err);
      } finally {
        setUploading(false);
      }
    };
    input.click();
  }, [updateSettings]);

  const handleLimitChange = useCallback((value: string) => {
    updateSettings.mutate({ min_gl_coverage_limit: value });
  }, [updateSettings]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your minimum coverage requirements
          </p>
        </div>

        {/* Subcontractor Agreement Upload */}
        <Card className="border border-border p-6 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Master Subcontractor Agreement
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Upload your standard subcontractor agreement. COI uploads will be checked against the minimum requirements defined below.
          </p>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleAgreementUpload}
              disabled={uploading}
              className="gap-2"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : settings?.agreement_file_path ? (
                <CheckCircle className="h-4 w-4 text-status-valid" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {settings?.agreement_file_path ? 'Replace Agreement' : 'Upload Agreement'}
            </Button>
            {settings?.agreement_file_path && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                Agreement on file
              </span>
            )}
          </div>
        </Card>

        {/* Minimum Requirements */}
        <Card className="border border-border p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Minimum Coverage Requirements
          </h2>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="gl-limit" className="text-xs">
                Minimum GL Coverage Limit ($)
              </Label>
              <Input
                id="gl-limit"
                type="text"
                placeholder="e.g. 1000000"
                defaultValue={settings?.min_gl_coverage_limit || ''}
                onBlur={(e) => handleLimitChange(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Enter as a number (e.g. 1000000 for $1,000,000)
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">Workers' Compensation Required</Label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Flag COIs that are missing WC coverage
                </p>
              </div>
              <Switch
                checked={settings?.wc_required ?? true}
                onCheckedChange={(checked) =>
                  updateSettings.mutate({ wc_required: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">Additional Insured Required</Label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  GC must be listed as additional insured
                </p>
              </div>
              <Switch
                checked={settings?.additional_insured_required ?? true}
                onCheckedChange={(checked) =>
                  updateSettings.mutate({ additional_insured_required: checked })
                }
              />
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
