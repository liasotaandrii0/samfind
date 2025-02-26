import { BadRequestException, ConflictException, Injectable } from "@nestjs/common"
import { PrismaService } from "nestjs-prisma"
import { $Enums } from "@prisma/client"
import { CreateStockOrderDto } from "./dto/create-order-dto"

interface Order {
  stockId: string
  userId: string
  type: $Enums.OrderType
  quantity: number
  offeredPrice: number
  paymentId: string | null
  id: string
  status: $Enums.OrderStatus
  createdAt: Date
  updatedAt: Date
}

@Injectable()
export class StockOrdersService {
  constructor(private readonly prisma: PrismaService) { }

  async createStockOrder(body: CreateStockOrderDto) {
    const { stockId, userId, type, quantity, offeredPrice, paymentId } = body
    // TO-DO: Send email after order is placed
    // TO-DO: Also / OR make and webhook notification, if will be decided to ALTER model with it

    if (!stockId || !userId) throw new BadRequestException("StockID and UserID is required in order creation.")
    try {
      const stockOrder = await this.prisma.$transaction(async (prisma) => {
        const stock = await prisma.stock.findUnique({ where: { id: stockId } })
        const user = await prisma.user.findUnique({ where: { id: userId } })

        if (!stock || !user) throw new BadRequestException("Stock or User wasn`t created or properly assigned.")

        if (type === "SELL") {
          const sellerShare = await prisma.purchasedShare.findFirst({
            where: { userId, stockId },
          })
          if (!sellerShare || sellerShare.quantity < quantity) {
            throw new BadRequestException("Insufficient shares to sell.")
          }
        }

        const stockOrder = await prisma.orderStock.create({
          data: {
            stockId,
            userId,
            type,
            quantity,
            offeredPrice,
            paymentId: paymentId ? paymentId : null
          }
        })

        await prisma.transactionHistory.create({
          data: {
            stockId,
            userId,
            orderId: stockOrder.id,
            type: "PLACEMENT",
            quantity: quantity,
            price: offeredPrice
          }
        })

        const matchingOrder = await this.checkMatchingOrder(prisma, stockOrder)
        if (matchingOrder) {
          await this.performTrade(prisma, stockOrder, matchingOrder)
          return { ...stockOrder, status: 'COMPLETED' }
          // we should return a created order with COMPLETED status
          // even if this another requiest
        }

        return stockOrder
      })

      return stockOrder
    } catch (error) {
      throw new BadRequestException(`Failed to create stock-order: ${error.message}`)
    }
  }

  // async cancelStockOrder(id: string) {
  //   // TO-DO: Send email after order is canceled | rejected
  //   // TO-DO: Also / OR make and webhook notification, if will be decided to ALTER model with it

  //   try {
  //     const stockOrder = await this.prisma.$transaction(async (prisma) => {
  //       const originalOrder = await prisma.orderStock.findFirst({
  //         where: { id },
  //         include: { stock: true, user: true }
  //       })

  //       if (!originalOrder) {
  //         throw new Error("Order not found.")
  //       }

  //       if (!['PENDING', 'ACCEPTED'].includes(originalOrder.status)) {
  //         throw new Error("Only pending or accepted orders can be canceled.")
  //       }

  //       const stockOrder = await prisma.orderStock.update({
  //         where: { id: id },
  //         data: {
  //           status: 'CANCELED'
  //         }
  //       })

  //       await prisma.transactionHistory.create({
  //         data: {
  //           stockId: originalOrder.stock.id,
  //           userId: originalOrder.user.id,
  //           orderId: id,
  //           type: "REJECTION",
  //           quantity: 0,
  //           price: 0
  //         }
  //       })

  //       return stockOrder
  //     })

  //     return stockOrder
  //   } catch (error) {
  //     throw new ConflictException(`Failed to erase stock-order: ${error.message}`)
  //   }
  // }

  // async getAllStockOrdersWithPagination(page: number, limit: number, order: "asc" | "desc") {
  //   const stockOrders = await this.prisma.orderStock.findMany({
  //     skip: (page - 1) * limit,
  //     take: limit,
  //     include: { user: true, stock: true, transaction: true },
  //     orderBy: { createdAt: order }
  //   })

  //   const total = await this.prisma.orderStock.count()

  //   return {
  //     paging: {
  //       page,
  //       limit,
  //       total
  //     },
  //     data: stockOrders
  //   }
  // }

  /**
    |============================
    | UTILS FN
    |============================
  */

  async checkMatchingOrder(prisma, newOrder: Order) {
    const { stockId, type, quantity, offeredPrice } = newOrder

    if (type === "SELL") {
      return await prisma.orderStock.findFirst({
        where: {
          stockId,
          type: "BUY",
          status: "PENDING",
          quantity,
          offeredPrice: { gte: offeredPrice }
        },
        orderBy: [
          { offeredPrice: "desc" }, // the highest price
          { createdAt: "asc" } // the earliest placed order
        ]
      })
    } else if (type === "BUY") {
      return await prisma.orderStock.findFirst({
        where: {
          stockId,
          type: "SELL",
          status: "PENDING",
          quantity,
          offeredPrice: { lte: offeredPrice }
        },
        orderBy: [
          { offeredPrice: "asc" }, // the minimal price
          { createdAt: "asc" } // the earliest placed order
        ]
      })
    }

    return null
  }

  async performTrade(prisma, newOrder: Order, matchingOrder: Order) {
    const { type: newOrderType, userId: newUserId, stockId, quantity, offeredPrice: newPrice } = newOrder
    const { id: matchingOrderId, userId: matchingUserId, offeredPrice: matchingPrice } = matchingOrder

    // determine price of person, who was in query earlier
    const tradePrice = newOrder.createdAt < matchingOrder.createdAt ? newPrice : matchingPrice

    await prisma.$transaction(async (prisma) => {
      // update of stock-orders status
      await prisma.orderStock.update({
        where: { id: newOrder.id },
        data: { status: "COMPLETED" }
      })
      await prisma.orderStock.update({
        where: { id: matchingOrderId },
        data: { status: "COMPLETED" }
      })

      // update transaction-history for both orders

      // new order history
      await prisma.transactionHistory.create({
        data: {
          stockId,
          userId: newUserId,
          orderId: newOrder.id,
          type: newOrderType === "SELL" ? "SALE" : "PURCHASE",
          quantity,
          price: tradePrice
        }
      })

      // match order history
      await prisma.transactionHistory.create({
        data: {
          stockId,
          userId: matchingUserId,
          orderId: matchingOrderId,
          type: newOrderType === "SELL" ? "PURCHASE" : "SALE",
          quantity,
          price: tradePrice
        }
      })

      const sellerId = newOrderType === "SELL" ? newUserId : matchingUserId
      const buyerId = newOrderType === "SELL" ? matchingUserId : newUserId

      // decrease amount of shares from the seller
      const sellerShare = await prisma.purchasedShare.findFirst({
        where: { userId: sellerId, stockId },
      })

      if (!sellerShare) {
        throw new Error("Seller does not own any shares.")
      }

      const newSellerQuantity = sellerShare.quantity - quantity

      if (newSellerQuantity === 0) {
        // to save some db space
        await prisma.purchasedShare.delete({ where: { id: sellerShare.id } })
      } else {
        // update quantity
        await prisma.purchasedShare.update({
          where: { id: sellerShare.id },
          data: { quantity: newSellerQuantity },
        })
        // also send email async (if you send it in transaction - its gonna block, send outside of transaction)
      }

      // increasing shares in buyer (or create a new buyer record)
      const buyerShare = await prisma.purchasedShare.findFirst({
        where: { userId: buyerId, stockId },
      })

      if (buyerShare) {
        await prisma.purchasedShare.update({
          where: { id: buyerShare.id },
          data: { quantity: buyerShare.quantity + quantity },
        })
        // also send email async (if you send it in transaction - its gonna block, send outside of transaction)
      } else {
        await prisma.purchasedShare.create({
          data: {
            userId: buyerId,
            stockId,
            quantity,
          },
        })
      }
    })
  }
}
