/**
 * POST /api/auth/login
 * Authenticate user with email and password
 */
export async function POST(request: Request) {
  const { email, password } = await request.json();
  if (!email || !password) {
    return Response.json({ error: "Email and password are required" }, { status: 400 });
  }
  return Response.json({ token: "dummy-token" });
}
