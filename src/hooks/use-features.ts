import { getData, putData } from "@/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Features admins can switch on and off across Turnupz. */
export type TFeatures = {
  /** Organisers' Promote: share tools, promoter codes and boosts. */
  promotion: boolean;
};

export type TAdminFeature = {
  feature: keyof TFeatures;
  label: string;
  enabled: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
};

/** Used until the list loads, and if it can't: everything on, as the server defaults. */
const DEFAULT_FEATURES: TFeatures = { promotion: true };

export const useFeatures = () => {
  const query = useQuery({
    queryKey: ["features"],
    queryFn: async () => (await getData<TFeatures>("/features")).data?.data ?? null,
    staleTime: 60 * 1000,
  });
  return { ...DEFAULT_FEATURES, ...(query.data ?? {}) };
};

export const useAdminFeatures = () =>
  useQuery({
    queryKey: ["admin-features"],
    queryFn: async () =>
      (await getData<TAdminFeature[]>("/admin/features")).data?.data ?? [],
  });

export const useSetFeature = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ feature, enabled }: { feature: keyof TFeatures; enabled: boolean }) =>
      (
        await putData<{ enabled: boolean }, TAdminFeature[]>(
          `/admin/features/${feature}`,
          { enabled },
        )
      ).data?.data ?? [],
    onSuccess: (features) => {
      client.setQueryData(["admin-features"], features);
      client.invalidateQueries({ queryKey: ["features"] });
    },
  });
};
