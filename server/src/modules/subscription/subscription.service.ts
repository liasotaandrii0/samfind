import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { compareAsc, startOfDay } from "date-fns";
import { PrismaService } from "../prisma/prisma.service";
import {
  BalanceType,
  LicenseStatus,
  LicenseTierType,
  PlanPeriod,
  TransactionType,
  UserAccountType,
} from "@prisma/client";
import { StripeService } from "../stripe/stripe.service";
import { AddSubscriptionDto } from "./dto/add-subscription-dto";
import Stripe from "stripe";
import { ChangePlanDto } from "./dto/change-plan-dto";

interface IAddDiscount {
  discountAmount: number;
  userId: string;
}
@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => StripeService))
    private readonly stripeService: StripeService,
  ) {}

  async addSubscription({
    userId,
    planId,
    quantity,
    userReferralCode,
  }: AddSubscriptionDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) throw new NotFoundException("User not found");
    let url = null;
    let stripeCustomerId = user.stripeCustomerId;

    let subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
    if (
      subscription &&
      (subscription.isActive || subscription.isInTrial) &&
      subscription.plan.type !== LicenseTierType.freemium
    )
      throw new BadRequestException("Subscription already exists");

    const license = await this.prisma.license.findUnique({
      where: { ownerId: userId },
    });
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) throw new NotFoundException("Plan not found");

    if (!stripeCustomerId) {
      const stripeCustomer = await this.stripeService.createCustomer(
        user.email,
        user.firstName + " " + user.lastName,
      );

      stripeCustomerId = stripeCustomer.id;

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          stripeCustomerId: stripeCustomer.id,
        },
      });
    }

    const items = [
      {
        quantity,
        price: plan.stripePriceId,
      },
    ];
    const metadata = {
      quantity,
      userReferralCode,
      userId: user.id,
      newPlan: plan.id,
    };

    const tax =
      plan.type === LicenseTierType.earlyBird || !user.isFromNorway
        ? undefined
        : user.accountType === UserAccountType.business
          ? "added"
          : "inclusive";

    if (!subscription) {
      const stripeSession = await this.stripeService.createSubscriptionSession({
        stripeCustomerId,
        items,
        tax,
        metadata,
        description: `Plan - ${plan.type} - ${plan.period}. Quantity - ${
          plan.type === LicenseTierType.earlyBird ? 1 : quantity
        }.`,
      });

      subscription = await this.prisma.subscription.create({
        data: {
          userId,
          licenseId: license?.id,
          planId: plan.id,
          isActive: false,
          isInTrial: false,
          nextDate: new Date(),
        },
        include: { plan: true },
      });

      url = stripeSession.url;
    } else {
      if (subscription.stripeSubscriptionId)
        await this.stripeService.cancelSubscriptionById(
          subscription.stripeSubscriptionId,
        );

      const stripeSession = await this.stripeService.createSubscriptionSession({
        stripeCustomerId,
        items,
        tax,
        metadata,
        description: `Plan - ${plan.type} - ${plan.period}. Quantity - ${
          plan.type === LicenseTierType.earlyBird ? 1 : quantity
        }.`,
      });

      subscription = await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          userId,
          licenseId: license?.id,
          planId: plan.id,
          isActive: false,
          isInTrial: false,
          nextDate: new Date(),
        },
        include: { plan: true },
      });
      url = stripeSession.url;
    }

    return { url };
  }

  async payInvoice() {
    const invoice = await this.stripeService.createAndPayInvoice({
      customerId: "cus_Ri6j3QX47oJao7",
      priceId: "price_1QogLRIQ0ONDLa6iiO7AZxI5",
      quantity: 1,
      // couponId: discountId,
      description: "Description rdfgfdgfgdfsgfdg",
      metadata: {
        quantity: 1,
        subscriptionId: "15d1ec94-61ec-4dee-a8f0-492242d32536",
        // memberId: member.id,
      },
      pay: true,
    });

    return { url: invoice.hosted_invoice_url };
  }

  async getBillingHistory(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.stripeCustomerId)
      throw new NotFoundException("User not found");

    const allInvoices: Stripe.Invoice[] = [];
    let hasMore = true;
    let lastInvoiceId = undefined;

    while (hasMore) {
      const response = await this.stripeService.getUserInvoices(
        user.stripeCustomerId,
        100,
        lastInvoiceId,
      );

      allInvoices.push(...response.data);
      hasMore = response.has_more;

      if (response.data.length > 0) {
        lastInvoiceId = response.data[response.data.length - 1].id;
      }
    }

    const invoices = allInvoices
      .filter((invoice) => !invoice.metadata.share)
      .filter((invoice, index) => {
        if (index === 0) return true;
        return invoice.status === "paid";
      })
      .map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        url: invoice.hosted_invoice_url,
        pdf: invoice.invoice_pdf,
        status: invoice.status,
        price: invoice.subtotal,
        afterDiscount: invoice.total,
        description: invoice.description,
        date: invoice.status_transitions.finalized_at,
        payDate: invoice.status_transitions.paid_at,
      }));

    return invoices;
  }

  async cancelSubscription(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundException("Subscription not found");
    }

    await this.stripeService.putSubscriptionOnPause(
      subscription.stripeSubscriptionId,
    );

    await this.prisma.subscription.update({
      where: {
        id,
      },
      data: {
        isActive: false,
        cancelDate: new Date(),
      },
    });

    if (subscription.licenseId) {
      await this.prisma.license.update({
        where: { id: subscription.licenseId },
        data: { status: LicenseStatus.inactive },
      });
    }

    return {
      status: LicenseStatus.inactive,
    };
  }

  async activeSubscription(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        plan: true,
        user: true,
        license: {
          include: {
            _count: {
              select: {
                activeLicenses: {
                  where: {
                    deleteDate: null,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException("Subscription not found");
    }

    const today = new Date();
    const nextDate = new Date(subscription.nextDate);

    const difference = compareAsc(startOfDay(today), startOfDay(nextDate));

    await this.stripeService.activeSubscription(
      subscription.stripeSubscriptionId,
    );

    if (difference < 0) {
      await this.prisma.subscription.update({
        where: {
          id,
        },
        data: {
          isActive: true,
          cancelDate: null,
        },
      });

      if (subscription.licenseId) {
        await this.prisma.license.update({
          where: { id: subscription.licenseId },
          data: { status: LicenseStatus.active },
        });
      }
    } else {
      const stripeSubscription = await this.stripeService.getSubscriptionById(
        subscription.stripeSubscriptionId,
      );

      if (!stripeSubscription || stripeSubscription.status === "past_due") {
        throw new BadRequestException(
          "An error occurred when paying for the License",
        );
      }

      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          isActive: true,
          isInTrial: false,
          nextDate: new Date(stripeSubscription.current_period_end * 1000),
        },
      });
    }

    return { status: LicenseStatus.active };
  }

  async changePlan({ planId, subscriptionId }: ChangePlanDto) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true },
    });

    if (!subscription) {
      throw new NotFoundException("Subscription not found");
    }

    const stripeSubscription = await this.stripeService.getSubscriptionById(
      subscription.stripeSubscriptionId,
    );

    if (!stripeSubscription) {
      throw new NotFoundException("Subscription not found");
    }

    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException("Plan not found");
    }

    if (subscription.planId === planId) {
      throw new BadRequestException("The plan has already been activated");
    }

    const today = new Date();
    const nextDate = new Date(subscription.nextDate);

    const difference = compareAsc(startOfDay(today), startOfDay(nextDate));

    await this.stripeService.changeSubscriptionItems({
      subscriptionId: stripeSubscription.id,
      subscriptionItemId: stripeSubscription.items.data[0].id,
      newPriceId: plan.stripePriceId,
      quantity:
        subscription.plan.type === LicenseTierType.earlyBird
          ? stripeSubscription.items.data[0].quantity / 6
          : stripeSubscription.items.data[0].quantity,
      metadata: { newPlan: plan.id },
      description: `Plan - ${plan.type} - ${plan.period}. Quantity - ${stripeSubscription.items.data[0].quantity}.`,
    });

    if (plan.type === LicenseTierType.freemium) {
      await this.prisma.subscription.update({
        where: { id: subscriptionId },
        data: { planId, isActive: true, isInTrial: false },
      });
      await this.prisma.license.update({
        where: { id: subscription.licenseId },
        data: { tierType: LicenseTierType.freemium },
      });
    } else if (
      difference < 0 &&
      subscription.plan.type !== LicenseTierType.earlyBird
    ) {
      await this.prisma.subscription.update({
        where: { id: subscriptionId },
        data: { newPlanId: planId },
      });
    } else {
      await this.prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          planId,
        },
      });
      await this.prisma.license.update({
        where: { id: subscription.licenseId },
        data: { tierType: plan.type },
      });

      await this.stripeService.activeSubscription(
        subscription.stripeSubscriptionId,
      );

      const invoiceId =
        typeof stripeSubscription.latest_invoice === "string"
          ? stripeSubscription.latest_invoice
          : stripeSubscription.latest_invoice.id;
      const invoice = await this.stripeService.getInvoiceById(invoiceId);

      if (!invoice || invoice.status !== "paid") {
        throw new BadRequestException(
          "Automatic payment is made. Please check the invoice in Payment history",
        );
      }

      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          isActive: true,
          isInTrial: false,
          nextDate: new Date(stripeSubscription.current_period_end * 1000),
        },
      });
    }

    return plan;
  }

  async getDiscountHistory(userId: string) {
    const discountHistory: {
      id: string;
      date: string | Date;
      type: TransactionType;
      amount: number;
      description: string;
    }[] = [];

    const discountTransactions = await this.prisma.walletTransaction.findMany({
      where: { userId, balanceType: BalanceType.discount },
    });

    discountTransactions.forEach((d) => {
      discountHistory.push({
        id: d.id,
        date: d.updatedAt,
        type: d.transactionType,
        amount: d.amount,
        description: d.description,
      });
    });

    discountHistory.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return discountHistory;
  }

  async addDiscount({ discountAmount, userId }: IAddDiscount) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.stripeCustomerId)
      throw new NotFoundException("Subscription not found");

    await this.stripeService.updateCustomerBalance(
      user.stripeCustomerId,
      discountAmount,
    );
  }

  async transformEarlyBirdToStandardSubscriptions() {
    const earlyBirdPlan = await this.prisma.plan.findFirst({
      where: { type: LicenseTierType.earlyBird },
    });
    const freePlan = await this.prisma.plan.findFirst({
      where: { type: LicenseTierType.freemium },
    });
    const standardMonthlyPlan = await this.prisma.plan.findFirst({
      where: { type: LicenseTierType.standard, period: PlanPeriod.monthly },
    });

    if (!earlyBirdPlan || !standardMonthlyPlan || !freePlan) return;

    const earlyBirdList = await this.prisma.subscription.findMany({
      where: { planId: earlyBirdPlan.id },
    });

    if (!earlyBirdList.length) return;

    for (let i = 0; i < earlyBirdList.length; i++) {
      const subscription = earlyBirdList[i];

      if (subscription.isActive) {
        await this.changePlan({
          planId: standardMonthlyPlan.id,
          subscriptionId: subscription.id,
        });
      } else {
        await this.changePlan({
          planId: freePlan.id,
          subscriptionId: subscription.id,
        });
      }
    }
  }
}
