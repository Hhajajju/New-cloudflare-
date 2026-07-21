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
