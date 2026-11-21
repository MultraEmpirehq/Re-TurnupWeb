"use client";

import BrandLoader from "@/components/ui/brand-loader";
import { Button } from "@/components/ui/button";
import { constructErrorMessage } from "@/api/functions";
import { joinGroup, useGroupInvite } from "@/hooks/use-group-chats";
import { toast } from "@/lib/toast";
import { ROUTES } from "@/lib/variables";
import useUserStore from "@/stores/user-store";
import { UsersRound } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect } from "react";

/**
 * Where a group's invite link lands: who the group is, then Join. Signed-out
 * people sign in (or sign up) first and come back here.
 */
export default function JoinGroupPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token?.toString() ?? "";
  const userDetails = useUserStore((state) => state.userDetails);
  const isLoading = useUserStore((state) => state.isLoading);
  const { data: group, isLoading: loadingGroup, error } = useGroupInvite(userDetails ? token : null);

  useEffect(() => {
    if (isLoading || userDetails || !token) return;
    router.replace(`${ROUTES.LOGIN.href}?redirect=${encodeURIComponent(`/groups/join/${token}`)}`);
  }, [isLoading, router, token, userDetails]);

  const join = async () => {
    try {
      const joined = await joinGroup(token);
      if (joined?.id) router.replace(`${ROUTES.MESSAGES.href}?chat=${joined.id}`);
    } catch (joinError) {
      toast.error(constructErrorMessage(joinError as TApiErrorResponseType, "Couldn't join the group."));
    }
  };

  if (isLoading || !userDetails || loadingGroup) return <BrandLoader />;

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      {!group || error ? (
        <>
          <UsersRound className="size-10 text-secondary-400" aria-hidden />
          <h1 className="text-xl font-bold text-foreground">This invite link doesn&apos;t work</h1>
          <p className="text-sm text-muted-foreground">It may have been turned off or replaced. Ask the group for a new one.</p>
          <Button variant="outline" className="rounded-full" onClick={() => router.push(ROUTES.MESSAGES.href)}>
            Go to your chats
          </Button>
        </>
      ) : (
        <>
          {group.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={group.image} alt="" className="size-28 rounded-3xl object-cover" />
          ) : (
            <span className="flex size-28 items-center justify-center rounded-3xl bg-primary/10 text-4xl font-extrabold text-secondary-700">
              {group.name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground">{group.name}</h1>
            <p className="text-sm text-muted-foreground">
              Private group · {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
            </p>
          </div>
          <Button className="h-12 rounded-full px-8 text-base" onClick={join}>
            Join group
          </Button>
        </>
      )}
    </main>
  );
}
