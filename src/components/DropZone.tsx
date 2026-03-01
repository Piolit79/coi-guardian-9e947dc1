import { useCallback, useState } from 'react';
import { Upload, FileText, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface DropZoneProps {
  projectId: string;
  className?: string;
}

export function DropZone({ projectId, className }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const queryClient = useQueryClient();

  const processFile = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_id', projectId);

    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-coi`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: formData,
      }
    );

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || `Upload failed (${resp.status})`);
    }

    return resp.json();
  }, [projectId]);

  const handleFiles = useCallback(async (files: File[]) => {
    setIsUploading(true);
    setUploadedCount(0);
    let successCount = 0;

    for (const file of files) {
      try {
        await processFile(file);
        successCount++;
        setUploadedCount(successCount);
        toast.success(`Extracted data from ${file.name}`);
      } catch (e) {
        toast.error(`Failed: ${file.name}`, {
          description: e instanceof Error ? e.message : 'Unknown error',
        });
      }
    }

    queryClient.invalidateQueries({ queryKey: ['cois', projectId] });
    queryClient.invalidateQueries({ queryKey: ['cois', 'all'] });
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    setIsUploading(false);
    if (successCount > 0) {
      setTimeout(() => setUploadedCount(0), 2000);
    }
  }, [processFile, projectId, queryClient]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleFiles(files);
  }, [handleFiles]);

  const handleClick = useCallback(() => {
    if (isUploading) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png';
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length > 0) handleFiles(files);
    };
    input.click();
  }, [handleFiles, isUploading]);

  return (
    <div
      onClick={handleClick}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all duration-200 cursor-pointer",
        isUploading
          ? "border-primary/50 bg-primary/5"
          : isDragOver
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/50",
        className
      )}
    >
      <div className={cn(
        "mb-3 flex h-12 w-12 items-center justify-center rounded-full transition-colors",
        isUploading ? "bg-primary/10" : isDragOver ? "bg-primary/10" : "bg-muted"
      )}>
        {isUploading ? (
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        ) : uploadedCount > 0 ? (
          <CheckCircle className="h-6 w-6 text-primary" />
        ) : isDragOver ? (
          <FileText className="h-6 w-6 text-primary" />
        ) : (
          <Upload className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
      <p className="text-sm font-medium text-foreground">
        {isUploading
          ? 'Extracting COI data with AI...'
          : uploadedCount > 0
            ? `${uploadedCount} COI(s) added successfully!`
            : isDragOver
              ? 'Drop COI files here'
              : 'Drag & drop COI certificates'}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {isUploading
          ? 'This may take a moment'
          : 'PDF, JPG, or PNG — we\'ll extract the details automatically'}
      </p>
    </div>
  );
}
