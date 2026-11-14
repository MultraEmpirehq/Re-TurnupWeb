import { getData, patchData, putData } from "@/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type TAdminDepartment = "SUPPORT" | "SALES" | "TRUST_SAFETY" | "FINANCE" | "MARKETING";
export type TAdminAlertMode = "DEPARTMENT" | "ESCALATIONS" | "EVERYTHING";

export const ALERT_MODES: { value: TAdminAlertMode; label: string; description: string }[] = [
  {
    value: "DEPARTMENT",
    label: "Their departments",
    description: "Alerts for the departments they're in.",
  },
  {
    value: "ESCALATIONS",
    label: "Plus anything left waiting",
    description: "Also told when nobody, not even the head, has picked something up.",
  },
  {
    value: "EVERYTHING",
    label: "Everything",
    description: "Every alert they have permission for, in any department.",
  },
];

export interface IDepartmentMember {
  id: string;
  name: string;
  email: string;
  isHead: boolean;
  isSuspended: boolean;
}

export interface IDepartment {
  department: TAdminDepartment;
  label: string;
  head: { id: string; name: string; email: string } | null;
  members: IDepartmentMember[];
}

export interface IDepartmentAdmin {
  id: string;
  name: string;
  email: string;
  isSuspended: boolean;
  alertMode: TAdminAlertMode;
  departments: TAdminDepartment[];
  headOf: TAdminDepartment[];
}

const KEY = ["admin-departments"];

/** Departments with their heads and members, and every admin's settings. */
export const useAdminDepartments = () =>
  useQuery({
    queryKey: KEY,
    queryFn: async () =>
      (await getData<{ departments: IDepartment[]; admins: IDepartmentAdmin[] }>("/admin/departments"))
        .data?.data ?? { departments: [], admins: [] },
  });

const useRefresh = () => {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: KEY });
    void queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
  };
};

/** Which departments an admin is in, and which they head. */
export const useSetAdminDepartments = () => {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; departments: TAdminDepartment[]; headOf: TAdminDepartment[] }) =>
      putData(`/admin/departments/admins/${id}`, body),
    onSuccess: refresh,
  });
};

/** How an admin hears about work. */
export const useSetAdminAlertMode = () => {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ id, mode }: { id: string; mode: TAdminAlertMode }) =>
      patchData(`/admin/departments/admins/${id}/alert-mode`, { mode }),
    onSuccess: refresh,
  });
};
