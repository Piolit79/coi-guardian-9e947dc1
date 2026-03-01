import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DBProject {
  id: string;
  name: string;
  client: string;
  address: string;
  status: string;
  created_at: string;
}

export interface DBProjectWithCounts extends DBProject {
  coiCount: number;
  expiringCount: number;
  expiredCount: number;
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: async (): Promise<DBProjectWithCounts[]> => {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch COI counts per project
      const { data: cois, error: coiErr } = await supabase
        .from('subcontractor_cois')
        .select('id, project_id, gl_expiration_date, wc_expiration_date');

      if (coiErr) throw coiErr;

      const today = new Date();
      const thirtyDays = new Date(today);
      thirtyDays.setDate(thirtyDays.getDate() + 30);

      return (projects || []).map((p) => {
        const projectCois = (cois || []).filter(c => c.project_id === p.id);
        let expiringCount = 0;
        let expiredCount = 0;

        projectCois.forEach(c => {
          const glExp = c.gl_expiration_date ? new Date(c.gl_expiration_date) : null;
          if (glExp) {
            if (glExp < today) expiredCount++;
            else if (glExp <= thirtyDays) expiringCount++;
          }
        });

        return {
          ...p,
          coiCount: projectCois.length,
          expiringCount,
          expiredCount,
        };
      });
    },
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ['projects', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as DBProject;
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (project: { name: string; client: string; address: string; status: string }) => {
      const { data, error } = await supabase
        .from('projects')
        .insert(project)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}
