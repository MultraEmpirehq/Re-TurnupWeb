import { getData, patchData } from "@/api";
import {
  IVendorVerification,
  TApprovalLevel,
  TVerificationDecision,
  TVerificationStatus,
} from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const PAGE_SIZE = 20;

export type TReviewPayload = {
  id: string;
  status: TVerificationDecision;
  approvalLevel?: TApprovalLevel;
  message?: string;
};

export const useAdminVerifications = ({
  status,
  search,
  page,
}: {
  status: TVerificationStatus | "all";
  search: string;
  page: number;
}) =>
  useQuery({
    queryKey: ["admin-verifications", status, search, page],
    queryFn: async () => {
      const { data } = await getData<IVendorVerification[]>(
        "/admin/vendor-verifications",
        {
          params: {
            page,
            limit: PAGE_SIZE,
            ...(status === "all" ? {} : { status }),
            ...(search ? { search } : {}),
          },
        },
      );
      return {
        verifications: data?.data ?? [],
        pagination: data?.pagination,
      };
    },
    retry: 0,
  });

export const useReviewVerification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...body }: TReviewPayload) => {
      const { data } = await patchData<
        Omit<TReviewPayload, "id">,
        IVendorVerification
      >(`/admin/vendor-verifications/${id}/review`, body);
      return data?.data;
    },
    onSuccess: () => {
      // A decision also changes what the user-details sheet reports, so both go.
      void queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-user"] });
    },
  });
};
