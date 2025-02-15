import { useQuery } from "@tanstack/react-query";

import { BillingApiServices } from "@/services/api/billing.service";

export const useGetBillingHistory = (id: string) => {
  return useQuery({
    queryFn: () => BillingApiServices.getBillingHistory(id),
    queryKey: ["billing-history"],
  });
};

export const useGetDiscountHistory = (id: string) => {
  return useQuery({
    queryFn: () => BillingApiServices.getDiscountHistory(id),
    queryKey: ["discount-history"],
  });
};
