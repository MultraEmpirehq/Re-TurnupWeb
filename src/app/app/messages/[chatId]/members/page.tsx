"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  useBlockEventChatMember,
  useEventChatMembers,
  useEventChats,
  useReportEventChatMember,
  useUpdateEventChatSettings,
} from "@/hooks/use-event-chat";
import {
  IEventChatParticipant,
  blockEventChatMember,
  getEventChatGroupById,
  reportEventChatMember,
  subscribeToEventChatGroups,
  updateEventChatGroupSettings,
} from "@/lib/event-chat";
import {
  ArrowLeftIcon,
  BanIcon,
  EyeIcon,
  EyeOffIcon,
  FlagIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { memo } from "react";

const getInitials = (value?: string) => {
  const initials = (value || "Turnupz User")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
  return initials || "TU";
};

const MemberAvatar = ({ member }: { member: IEventChatParticipant }) => (
  <Avatar className="size-11 border border-secondary-100 bg-secondary-800">
    {member.avatar ? <AvatarImage src={member.avatar} alt={member.name} /> : null}
    <AvatarFallback className="bg-secondary-800 text-sm font-semibold text-white">
      {getInitials(member.name)}
    </AvatarFallback>
  </Avatar>
);

const getMemberRoleLabel = (member: IEventChatParticipant) => {
  if (member.role === "vendor" || member.memberRole === "vendor") return "Vendor";
  if (member.memberRole === "scanner") return "Scanner";
  return "Attendee";
};

const GroupMembersPage = () => {
  const params = useParams<{ chatId: string }>();
  const router = useRouter();
  const chatId = Array.isArray(params.chatId) ? params.chatId[0] : params.chatId;
  const [group, setGroup] = React.useState(() => getEventChatGroupById(chatId));
  const eventChatsQuery = useEventChats();
  const backendGroup = React.useMemo(
    () => eventChatsQuery.data?.find((chat) => chat.id === chatId),
    [chatId, eventChatsQuery.data],
  );
  const activeGroup = backendGroup || group;
  const membersQuery = useEventChatMembers(activeGroup?.eventId, !!backendGroup);
  const updateSettingsMutation = useUpdateEventChatSettings();
  const reportMemberMutation = useReportEventChatMember();
  const blockMemberMutation = useBlockEventChatMember();

  React.useEffect(() => {
    const sync = () => setGroup(getEventChatGroupById(chatId));
    sync();
    return subscribeToEventChatGroups(sync);
  }, [chatId]);
  const backendMembers = membersQuery.data ?? [];
  const managerMember = backendMembers.find(
    (member) => member.memberRole === "vendor" || member.role === "vendor",
  );
  const attendeeMembers = backendGroup
    ? backendMembers.filter((member) => member.id !== managerMember?.id)
    : group?.members ?? [];
  const vendorMember = backendGroup ? managerMember || activeGroup?.vendor : group?.vendor;
  const memberListIsPrivate = activeGroup?.memberListVisibility === "private";
  const isLoadingMembers =
    eventChatsQuery.isLoading || (!!backendGroup && membersQuery.isLoading);
  const memberLoadFailed =
    eventChatsQuery.isError || (!!backendGroup && membersQuery.isError);

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/app/messages");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-secondary-100 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,35,95,0.14)] sm:p-6">
        <div className="max-w-4xl">
          <Button
            type="button"
            variant="outline"
            className="mb-5 h-10 rounded-full border-secondary-100 bg-secondary-50 px-4 text-sm font-semibold text-secondary-700 hover:bg-white hover:text-primary"
            onClick={handleBack}
          >
            <ArrowLeftIcon className="mr-2 size-4" />
            Back to chats
          </Button>
          <div className="space-y-3">
            <span className="block text-[0.75rem] font-bold uppercase tracking-[0.22em] text-secondary-400">
              Group Members
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-secondary-950 md:text-[2.35rem]">
              {activeGroup ? `${activeGroup.eventName} Community` : "Event Community"}
            </h1>
          </div>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.25rem] bg-secondary-50 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-400">
              Attendees
            </p>
            <p className="mt-2 text-2xl font-bold text-secondary-950">
              {attendeeMembers.length}
            </p>
          </div>
          <div className="rounded-[1.25rem] bg-secondary-50 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-400">
              Managers
            </p>
            <p className="mt-2 text-2xl font-bold text-secondary-950">
              {vendorMember ? 1 : 0}
            </p>
          </div>
          <div className="rounded-[1.25rem] bg-secondary-50 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-400">
              Member List
            </p>
            <Button
              type="button"
              variant="ghost"
              className="mt-1 h-auto rounded-full px-0 py-1 text-sm font-semibold capitalize text-primary hover:bg-transparent"
              onClick={() =>
                activeGroup &&
                (backendGroup
                  ? updateSettingsMutation.mutate({
                      groupId: activeGroup.id,
                      settings: {
                        memberListVisibility: memberListIsPrivate
                          ? "visible"
                          : "private",
                      },
                    })
                  : updateEventChatGroupSettings(activeGroup.id, {
                      memberListVisibility: memberListIsPrivate
                        ? "visible"
                        : "private",
                    }))
              }
              disabled={!activeGroup || updateSettingsMutation.isPending}
            >
              {memberListIsPrivate ? (
                <EyeOffIcon className="mr-2 size-4" />
              ) : (
                <EyeIcon className="mr-2 size-4" />
              )}
              {memberListIsPrivate ? "Private" : "Visible"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <section className="rounded-[1.75rem] border border-secondary-100 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,35,95,0.14)]">
          <div className="border-b border-secondary-100 pb-4">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-secondary-400">
              Official Manager
            </p>
            <p className="mt-2 text-sm text-secondary-500">
              The event owner manages official updates and group settings.
            </p>
          </div>

          {vendorMember ? (
            <div className="mt-5 flex items-center gap-4">
              <MemberAvatar member={vendorMember} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-secondary-950">
                  {vendorMember.name}
                </p>
                <p className="truncate text-xs text-secondary-500">
                  {vendorMember.email || "No email shown"}
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                <ShieldCheckIcon className="mr-1.5 size-3" />
                Vendor
              </span>
            </div>
          ) : (
            <div className="mt-5 rounded-[1.25rem] bg-secondary-50 px-4 py-5 text-sm text-secondary-500">
              This group could not be found on this device yet.
            </div>
          )}
        </section>

        <section className="rounded-[1.75rem] border border-secondary-100 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,35,95,0.14)]">
          <div className="flex items-end justify-between gap-4 border-b border-secondary-100 pb-4">
            <div>
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-secondary-400">
                Members
              </p>
              <p className="mt-2 text-sm text-secondary-500">
                Attendees appear here after they join through ticketing or registration.
              </p>
            </div>
            <span className="rounded-full bg-secondary-50 px-3 py-1 text-xs font-semibold text-secondary-500">
              {attendeeMembers.length}
            </span>
          </div>

          <div className="mt-4 divide-y divide-secondary-100">
            {isLoadingMembers ? (
              <div className="rounded-[1.25rem] bg-secondary-50 px-4 py-8 text-center text-sm text-secondary-500">
                Loading group members...
              </div>
            ) : null}

            {memberLoadFailed && !activeGroup ? (
              <div className="rounded-[1.25rem] bg-danger/10 px-4 py-8 text-center text-sm font-medium text-danger">
                We could not load this group yet. Go back to chats and try again.
              </div>
            ) : null}

            {attendeeMembers.map((member) => (
              <div
                key={`${member.role}-${member.id}`}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <MemberAvatar member={member} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-secondary-950">
                      {member.name}
                    </p>
                    <p className="truncate text-xs text-secondary-500">
                      {member.email || "No email shown"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {member.reportedAt ? (
                        <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-warning">
                          Reported
                        </span>
                      ) : null}
                      {member.isBlocked ? (
                        <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-danger">
                          Blocked
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <span className="rounded-full bg-secondary-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-500">
                  {getMemberRoleLabel(member)}
                </span>
                <div className="flex gap-2 sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full border-secondary-100 text-xs text-secondary-500"
                    onClick={() =>
                      activeGroup &&
                      (backendGroup
                        ? reportMemberMutation.mutate({
                            groupId: activeGroup.id,
                            memberId: member.id,
                          })
                        : reportEventChatMember(activeGroup.id, member.id))
                    }
                    disabled={
                      !activeGroup || !!member.reportedAt || reportMemberMutation.isPending
                    }
                  >
                    <FlagIcon className="mr-1.5 size-3" />
                    Report
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full border-secondary-100 text-xs text-danger"
                    onClick={() =>
                      activeGroup &&
                      (backendGroup
                        ? blockMemberMutation.mutate({
                            groupId: activeGroup.id,
                            memberId: member.id,
                          })
                        : blockEventChatMember(activeGroup.id, member.id))
                    }
                    disabled={
                      !activeGroup || !!member.isBlocked || blockMemberMutation.isPending
                    }
                  >
                    <BanIcon className="mr-1.5 size-3" />
                    Block
                  </Button>
                </div>
              </div>
            ))}

            {activeGroup && !isLoadingMembers && attendeeMembers.length === 0 ? (
              <div className="rounded-[1.25rem] bg-secondary-50 px-4 py-8 text-center text-sm text-secondary-500">
                No attendees have joined this group yet.
              </div>
            ) : null}

            {!activeGroup && !isLoadingMembers && !memberLoadFailed ? (
              <div className="rounded-[1.25rem] bg-secondary-50 px-4 py-8 text-center text-sm text-secondary-500">
                This group could not be found on this device yet.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
};

export default memo(GroupMembersPage);
