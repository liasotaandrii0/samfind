import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { StockOrdersService } from "./orders-stock.service";
import { CreateStockOrderDto } from "./dto/create-order-dto";
import { CreatePoolPurchaseDto } from "./dto/create-pool-purshare-dto";
import { CreateOrderToSellToPool } from "./dto/create-order-to-sell-pool-dto";
import { OrderType } from "src/common/types/order-type";
import { CanceledBy } from "../purshared-shares/types";

@ApiTags("StockOrders")
@Controller("stock-orders")

export class StockOrdersController {
  constructor(private readonly stockOrdersService: StockOrdersService) { }

  @ApiOperation({ summary: "Create a stock order (buy/sell between users)" })
  @Post("/")
  async createStockOrder(@Body() createStockOrderDto: CreateStockOrderDto) {
    return await this.stockOrdersService.createStockOrder(createStockOrderDto)
  }

  @ApiOperation({ summary: "Purchase stock from the pool" })
  @Post("/pool-purchase")
  async createPoolPurchaseOrder(@Body() body: CreatePoolPurchaseDto) {
    return await this.stockOrdersService.createPoolPurchaseOrder(body);
  }

  @ApiOperation({ summary: "Sell shares from user back to pool" })
  @Post("/pool-purchase/sell/:id")
  async createPoolSellOrder(@Param("id") id: string, @Body() body: CreateOrderToSellToPool) {
    return await this.stockOrdersService.sellStocksToPoolOrder(id, body)
  }

  @ApiOperation({ summary: "Cancel | Delete order from the market | User Cancel Or By System" })
  @Post("/cancel/:id")
  async eraseStockOrder(@Param("id") id: string, @Query("canceledBy") canceledBy: CanceledBy) {
    return await this.stockOrdersService.cancelStockOrder(id, canceledBy)
  }

  @ApiOperation({ summary: "Get all StockOrders with pagination" })
  @Get("/")
  async getAllStockOrdersWithPagination(
    @Query("page") page: number,
    @Query("limit") limit: number,
    @Query("order") order: OrderType
  ) {
    return await this.stockOrdersService.getAllStockOrdersWithPagination(page, limit, order)
  }
}
