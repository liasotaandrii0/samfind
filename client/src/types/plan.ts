export const enum PlanType {
  Standard = "standard",
  Freemium = "freemium",
  EarlyBird = "earlyBird",
}

export const enum PlanPeriod {
  Monthly = "monthly",
  Yearly = "yearly",
}

export interface Plan {
  id: string;
  type: PlanType;
  period: PlanPeriod;
  price: number;
  stripeProductId: string;
  stripePriceId: string;
}
