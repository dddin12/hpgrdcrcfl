import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SYSTEM_PROMPT = `You are a senior industrial R&D safety investigator producing an audit-ready Root Cause Failure Analysis (RCFA) intended for working lab engineers and HSE staff. Write plainly, technically, and practically — no fluff, no generic safety platitudes.

ABSOLUTE GROUNDING RULES:
- Ground every section strictly in the supplied investigation fields and SOP/manual excerpts.
- NEVER invent equipment models, people, timestamps, chemicals, instrument numbers, lab names, or document IDs that are not explicitly present in the input.
- If a fact is not supplied, mark it explicitly under "assumptions" (e.g. "Operator certification status not provided").
- Reflect the user's actual incident type, equipment, lab, operator, severity, description, and immediate response in every section.

DOCUMENT CITATION RULES (CRITICAL):
- SOP/manual excerpts are provided as "[<document name>] page <n>: <text>" (or "section <n>" for non-paginated docs).
- Whenever a deviation, missing step, procedural gap, negligence, or barrier failure is identified, you MUST cite the source inline using the exact format: "<document name>, p.<n>" (or "section <n>"). Example: "Operator did not perform the warm-up checklist (SOP-DYNO-003, p.4)."
- Cite the page only when that page actually supports the finding. Do not fabricate page numbers. If no SOP excerpt supports a finding, write "(no SOP reference available)" — do not guess.
- Populate the references[] array with every page you cite: { source, page, quote (short — 1 short sentence from that page), relevance }.
- Populate procedureGaps[] with concrete missed/violated steps, each with a sopCitation in the same format.

TECHNICAL RULES:
- Be technical, specific, concise. Focus on: incident sequence, deviation from intended state, failed/missing barriers, procedural gaps, human factors, physical causes, system weaknesses.
- 5 Whys: at least 5 levels of logically chained reasoning. First "why" must restate the actual observed failure.
- Fishbone uses the 6M categories. Each category should contain at least one cause specific to the equipment named in the input.
- Corrective and preventive actions must be practical, equipment-specific, and actionable for a working lab (calibration intervals, interlocks, PM checks, training, design changes). Add sopCitation when an action restores compliance with a specific SOP page.
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
          sopCitation: { type: 'string' },
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
          sopCitation: { type: 'string' },
        },
        required: ['description'],
      },
    },
    lessonsLearned: { type: 'array', items: { type: 'string' } },
    assumptions: { type: 'array', items: { type: 'string' } },
    procedureGaps: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          issue: { type: 'string' },
          sopCitation: { type: 'string' },
        },
        required: ['issue', 'sopCitation'],
      },
    },
    references: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          source: { type: 'string' },
          page: { type: 'string' },
          quote: { type: 'string' },
          relevance: { type: 'string' },
        },
        required: ['source', 'page', 'relevance'],
      },
    },
  },
  required: [
    'incidentSummary', 'chronology', 'immediateCause', 'fiveWhys',
    'fishbone', 'keyFactors', 'barriers', 'riskAssessment',
    'correctiveActions', 'preventiveActions', 'lessonsLearned',
  ],
};

function formatSopBlock(sopExcerpts: any[]): string {
  if (!sopExcerpts.length) return '\n\n(No SOP / manual provided. Do not invent citations — set procedureGaps and references to empty arrays.)';
  const parts: string[] = [];
  for (const s of sopExcerpts) {
    const name = String(s?.name || 'document').slice(0, 160);
    const pages = Array.isArray(s?.pages) ? s.pages : [];
    for (const p of pages) {
      const label = typeof p?.page === 'number' ? `page ${p.page}` : String(p?.page || 'section');
      const text = String(p?.text || '').slice(0, 1200);
      if (text) parts.push(`[${name}] ${label}: ${text}`);
    }
  }
  return '\n\nSOP / MANUAL EXCERPTS (cite using "<document name>, p.<n>" or "<document name>, section <n>"):\n' + parts.join('\n\n');
}

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
    const sopBlock = formatSopBlock(sopExcerpts);

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
      immediateCause: investigation.immeditateCause,
      contributingCauses: investigation.contributingCauses,
      rootCauseHypothesis: investigation.rootCause,
      existingCorrectiveActions: investigation.correctiveActions,
      riskScore: investigation.riskScore,
    }, null, 2)}${sopBlock}\n\nProduce the RCFA report by calling emit_rcfa_report. Cite SOP/manual pages exactly as instructed. Do not invent any fact.`;

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMsg },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'emit_rcfa_report',
            description: 'Emit the structured 11-section RCFA report with SOP citations.',
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
