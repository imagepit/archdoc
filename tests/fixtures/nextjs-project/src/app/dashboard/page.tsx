// This page has multiple responsibility violations for testing
import { OrderRepositoryImpl } from "../../infrastructure/repositories/OrderRepositoryImpl";
import { Order } from "../../domain/entities/Order";
import { CreateOrderUseCase } from "../../application/usecases/CreateOrderUseCase";

export default async function DashboardPage() {
  // Rule 3: Direct fetch in page
  const data = await fetch("https://api.example.com/stats");

  // Rule 4: DI assembly in page
  const repo = new OrderRepositoryImpl();
  const useCase = new CreateOrderUseCase();

  return "Dashboard";
}
