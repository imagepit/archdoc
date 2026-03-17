import { CreateOrderUseCase } from "../../../application/usecases/CreateOrderUseCase";

/**
 * POST /api/orders
 * Create a new order
 * @param items — List of item IDs to include in the order
 * @returns The created order object
 * @throws When items array is empty
 */
export async function POST(request: Request) {
  const body = await request.json();
  const useCase = new CreateOrderUseCase();
  const order = await useCase.execute(body.items);
  return Response.json(order, { status: 201 });
}

/**
 * GET /api/orders
 * List all orders
 */
export async function GET() {
  return Response.json({ orders: [] });
}
