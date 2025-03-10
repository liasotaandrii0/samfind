import { BadRequestException, Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { AddAppSettingsDto } from "./dto/add-app-settings-dto";
import { StripeService } from "../stripe/stripe.service";
import { AddTaxDto } from "./dto/add-tax-dto";
import { SubscriptionService } from "../subscription/subscription.service";

@Injectable()
export class AppSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async addSettings(data: AddAppSettingsDto) {
    const appSettings = await this.prisma.appSettings.findFirst({
      where: {},
    });

    if (data.sharePrice && appSettings?.sharePrice)
      throw new BadRequestException("Share Price already added");

    let shareStripeProductId = appSettings?.shareStripeProductId;
    let shareStripePriceId = appSettings?.shareStripePriceId;

    if (data.sharePrice) {
      const product = await this.stripeService.createProduct(
        "Onsio Share",
        "shareStripePriceId",
      );
      const price = await this.stripeService.createPrice(
        product.id,
        data.sharePrice,
      );
      shareStripeProductId = product.id;
      shareStripePriceId = price.id;
    }

    if (!appSettings) {
      await this.prisma.appSettings.create({
        data: { ...data, shareStripePriceId, shareStripeProductId },
      });
    } else {
      await this.prisma.appSettings.update({
        where: { id: appSettings.id },
        data: { ...data, shareStripePriceId, shareStripeProductId },
      });
    }

    if (
      data.earlyBirdPeriod === false ||
      data.limitOfSharesPurchased === appSettings?.currentSharesPurchased
    ) {
      await this.subscriptionService.transformEarlyBirdToStandardSubscriptions();
    }

    return await this.prisma.appSettings.findFirst({
      where: {},
    });
  }

  async getAppSettings() {
    return await this.prisma.appSettings.findFirst({
      where: {},
    });
  }

  async aadTax(data: AddTaxDto) {
    const appSettings = await this.prisma.appSettings.findFirst({
      where: {},
    });

    if (appSettings?.stripeTaxAddedId)
      throw new BadRequestException("Tax already added");

    const taxInclusive = await this.stripeService.addTax({
      ...data,
      inclusive: true,
    });
    const taxAdded = await this.stripeService.addTax({
      ...data,
      inclusive: false,
    });

    if (!taxInclusive || !taxAdded)
      throw new BadRequestException("Something went wrong");

    if (!appSettings) {
      await this.prisma.appSettings.create({
        data: {
          stripeTaxAddedId: taxAdded.id,
          stripeTaxInclusive: taxInclusive.id,
        },
      });
    } else {
      await this.prisma.appSettings.update({
        where: { id: appSettings.id },
        data: {
          stripeTaxAddedId: taxAdded.id,
          stripeTaxInclusive: taxInclusive.id,
        },
      });
    }

    return data;
  }

  async getSharePrice() {
    const appSettings = await this.prisma.appSettings.findFirst({
      where: {},
    });

    return { sharePrice: appSettings?.sharePrice };
  }
}
