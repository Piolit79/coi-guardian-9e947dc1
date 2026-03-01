import { useCallback, useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropZoneProps {
  onFilesDropped?: (files: File[]) => void;
  className?: string;
}

export function DropZone({ onFilesDropped, className }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

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
    if (files.length > 0) {
      onFilesDropped?.(files);
    }
  }, [onFilesDropped]);

  return (
    <div
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all duration-200 cursor-pointer",
        isDragOver
          ? "border-primary bg-primary/5 scale-[1.01]"
          : "border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/50",
        className
      )}
    >
      <div className={cn(
        "mb-3 flex h-12 w-12 items-center justify-center rounded-full transition-colors",
        isDragOver ? "bg-primary/10" : "bg-muted"
      )}>
        {isDragOver ? (
          <FileText className="h-6 w-6 text-primary" />
        ) : (
          <Upload className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
      <p className="text-sm font-medium text-foreground">
        {isDragOver ? 'Drop COI files here' : 'Drag & drop COI certificates'}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        PDF, JPG, or PNG — we'll extract the details automatically
      </p>
    </div>
  );
}
