import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule, PrismaService } from "nestjs-prisma";
import { StockOrdersController } from "./orders-stock.controller";
import { StockOrdersService } from "./orders-stock.service";
import { UserModule } from "../user/user.module";
import { UserService } from "../user/user.service";
import { MailService } from "../mail/mail.service";

@Module({
  imports: [
    ConfigModule.forRoot(),
    PrismaModule,
    UserModule
  ],
  controllers: [StockOrdersController],
  providers: [
    PrismaService,
    UserService,
    StockOrdersService,
    MailService
  ],
  exports: [StockOrdersService]
})
export class StockOrdersModule { }
