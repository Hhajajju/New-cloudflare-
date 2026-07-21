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

  try {
    const telegramId = url.pathname.split("/")[3];

    const user = await env.DB
      .prepare("SELECT * FROM users WHERE telegramId = ?")
      .bind(telegramId)
      .first();

    if (!user) {
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return Response.json(user);

  } catch (error) {

    return Response.json(
      {
        error: "Database error",
        details: error.message
      },
      { status: 500 }
    );

  }
}
// Get User Notifications
if (url.pathname === "/api/notifications" && request.method === "GET") {

  const telegramId = url.searchParams.get("telegramId");

  const notifications = await env.DB
    .prepare(
      "SELECT * FROM notifications WHERE recipientId = ? OR recipientId = 'all' ORDER BY timestamp DESC"
    )
    .bind(telegramId)
    .all();

  return Response.json(
    notifications.results,
    {
      headers: corsHeaders
    }
  );
}

    // Get User Notifications
if (url.pathname === "/api/notifications" && request.method === "GET") {

  const telegramId = url.searchParams.get("telegramId");

  const result = await env.DB
    .prepare(
      "SELECT * FROM notifications WHERE recipientId = ? OR recipientId = 'all' ORDER BY timestamp DESC"
    )
    .bind(telegramId)
    .all();

  return Response.json(
    result.results,
    {
      headers: corsHeaders
    }
  );
}
    // Admin Send Notification
if (url.pathname === "/api/admin/notifications" && request.method === "POST") {

  const data = await request.json();

  let recipientName = "All Users";

  if (data.telegramId) {
    const user = await env.DB
      .prepare(
        "SELECT username FROM users WHERE telegramId = ?"
      )
      .bind(data.telegramId)
      .first();

    if (user) {
      recipientName = user.username;
    }
  }

  await env.DB
    .prepare(`
      INSERT INTO notifications
      (
        id,
        recipientId,
        recipientName,
        message,
        timestamp
      )
      VALUES (?, ?, ?, ?, ?)
    `)
    .bind(
      crypto.randomUUID(),
      data.telegramId || "all",
      recipientName,
      data.message,
      new Date().toISOString()
    )
    .run();

  return Response.json(
    {
      success: true
    },
    {
      headers: corsHeaders
    }
  );
}
    // Get Tasks
if (url.pathname === "/api/tasks" && request.method === "GET") {

  const tasks = await env.DB
    .prepare(
      "SELECT * FROM tasks WHERE active = 1"
    )
    .all();

  return Response.json(
    tasks.results,
    {
      headers: corsHeaders
    }
  );
}
// Verify Task
if (url.pathname === "/api/tasks/verify" && request.method === "POST") {

  const data = await request.json();

  const task = await env.DB
    .prepare(
      "SELECT * FROM tasks WHERE taskId = ?"
    )
    .bind(data.taskId)
    .first();

  if (!task) {
    return Response.json(
      {
        success:false,
        message:"Task not found"
      },
      {
        headers:corsHeaders
      }
    );
  }

  await env.DB
    .prepare(
      "UPDATE users SET coinBalance = coinBalance + ? WHERE telegramId = ?"
    )
    .bind(
      task.reward,
      data.telegramId
    )
    .run();

  return Response.json(
    {
      success:true,
      reward:task.reward
    },
    {
      headers:corsHeaders
    }
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
