import { Router, Request, Response, NextFunction } from "express";
import { CreateOrderUseCase, type CreateOrderInput } from "../../../application/usecases/order/CreateOrderUseCase.js";
import type { OrderRepository } from "../../../domain/repositories/OrderRepository.js";
import { PrismaOrderRepository } from "../../../infrastructure/repositories/PrismaOrderRepository.js";

export interface OrderRouterDependencies {
  orderRepository?: OrderRepository;
}

export function createOrderRouter(
  deps: OrderRouterDependencies = {},
): Router {
  const router = Router();
  const orderRepository =
    deps.orderRepository ?? new PrismaOrderRepository();
  const createOrderUseCase = new CreateOrderUseCase(orderRepository);

  /**
   * POST /api/orders
   * Create a new order
   */
  router.post(
    "/",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const input: CreateOrderInput = req.body;
        const orderId = await createOrderUseCase.execute(input);
        res.status(201).json({ id: orderId });
        return;
      } catch (error) {
        next(error);
        return;
      }
    },
  );

  /**
   * GET /api/orders/:orderId
   * Get order by ID
   */
  router.get(
    "/:orderId",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const orderId = req.params.orderId as string;
        const order = await orderRepository.findById(orderId);
        if (!order) {
          res.status(404).json({ error: "Not found" });
          return;
        }
        res.json(order);
        return;
      } catch (error) {
        next(error);
        return;
      }
    },
  );

  return router;
}
