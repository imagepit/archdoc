"use server";

export async function createOrderAction(items: string[]) {
  return { success: true, orderId: "new-order" };
}

export async function deleteOrderAction(orderId: string) {
  return { success: true };
}
