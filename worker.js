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
// Verify AdsGram Task
if (url.pathname === "/api/verify-adsgram-task" && request.method === "POST") {

  const data = await request.json();

  const telegramId = data.telegramId;
  const blockId = data.blockId;

  if (!telegramId || !blockId) {
    return Response.json(
      {
        success:false,
        message:"Missing data"
      },
      {
        headers:corsHeaders
      }
    );
  }


  // Check user exists
  const user = await env.DB
    .prepare(
      "SELECT * FROM users WHERE telegramId = ?"
    )
    .bind(telegramId)
    .first();


  if (!user) {
    return Response.json(
      {
        success:false,
        message:"User not found"
      },
      {
        headers:corsHeaders
      }
    );
  }


  const reward = 3000;


  await env.DB
    .prepare(
      `
      UPDATE users
      SET 
      coinBalance = coinBalance + ?
      WHERE telegramId = ?
      `
    )
    .bind(
      reward,
      telegramId
    )
    .run();


  return Response.json(
    {
      success:true,
      reward:reward,
      blockId:blockId
    },
    {
      headers:corsHeaders
    }
  );
}
// Get Notifications
if (url.pathname === "/api/notifications" && request.method === "GET") {

  const telegramId = url.searchParams.get("telegramId");

  const result = await env.DB
    .prepare(`
      SELECT *
      FROM notifications
      WHERE recipientId = ? OR recipientId = 'all'
      ORDER BY timestamp DESC
    `)
    .bind(telegramId)
    .all();

  return Response.json(result.results, {
    headers: corsHeaders
  });

}
// Get Settings
if (url.pathname === "/api/settings" && request.method === "GET") {

  const settings = await env.DB
    .prepare(
      "SELECT data FROM settings WHERE id='main'"
    )
    .first();

  return Response.json(
    JSON.parse(settings.data),
    {
      headers:corsHeaders
    }
  );

}
// Get Referrals
if (url.pathname === "/api/referrals" && request.method === "GET") {

  const telegramId = url.searchParams.get("telegramId");

  const referrals = await env.DB
    .prepare(`
      SELECT telegramId, username, createdAt
      FROM users
      WHERE referredBy = ?
    `)
    .bind(telegramId)
    .all();


  return Response.json(
    {
      totalReferrals: referrals.results.length,
      pendingReferrals: 0,
      verifiedReferrals: 0,
      referralEarnings: 0,
      referralsList: referrals.results.map(user => ({
        telegramId: user.telegramId,
        username: user.username,
        status: "pending",
        date: user.createdAt
      }))
    },
    {
      headers:corsHeaders
    }
  );

}
// Get Withdrawal History
if (url.pathname === "/api/wallet/withdraw-history" && request.method === "GET") {

  try {

    return Response.json(
      {
        success: true
      },
      {
        headers: corsHeaders
      }
    );

  } catch (error) {

    return Response.json(
      {
        error: String(error)
      },
      {
        status: 500,
        headers: corsHeaders
      }
    );

  }

}
    // Leaderboard
if (url.pathname === "/api/leaderboard" && request.method === "GET") {

  const users = await env.DB
    .prepare(`
      SELECT
        username,
        verifiedReferrals
      FROM users
      ORDER BY verifiedReferrals DESC
      LIMIT 10
    `)
    .all();

  const leaderboard = users.results.map((user, index) => ({
    rank: index + 1,
    username: user.username,
    verifiedReferrals: user.verifiedReferrals,
    rewardText:
      index === 0 ? "25 Gram" :
      index === 1 ? "15 Gram" :
      index === 2 ? "10 Gram" :
      index === 3 ? "5 Gram" :
      index === 4 ? "4 Gram" :
      index === 5 ? "3 Gram" :
      index === 6 ? "2 Gram" :
      index === 7 ? "1.5 Gram" :
      index === 8 ? "1 Gram" :
      "0.5 Gram"
  }));

  return Response.json(leaderboard, {
    headers: corsHeaders
  });

}

    // Get Spin History
if (url.pathname === "/api/spin/history" && request.method === "GET") {

  const telegramId = url.searchParams.get("telegramId");

  const spins = await env.DB
    .prepare(
      "SELECT * FROM spin_history WHERE telegramId = ? ORDER BY createdAt DESC"
    )
    .bind(telegramId)
    .all();

  return Response.json(
    {
      history: spins.results || [],
      spinsUsed: (spins.results || []).length,
      remainingSpins: Math.max(0, 10 - (spins.results || []).length)
    },
    {
      headers: corsHeaders
    }
  );

}
// Save Spin Wheel History
if (url.pathname === "/api/spin/save" && request.method === "POST") {

  const data = await request.json();

  await env.DB
    .prepare(`
      INSERT INTO spin_history
      (
        id,
        telegramId,
        reward,
        createdAt
      )
      VALUES (?, ?, ?, ?)
    `)
    .bind(
      crypto.randomUUID(),
      data.telegramId,
      data.reward,
      new Date().toISOString()
    )
    .run();


  await env.DB
    .prepare(`
      UPDATE users
      SET coinBalance = coinBalance + ?
      WHERE telegramId = ?
    `)
    .bind(
      data.reward,
      data.telegramId
    )
    .run();


  return Response.json(
    {
      success:true,
      reward:data.reward
    },
    {
      headers:corsHeaders
    }
  );

}
    // Register Spin
if (url.pathname === "/api/spin/register" && request.method === "POST") {

  const data = await request.json();

  return Response.json(
    {
      success:true,
      spinId:data.spinId,
      reward:data.reward
    },
    {
      headers:corsHeaders
    }
  );

}
   // Convert Coins to Gram
if (url.pathname === "/api/convert" && request.method === "POST") {

  const data = await request.json();

  const telegramId = data.telegramId;
  const coins = Number(data.coins);

  if (!telegramId || !coins) {
    return Response.json(
      {
        success:false,
        message:"Missing data"
      },
      {
        headers:corsHeaders
      }
    );
  }


  const user = await env.DB
    .prepare(
      "SELECT * FROM users WHERE telegramId = ?"
    )
    .bind(telegramId)
    .first();


  if (!user) {
    return Response.json(
      {
        success:false,
        message:"User not found"
      },
      {
        headers:corsHeaders
      }
    );
  }


  if (user.coinBalance < coins) {
    return Response.json(
      {
        success:false,
        message:"Not enough coins"
      },
      {
        headers:corsHeaders
      }
    );
  }


  const grams = coins / 1000000;


  await env.DB
    .prepare(`
      UPDATE users
      SET
      coinBalance = coinBalance - ?,
      gramBalance = gramBalance + ?
      WHERE telegramId = ?
    `)
    .bind(
      coins,
      grams,
      telegramId
    )
    .run();


  return Response.json(
    {
      success:true,
      coinsDeduced:coins,
      gramsAdded:grams
    },
    {
      headers:corsHeaders
    }
  );

} 
    // Withdraw Gram
if (url.pathname === "/api/wallet/withdraw" && request.method === "POST") {

  const data = await request.json();

  const telegramId = data.telegramId;
  const amount = Number(data.amount);
  const walletAddress = data.walletAddress;


  const user = await env.DB
    .prepare(
      "SELECT * FROM users WHERE telegramId = ?"
    )
    .bind(telegramId)
    .first();


  if (!user) {
    return Response.json(
      {
        success:false,
        message:"User not found"
      },
      {
        headers:corsHeaders
      }
    );
  }


  if (user.gramBalance < amount) {
    return Response.json(
      {
        success:false,
        message:"Not enough Gram"
      },
      {
        headers:corsHeaders
      }
    );
  }


  const fee = amount * 0.10;
  const netAmount = amount - fee;


  const id = crypto.randomUUID();


  await env.DB
    .prepare(`
      INSERT INTO withdrawals
      (
        id,
        userId,
        username,
        amount,
        fee,
        netAmount,
        tonAddress,
        status,
        createdAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      id,
      telegramId,
      user.username,
      amount,
      fee,
      netAmount,
      walletAddress,
      "pending",
      new Date().toISOString()
    )
    .run();


  await env.DB
    .prepare(`
      UPDATE users
      SET gramBalance = gramBalance - ?
      WHERE telegramId = ?
    `)
    .bind(
      amount,
      telegramId
    )
    .run();


  return Response.json(
    {
      success:true,
      withdrawal:{
        id,
        amount,
        fee,
        netAmount,
        status:"pending"
      }
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
