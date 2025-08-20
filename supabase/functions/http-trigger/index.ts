import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`HTTP Trigger received ${req.method} request`);
    
    // Get request data
    const requestData = {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
      body: req.method !== 'GET' ? await req.text() : null,
      timestamp: new Date().toISOString(),
    };

    // Parse JSON body if content-type is application/json
    if (requestData.body && req.headers.get('content-type')?.includes('application/json')) {
      try {
        requestData.body = JSON.parse(requestData.body);
      } catch (e) {
        console.log('Failed to parse JSON body:', e);
      }
    }

    console.log('Request data:', requestData);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'HTTP trigger executed successfully',
        data: requestData,
        triggerNodeId: req.url.split('triggerNodeId=')[1]?.split('&')[0] || 'unknown'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('HTTP trigger error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})