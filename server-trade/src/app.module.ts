import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod
} from "@nestjs/common"
import { ScheduleModule } from "@nestjs/schedule"
import { PrismaModule } from "nestjs-prisma"

import { ConfigModule } from "@nestjs/config"

import { UserModule } from "./modules/user/user.module"
import { WalletModule } from "./modules/wallet/wallet.module"
import { StripeModule } from "./modules/stripe/stripe.module"
import { StockModule } from "./modules/stock/stock.module"
import { StockOrdersModule } from "./modules/orders-stock/orders-stock.module"
import { TransactionHistoryModule } from "./modules/transaction-history/transaction-history.module"
import { PursharedSharesModule } from "./modules/purshared-shares/purshared-shares.module"

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    UserModule,
    WalletModule,
    StripeModule,
    StockModule,
    PursharedSharesModule,
    StockOrdersModule,
    TransactionHistoryModule,
  ],
  controllers: [],
  providers: []
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((req, res, next) => {
        next();
      })
      .exclude(
        {
          path: "/user",
          method: RequestMethod.POST
        },
        {
          path: "/stripe/webhook",
          method: RequestMethod.POST
        },
        {
          path: "/app-version(.*)",
          method: RequestMethod.GET
        },
        {
          path: "/app-version(.*)",
          method: RequestMethod.POST
        },
        {
          path: "/mail/support",
          method: RequestMethod.POST
        }
      )
      .forRoutes("user", "stripe", "wallet", "share")
  }
}
