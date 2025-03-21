import {
  AlertDialogHeader,
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from "@/components/ui";
import { X } from "lucide-react";
import { AlertDialogCancel } from "@radix-ui/react-alert-dialog";
// import { compareAsc, format, startOfDay } from "date-fns";
import { useChangeSubscriptionPlan } from "@/hooks";
import { Plan, PlanType } from "@/types";
import { useEffect, useState } from "react";

interface ChangePlanModalProps {
  nextDate: string;
  subscriptionId: string;
  plan: Plan;
  closePlansModal: () => void;
}

export const ChangePlanModal = ({
  // nextDate,
  subscriptionId,
  plan,
  closePlansModal,
}: ChangePlanModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    mutate: changeSubscriptionPlan,
    isPending: isChangeSubscriptionPlan,
    isSuccess,
  } = useChangeSubscriptionPlan();

  useEffect(() => {
    if (isSuccess) {
      setIsOpen(false);
      closePlansModal();
    }
  }, [isSuccess, closePlansModal]);
  // const difference = compareAsc(
  //   startOfDay(new Date()),
  //   startOfDay(new Date(nextDate))
  // );

  // const monthName = format(new Date(nextDate), "dd MMMM, yy", {
  //   locale: undefined,
  // });
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={"secondary"} className="w-full">
          Change plan
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="w-full max-w-[590px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-semibold">
            Please confirm the plan change
          </AlertDialogTitle>
          <AlertDialogDescription />
        </AlertDialogHeader>

        <div className="absolute right-5 top-5">
          <AlertDialogCancel
            onClick={() => setIsOpen(false)}
            className="shadow-none border-none p-1 rounded-full bg-card"
          >
            <X size={18} />
          </AlertDialogCancel>
        </div>

        <p className="text-[#C4C4C4] text-[16px] leading-[22px] mt-2">
          {plan.type === PlanType.Freemium
            ? `You want to change to a freemium plan. In this case, you will lose all benefits.`
            : `If you change your plan, the update will take effect immediately. The amount due will be adjusted based on the new plan, considering any unused balance from your current plan.`}
        </p>

        <div className="flex gap-4 mt-8">
          <AlertDialogCancel
            onClick={() => setIsOpen(false)}
            className="w-1/2 bg-[#383838] hover:bg-[#424242] text-white rounded-full h-[56px] text-[16px]"
          >
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            className="flex-1 bg-[#FF6C6C] hover:bg-[#FF5252] text-white rounded-full h-[56px] text-[16px]"
            onClick={() =>
              changeSubscriptionPlan({ subscriptionId, planId: plan.id })
            }
            withLoader
            loading={isChangeSubscriptionPlan}
          >
            Continue
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
