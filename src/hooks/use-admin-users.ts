import { getData } from "@/api";
import {
  IAdminUserDetails,
  IAdminUserListItem,
  TAdminUserType,
} from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

const PAGE_SIZE = 20;

export const useAdminUsers = ({
  type,
  search,
  page,
}: {
  type: TAdminUserType;
  search: string;
  page: number;
}) =>
  useQuery({
    queryKey: ["admin-users", type, search, page],
    queryFn: async () => {
      const { data } = await getData<IAdminUserListItem[]>("/admin/users", {
        params: {
          type,
          page,
          limit: PAGE_SIZE,
          ...(search ? { search } : {}),
        },
      });
      return { users: data?.data ?? [], pagination: data?.pagination };
    },
    retry: 0,
  });

export const useAdminUser = (id?: string) =>
  useQuery({
    queryKey: ["admin-user", id],
    queryFn: async () => {
      const { data } = await getData<IAdminUserDetails>(`/admin/users/${id}`);
      return data?.data;
    },
    enabled: !!id,
    retry: 0,
  });
