/**
 * GET /api/orders/:orderId
 * Get a specific order by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  return Response.json({ id: orderId, items: [] });
}

/**
 * DELETE /api/orders/:orderId
 * Delete a specific order
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  return new Response(null, { status: 204 });
}
