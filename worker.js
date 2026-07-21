export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };


    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders
      });
    }


    // API status test
    if (url.pathname === "/") {
      return Response.json(
        {
          status: "Gram Quest New API is running"
        },
        {
          headers: corsHeaders
        }
      );
    }
// User Login / Register
if (url.pathname === "/api/login" && request.method === "POST") {

  const data = await request.json();

  const existing = await env.DB
    .prepare(
      "SELECT * FROM users WHERE telegramId = ?"
    )
    .bind(data.telegramId)
    .first();


  if (existing) {
    return Response.json(existing, {
      headers: corsHeaders
    });
  }


  await env.DB
    .prepare(`
      INSERT INTO users
      (
        telegramId,
        username,
        profilePhoto,
        coinBalance,
        gramBalance,
        referredBy,
        verifiedReferrals,
        blocked,
        createdAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      data.telegramId,
      data.username || "Telegram User",
      data.photoUrl || "",
      0,
      0,
      data.referrerId || null,
      0,
      0,
      new Date().toISOString()
    )
    .run();


  const user = await env.DB
    .prepare(
      "SELECT * FROM users WHERE telegramId = ?"
    )
    .bind(data.telegramId)
    .first();


  return Response.json(user, {
    headers: corsHeaders
  });

}
// Get User
if (url.pathname.startsWith("/api/users/") && request.method === "GET") {

  const telegramId = url.pathname.split("/")[3];

  const user = await env.DB
    .prepare(
      "SELECT * FROM users WHERE telegramId = ?"
    )
    .bind(telegramId)
    .first();

  if (!user) {
    return Response.json(
      { error: "User not found" },
      { status: 404, headers: corsHeaders }
    );
  }

  return Response.json(
    user,
    { headers: corsHeaders }
  );
}
    return Response.json(
      {
        error: "Route not found",
        path: url.pathname
      },
      {
        status: 404,
        headers: corsHeaders
      }
    );

  }
};
