import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SYSTEM_PROMPT = `You are a senior oil & gas R&D safety investigator producing an audit-ready Root Cause Failure Analysis (RCFA).

STRICT RULES:
- Be technical, specific, and concise. No generic safety advice. No filler.
- Do NOT invent equipment details, model numbers, timestamps, or people. If a fact is not supplied, list it under "assumptions".
- Focus on incident sequence, deviation from intended state, failed/missing barriers, procedural gaps, human factors, physical causes, and system weaknesses.
- 5 Whys must contain at least 5 levels of logically chained reasoning (each "because" becomes the subject of the next "why").
- Fishbone uses the 6M categories (Man, Machine, Method, Material, Measurement, Environment).
- Separate Key Factors into Human / System / Physical / Organizational.
- Barrier analysis must split into existing, failed, and missing safeguards.
- If SOP/manual excerpts are provided, use them ONLY to identify procedural deviations, missing checks, and named safeguards. Do not summarize the SOP. Do not quote verbatim long passages.
- Recommendations must be practical for R&D laboratories, pilot plants, chemical/analytical/engine/battery test facilities.
- Tone: professional, audit-ready.
- Emit the report by calling the emit_rcfa_report tool exactly once. Do not return prose.`;

const REPORT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    incidentSummary: { type: 'string' },
    chronology: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: { time: { type: 'string' }, event: { type: 'string' } },
        required: ['event'],
      },
    },
    immediateCause: { type: 'string' },
    fiveWhys: {
      type: 'array',
      minItems: 5,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: { why: { type: 'string' }, because: { type: 'string' } },
        required: ['why', 'because'],
      },
    },
    fishbone: {
      type: 'object',
      additionalProperties: false,
      properties: {
        man: { type: 'array', items: { type: 'string' } },
        machine: { type: 'array', items: { type: 'string' } },
        method: { type: 'array', items: { type: 'string' } },
        material: { type: 'array', items: { type: 'string' } },
        measurement: { type: 'array', items: { type: 'string' } },
        environment: { type: 'array', items: { type: 'string' } },
      },
      required: ['man', 'machine', 'method', 'material', 'measurement', 'environment'],
    },
    keyFactors: {
      type: 'object',
      additionalProperties: false,
      properties: {
        human: { type: 'array', items: { type: 'string' } },
        system: { type: 'array', items: { type: 'string' } },
        physical: { type: 'array', items: { type: 'string' } },
        organizational: { type: 'array', items: { type: 'string' } },
      },
      required: ['human', 'system', 'physical', 'organizational'],
    },
    barriers: {
      type: 'object',
      additionalProperties: false,
      properties: {
        existing: { type: 'array', items: { type: 'string' } },
        failed: { type: 'array', items: { type: 'string' } },
        missing: { type: 'array', items: { type: 'string' } },
      },
      required: ['existing', 'failed', 'missing'],
    },
    riskAssessment: {
      type: 'object',
      additionalProperties: false,
      properties: {
        severity: { type: 'string' },
        likelihood: { type: 'string' },
        escalation: { type: 'string' },
      },
      required: ['severity', 'likelihood', 'escalation'],
    },
    correctiveActions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          description: { type: 'string' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
          owner: { type: 'string' },
          dueWindow: { type: 'string' },
        },
        required: ['description'],
      },
    },
    preventiveActions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          description: { type: 'string' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
          owner: { type: 'string' },
          dueWindow: { type: 'string' },
        },
        required: ['description'],
      },
    },
    lessonsLearned: { type: 'array', items: { type: 'string' } },
    assumptions: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'incidentSummary', 'chronology', 'immediateCause', 'fiveWhys',
    'fishbone', 'keyFactors', 'barriers', 'riskAssessment',
    'correctiveActions', 'preventiveActions', 'lessonsLearned',
  ],
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || !body.investigation) {
      return new Response(JSON.stringify({ error: 'Invalid body: investigation required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const investigation = body.investigation;
    const sopExcerpts = Array.isArray(body.sopExcerpts) ? body.sopExcerpts.slice(0, 3) : [];

    const sopBlock = sopExcerpts.length
      ? '\n\nSOP / MANUAL EXCERPTS (use only for procedural-deviation analysis):\n' +
        sopExcerpts.map((s: any) => `--- ${String(s.name).slice(0, 120)} ---\n${String(s.text).slice(0, 8000)}`).join('\n\n')
      : '\n\n(No SOP/manual provided.)';

    const userMsg = `INVESTIGATION DATA (JSON):\n${JSON.stringify({
      id: investigation.id,
      labName: investigation.labName,
      equipment: investigation.equipment,
      incidentType: investigation.incidentType,
      severity: investigation.severity,
      operator: investigation.operator,
      dateTime: investigation.dateTime,
      description: investigation.description,
      immediateResponse: investigation.immediateResponse,
      riskScore: investigation.riskScore,
    }, null, 2)}${sopBlock}\n\nProduce the RCFA report by calling emit_rcfa_report.`;

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMsg },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'emit_rcfa_report',
            description: 'Emit the structured 11-section RCFA report.',
            parameters: REPORT_SCHEMA,
          },
        }],
        tool_choice: { type: 'function', function: { name: 'emit_rcfa_report' } },
      }),
    });

    if (aiResp.status === 429) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (aiResp.status === 402) {
      return new Response(JSON.stringify({ error: 'AI credits exhausted. Add credits in Settings > Workspace > Usage.' }), {
        status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error('AI gateway error', aiResp.status, t);
      return new Response(JSON.stringify({ error: `AI gateway error (${aiResp.status})` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await aiResp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = toolCall?.function?.arguments;
    if (!argsStr) {
      console.error('No tool call in response', JSON.stringify(data).slice(0, 500));
      return new Response(JSON.stringify({ error: 'AI returned no structured report' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    let report: any;
    try {
      report = JSON.parse(argsStr);
    } catch {
      return new Response(JSON.stringify({ error: 'AI returned malformed JSON' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    report.generatedBy = 'ai';

    return new Response(JSON.stringify({ report }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('generate-rcfa error', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});