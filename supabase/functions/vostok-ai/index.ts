import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function resolveGeminiKey(): Promise<string> {
  const envKey = Deno.env.get('GEMINI_API_KEY')?.trim();
  if (envKey) return envKey;

  const sbUrl = Deno.env.get('SUPABASE_URL') || '';
  const sbServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (sbUrl && sbServiceKey) {
    const sb = createClient(sbUrl, sbServiceKey);
    const { data } = await sb.from('vostok_secrets').select('val').eq('key', 'GEMINI_API_KEY').single();
    if (data?.val) return String(data.val).trim();
  }
  return '';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = await resolveGeminiKey();
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Секрет GEMINI_API_KEY не найден в Supabase' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { systemPrompt, history } = await req.json();

    const payload = {
      systemInstruction: { parts: [{ text: systemPrompt || '' }] },
      contents: history || [],
      generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
    };

    const encodedKey = encodeURIComponent(apiKey);
    const models = [
      'gemini-3.1-flash-lite',
      'gemini-3-flash-preview',
      'gemini-flash-lite-latest',
      'gemini-3.8-flash',
      'gemini-3.5-flash-lite',
      'gemma-4-26b-a4b-it'
    ];
    const endpoints = models.map(
      (m) => `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodedKey}`
    );

    const errors: string[] = [];

    for (const url of endpoints) {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        errors.push(data?.error?.message || `HTTP ${res.status}`);
        continue;
      }

      const reply = data?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text || '')
        .join('')
        .trim();

      if (reply) {
        return new Response(
          JSON.stringify({ reply }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      errors.push('Модель вернула пустой ответ');
    }

    return new Response(
      JSON.stringify({ error: errors.join(' | ') }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
