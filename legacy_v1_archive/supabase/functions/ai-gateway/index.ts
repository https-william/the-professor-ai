
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";

console.log("AI Gateway Online v3 (Hydra Max)");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Auth & Context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Access Control (Get Tier)
    // Try Service Role first, fallback to Anon (might fail if RLS is strict on 'profiles')
    const adminKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
    const dbClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        adminKey ?? ''
    );
    
    const { data: profile } = await dbClient
        .from('profiles')
        .select('subscription_tier, credits')
        .eq('id', user.id)
        .single();
    
    const tier = profile?.subscription_tier || 'Fresher';
    console.log(`User: ${user.email} | Tier: ${tier}`);

    // 3. Parse Request
    const { messages, systemInstruction, jsonMode } = await req.json();

    let aiResponse = "";
    
    // --- HYDRA STRATEGY (Backend) ---
    // Architecture:
    // 1. Primary: Google Gemini 1.5 (Pro for Paid, Flash for Free)
    // 2. Fallback A: Groq (Llama 3 70b) - Speed / Logic
    // 3. Fallback B: DeepSeek V3 - High IQ / Code / Math (Optimized for Cost)
    // 4. Fallback C: Mistral / Claude Instant (via OpenRouter) - Reliability

    try {
        const geminiKey = Deno.env.get('GEMINI_API_KEY');
        if (geminiKey) {
            const genAI = new GoogleGenerativeAI(geminiKey);
            
            // TIER LOGIC
            // Excellentia/Scholar: Uses Pro (Better Reasoning)
            // Fresher: Uses Flash (Speed/Efficiency)
            let modelName = (tier === 'Excellentia' || tier === 'Scholar') ? 'gemini-1.5-pro' : 'gemini-1.5-flash';
            
            // CONTEXT OVERRIDE
            // If the user requests "Oracle" mode (usually passed via system prompt or specific header), force Pro.
            // If the task is simple (Motivational Quote), force Flash to save costs regardless of tier.
            const isSimpleTask = messages.length === 1 && messages[0].content.length < 50;
            if (isSimpleTask) modelName = 'gemini-1.5-flash';

            console.log(`Hydra Routing: Selected ${modelName} for ${tier} user.`);

            const model = genAI.getGenerativeModel({ 
                model: modelName,
                systemInstruction: systemInstruction,
                generationConfig: {
                    responseMimeType: jsonMode ? "application/json" : "text/plain",
                    temperature: 0.7
                }
            });
            
            // Simplified History Conversion
            const lastMsg = messages[messages.length - 1];
            const history = messages.slice(0, -1).map((m: any) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }] 
            }));

            const result = await model.generateContent({
                contents: [...history, { role: 'user', parts: [{ text: lastMsg.content }] }]
            });
            
            aiResponse = result.response.text();
            
        } else {
            throw new Error("Gemini Config Missing");
        }

    } catch (geminiError) {
         console.warn("Primary Core (Gemini) Failed. Rerouting to Secondary Nodes...", geminiError);
         
         const callProvider = async (url: string, key: string, model: string, bodyObj: any) => {
             const resp = await fetch(url, {
                 method: "POST",
                 headers: {
                     "Authorization": `Bearer ${key}`,
                     "Content-Type": "application/json"
                 },
                 body: JSON.stringify(bodyObj)
             });
             if (!resp.ok) {
                 const errText = await resp.text();
                 throw new Error(`Provider Error ${resp.status}: ${errText}`);
             }
             const data = await resp.json();
             return data.choices?.[0]?.message?.content || "";
         };

         const payloadMsgs = systemInstruction 
            ? [{ role: "system", content: systemInstruction }, ...messages]
            : messages;

         // Fallback 1: DeepSeek (Cost/Performance King)
         // Replacing Groq as primary fallback due to superior reasoning capabilities in V3
         try {
             const key = Deno.env.get('DEEPSEEK_API_KEY');
             if (key) {
                 console.log("Routing to DeepSeek V3...");
                 aiResponse = await callProvider(
                     "https://api.deepseek.com/chat/completions",
                     key,
                     "deepseek-chat",
                     {
                        model: "deepseek-chat",
                        messages: payloadMsgs,
                        response_format: jsonMode ? { type: "json_object" } : undefined
                     }
                 );
             } else throw new Error("No DeepSeek Key");
         } catch (deepseekError) {
             console.warn("DeepSeek Node Unstable. Engaging Groq LPU...");

             // Fallback 2: Groq (Llama 3)
             try {
                 const key = Deno.env.get('GROQ_API_KEY');
                 if (key) {
                     aiResponse = await callProvider(
                         "https://api.groq.com/openai/v1/chat/completions",
                         key,
                         "llama-3.3-70b-versatile",
                         {
                            model: "llama-3.3-70b-versatile",
                            messages: payloadMsgs,
                            response_format: jsonMode ? { type: "json_object" } : undefined
                         }
                     );
                 } else throw new Error("No Groq Key");
             } catch (groqError) {
                  console.warn("Groq LPU Offline. Engaging backup relays (OpenRouter)...");
                  
                  // Fallback 3: OpenRouter (The "Hail Mary" - access to Claude/Mistral)
                  try {
                      const key = Deno.env.get('OPENROUTER_API_KEY');
                      if (key) {
                          // If we are here, major systems are down. Use a reliable mid-tier model.
                          const orModel = 'mistralai/mistral-small-24b-instruct-2501'; 
                          aiResponse = await callProvider(
                              "https://openrouter.ai/api/v1/chat/completions",
                              key,
                              orModel,
                              {
                                 model: orModel,
                                 messages: payloadMsgs
                              }
                          );
                      } else throw new Error("No OpenRouter Key");
                  } catch (finalError) {
                      aiResponse = "System Critical: All Neural Links Severed. Please check network.";
                  }
             }
         }
    }

    return new Response(JSON.stringify({ data: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Gateway Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
