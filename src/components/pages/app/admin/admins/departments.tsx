"use client";

import { constructErrorMessage } from "@/api/functions";
import { Checkbox } from "@/components/ui/checkbox";
import ErrorContainer from "@/components/ui/error-container";
import Notice from "@/components/ui/notice";
import PageHeader from "@/components/ui/page-header";
import SelectField from "@/components/ui/select-field";
import StatusBadge from "@/components/ui/status-badge";
import {
  ALERT_MODES,
  IDepartment,
  IDepartmentAdmin,
  TAdminAlertMode,
  TAdminDepartment,
  useAdminDepartments,
  useSetAdminAlertMode,
  useSetAdminDepartments,
} from "@/hooks/use-admin-departments";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Crown } from "lucide-react";
import React, { memo } from "react";
import { ListSkeleton } from "../moderation/moderation-ui";

const errorText = (error: unknown) =>
  constructErrorMessage(error as TApiErrorResponseType, "Couldn't save that.");

/** One department: who heads it and who is in it. */
const DepartmentCard = ({ department }: { department: IDepartment }) => (
  <li className="space-y-2 rounded-2xl border border-border bg-card p-4">
    <p className="font-semibold text-foreground">{department.label}</p>
    <p className="text-sm text-muted-foreground">
      {department.head ? (
        <>
          <Crown className="mr-1 inline size-3.5 text-warning" aria-hidden />
          Head: {department.head.name}
        </>
      ) : (
        "No head yet"
      )}
    </p>
    <p className="text-xs text-muted-foreground">
      {department.members.length
        ? `${department.members.length} ${department.members.length === 1 ? "member" : "members"}`
        : "Nobody yet: alerts go to everyone with the permission"}
    </p>
  </li>
);

/** One admin: their departments, which they head, and how they hear about work. */
const AdminRow = ({ admin, departments }: { admin: IDepartmentAdmin; departments: IDepartment[] }) => {
  const setDepartments = useSetAdminDepartments();
  const setAlertMode = useSetAdminAlertMode();
  const busy = setDepartments.isPending || setAlertMode.isPending;

  const save = (next: { departments: TAdminDepartment[]; headOf: TAdminDepartment[] }, done: string) =>
    setDepartments.mutate(
      { id: admin.id, ...next },
      { onSuccess: () => toast.success(done), onError: (error) => toast.error(errorText(error)) },
    );

  const toggleMember = (department: IDepartment, on: boolean) =>
    save(
      on
        ? { departments: [...admin.departments, department.department], headOf: admin.headOf }
        : {
            departments: admin.departments.filter((d) => d !== department.department),
            headOf: admin.headOf.filter((d) => d !== department.department),
          },
      on ? `${admin.name} joined ${department.label}` : `${admin.name} left ${department.label}`,
    );

  const toggleHead = (department: IDepartment) => {
    const isHead = admin.headOf.includes(department.department);
    save(
      {
        departments: admin.departments,
        headOf: isHead
          ? admin.headOf.filter((d) => d !== department.department)
          : [...admin.headOf, department.department],
      },
      isHead
        ? `${admin.name} is no longer head of ${department.label}`
        : `${admin.name} is now head of ${department.label}`,
    );
  };

  return (
    <li className={cn("space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5", busy && "opacity-70")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{admin.name}</p>
          <p className="truncate text-sm text-muted-foreground">{admin.email}</p>
        </div>
        {admin.isSuspended && <StatusBadge tone="danger">Suspended</StatusBadge>}
      </div>

      <div className="flex flex-wrap gap-2">
        {departments.map((department) => {
          const isMember = admin.departments.includes(department.department);
          const isHead = admin.headOf.includes(department.department);
          const otherHead = department.head && department.head.id !== admin.id ? department.head : null;
          return (
            <div
              key={department.department}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm",
                isMember ? "border-primary/40 bg-primary/5" : "border-border",
              )}
            >
              <label className="flex cursor-pointer items-center gap-2">
                <Checkbox
                  checked={isMember}
                  disabled={busy}
                  onCheckedChange={(checked) => toggleMember(department, checked === true)}
                />
                {department.label}
              </label>
              {isMember && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => toggleHead(department)}
                  title={
                    isHead
                      ? `Stop being head of ${department.label}`
                      : otherHead
                        ? `Make head instead of ${otherHead.name}`
                        : `Make head of ${department.label}`
                  }
                  className={cn(
                    "flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium transition-colors",
                    isHead
                      ? "bg-warning-soft text-warning"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Crown className="size-3.5" aria-hidden />
                  {isHead ? "Head" : "Make head"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <SelectField
        label="Hears about"
        value={admin.alertMode}
        setValue={(mode) =>
          setAlertMode.mutate(
            { id: admin.id, mode: mode as TAdminAlertMode },
            {
              onSuccess: () => toast.success("Saved"),
              onError: (error) => toast.error(errorText(error)),
            },
          )
        }
        options={ALERT_MODES.map(({ value, label }) => ({ value, label }))}
        helperText={ALERT_MODES.find((mode) => mode.value === admin.alertMode)?.description}
        className="sm:max-w-sm"
      />
    </li>
  );
};

/**
 * The admin team's departments. Work goes to the department first; if nobody
 * picks it up in time, it goes to the head, then to the admins who hear about
 * anything left waiting. Permissions still decide what each admin can open.
 */
const DepartmentsPage = () => {
  const { data, error, isLoading, refetch } = useAdminDepartments();
  const departments = data?.departments ?? [];
  const admins = data?.admins ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description="Who works where, who heads each department, and who hears about work nobody picked up."
      />

      <Notice tone="info" title="How work moves up">
        A live chat or contact message goes to its department first. If nobody
        presses &quot;I&apos;m on it&quot; or replies in time (30 minutes for a chat
        in staffed hours, one working day for a message), the head is told. If
        it&apos;s still waiting, admins set to &quot;Plus anything left
        waiting&quot; or &quot;Everything&quot; are told.
      </Notice>

      {isLoading && <ListSkeleton />}
      {!!error && !isLoading && (
        <ErrorContainer
          error={constructErrorMessage(error as TApiErrorResponseType, "Could not load departments")}
          retryFunction={() => void refetch()}
        />
      )}

      {!isLoading && !error && (
        <>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {departments.map((department) => (
              <DepartmentCard key={department.department} department={department} />
            ))}
          </ul>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Admins</h2>
            <ul className="space-y-3">
              {admins.map((admin) => (
                <AdminRow key={admin.id} admin={admin} departments={departments} />
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
};

export default memo(DepartmentsPage);
