import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download, Loader2, FolderOpen } from 'lucide-react';
import { format } from 'date-fns';

interface StorageFile {
  name: string;
  id: string;
  created_at: string;
  metadata: {
    size?: number;
    mimetype?: string;
  };
}

function formatBytes(bytes: number | undefined) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getDisplayName(path: string) {
  // Strip timestamp prefix like "1772388567379_"
  const fileName = path.split('/').pop() || path;
  return fileName.replace(/^\d+_/, '');
}

function getFolder(path: string) {
  const parts = path.split('/');
  if (parts.length <= 1) return 'Root';
  // e.g. "uploads/coi/projectid/file" → "COI Certificates"
  // "uploads/gl-policies/..." → "GL Policies"
  // "agreements/..." → "Agreements"
  // "projectid/..." → "Certificates"
  if (parts[0] === 'uploads' && parts[1] === 'coi') return 'COI Certificates';
  if (parts[0] === 'uploads' && parts[1] === 'gl-policies') return 'GL Policies';
  if (parts[0] === 'agreements') return 'Agreements';
  if (parts[0] === 'policies') return 'GL Policies';
  return 'COI Certificates';
}

export default function Files() {
  const { data: files, isLoading } = useQuery({
    queryKey: ['storage-files'],
    queryFn: async (): Promise<StorageFile[]> => {
      // Get all file paths from COI records + settings
      const { data: cois } = await supabase
        .from('subcontractor_cois')
        .select('coi_file_path, gl_policy_file_path, subcontractor, created_at');

      const { data: settings } = await supabase
        .from('gc_settings')
        .select('agreement_file_path')
        .limit(1)
        .maybeSingle();

      const allFiles: StorageFile[] = [];
      const seen = new Set<string>();

      const addFile = (path: string | null, label?: string, createdAt?: string) => {
        if (!path || seen.has(path)) return;
        seen.add(path);
        allFiles.push({
          name: path,
          id: path,
          created_at: createdAt || '',
          metadata: {},
        });
      };

      // COI certificates and GL policies from DB
      (cois || []).forEach(c => {
        addFile(c.coi_file_path, c.subcontractor, c.created_at);
        addFile(c.gl_policy_file_path, c.subcontractor, c.created_at);
      });

      // Agreement file
      if (settings?.agreement_file_path) {
        addFile(settings.agreement_file_path);
      }

      return allFiles;
    },
  });

  const handleDownload = async (filePath: string) => {
    try {
      const { data } = await supabase.storage
        .from('certificates')
        .createSignedUrl(filePath, 300);
      const signed = (data as any)?.signedUrl || (data as any)?.signedURL;
      if (signed) {
        const url = signed.startsWith('http')
          ? signed
          : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1${signed.startsWith('/') ? signed : `/${signed}`}`;
        window.location.href = url;
      }
    } catch (e) {
      console.error('Download failed', e);
    }
  };

  // Group files by folder
  const grouped = (files || []).reduce<Record<string, StorageFile[]>>((acc, f) => {
    const folder = getFolder(f.name);
    (acc[folder] = acc[folder] || []).push(f);
    return acc;
  }, {});

  const folderOrder = ['COI Certificates', 'GL Policies', 'Agreements'];

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Files</h1>
          <p className="text-sm text-muted-foreground mt-1">All uploaded certificates, policies, and agreements</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (files || []).length === 0 ? (
          <Card className="flex flex-col items-center justify-center border border-dashed border-border p-12 text-center">
            <FolderOpen className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground">No files yet</p>
            <p className="text-xs text-muted-foreground mt-1">Upload COI certificates from a project page to see them here.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {folderOrder.map(folder => {
              const folderFiles = grouped[folder];
              if (!folderFiles || folderFiles.length === 0) return null;
              return (
                <div key={folder}>
                  <div className="flex items-center gap-2 mb-3">
                    <FolderOpen className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-semibold text-foreground">{folder}</h2>
                    <span className="text-xs text-muted-foreground">({folderFiles.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {folderFiles.map((file) => (
                      <Card
                        key={file.name}
                        className="flex items-center gap-3 border border-border px-4 py-3 cursor-pointer hover:shadow-sm transition-shadow"
                        onClick={() => handleDownload(file.name)}
                      >
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {getDisplayName(file.name)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatBytes(file.metadata?.size)}
                            {file.created_at && ` · ${format(new Date(file.created_at), 'MMM d, yyyy h:mm a')}`}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" className="shrink-0 gap-1.5 text-xs h-7 px-2">
                          <Download className="h-3 w-3" />
                          Open
                        </Button>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
