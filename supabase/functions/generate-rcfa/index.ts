import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SYSTEMS = [
  'Communication and Training',
  'Management of Change',
  'Incident Investigation/Communication',
  'Observations and Audits',
  'Planning & Emergency Response',
  'Contractors Management',
  'Quality Assurance',
  'Mechanical Integrity',
  'Pre-Start Up Safety Inspection',
  'Process Technology',
  'Risk Analysis',
  'Safe Work Practices, SOP, SMP',
  'Safety Leadership',
];

const SYSTEM_PROMPT = `You are an experienced HPGRDC Incident Investigation Committee member analysing an R&D lab incident. Produce ONLY the four AI-generated sections of the HPGRDC Incident Investigation Report. Write in a concise, factual, engineering-investigation style — like a real HPGRDC committee, not a chatbot, consultant, or essayist.

ABSOLUTE GROUNDING RULES
- Ground EVERY output strictly in the user-entered investigation fields and the attached SOP / manual excerpts.
- NEVER invent names, dates, equipment models, chemicals, instrument tags, departments, or events that are not present in the input. If a fact is missing, leave the field blank or write a single short phrase like "Not provided".
- Do not summarise the user's narrative back at them. Do not add safety platitudes. No generic language.

OUTPUT SECTIONS
1. whyTree — concise cascading cause analysis matching HPGRDC WHY Tree style.
   - effect: the observed failure, 1 short line.
   - cause: { primary, secondary } — direct causes, 1 short line each (secondary optional).
   - why: 1-3 short items, each one short line — first-level "why" reasons.
   - deeper: 1-3 short items — next level (deeper mechanisms).
   - rootWeakness: 1-3 short items — root system/equipment weaknesses.
   No essays. Each node = a short engineering phrase.

2. keyFactors — short, incident-specific factual bullets. Each bullet 1 line.
   - system: weaknesses in management systems / engineering controls.
   - human: operator action / training / behaviour factors.
   - physical: physical equipment / material / environment factors.
   If a category truly has nothing, return an empty array (renderer prints "Nil").

3. systemsToReinforce — only include systems with a real, concrete, lab-actionable deficiency grounded in this incident. Use EXACT names from the fixed 13-system list (verbatim):
${SYSTEMS.map((s, i) => `   ${i + 1}. ${s}`).join('\n')}
   Do not invent, rename, reorder, add or remove. Omit systems with no specific deficiency — do not return blanks or "N/A".

4. recommendations — practical, low-complexity HPGRDC committee actions only.
   PREFER: SOP updates, checklist additions, retraining, supervision/counselling, poka-yoke (physical foolproofing), procedural controls, verification steps, visual indicators, periodic maintenance checks, simple mechanical safeguards.
   STRICTLY AVOID unless severity is FATAL or LWC and clearly demands it: IoT, AI monitoring, digital twins, predictive analytics, advanced automation, expensive instrumentation, interlocks, smart sensors.
   Each item: short recommendation, plausible responsibility (use a person/role only if it appears in the input; otherwise leave blank), targetDate (leave blank if not derivable), verifiedBy (leave blank if not derivable).

Call emit_report once. Do not return prose.`;

const REPORT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    whyTree: {
      type: 'object',
      additionalProperties: false,
      properties: {
        effect: { type: 'string' },
        cause: {
          type: 'object',
          additionalProperties: false,
          properties: { primary: { type: 'string' }, secondary: { type: 'string' } },
          required: ['primary'],
        },
        why: { type: 'array', items: { type: 'string' } },
        deeper: { type: 'array', items: { type: 'string' } },
        rootWeakness: { type: 'array', items: { type: 'string' } },
      },
      required: ['effect', 'cause', 'why', 'deeper', 'rootWeakness'],
    },
    keyFactors: {
      type: 'object',
      additionalProperties: false,
      properties: {
        system: { type: 'array', items: { type: 'string' } },
        human: { type: 'array', items: { type: 'string' } },
        physical: { type: 'array', items: { type: 'string' } },
      },
      required: ['system', 'human', 'physical'],
    },
    systemsToReinforce: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: { system: { type: 'string' }, deficiency: { type: 'string' } },
        required: ['system', 'deficiency'],
      },
    },
    recommendations: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          recommendation: { type: 'string' },
          responsibility: { type: 'string' },
          targetDate: { type: 'string' },
          verifiedBy: { type: 'string' },
        },
        required: ['recommendation'],
      },
    },
  },
  required: ['whyTree', 'keyFactors', 'systemsToReinforce', 'recommendations'],
};

function formatSopBlock(sopExcerpts: any[]): string {
  if (!sopExcerpts.length) return '\n\n(No SOP / manual attached — do not invent citations.)';
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
  return '\n\nATTACHED SOP / MANUAL EXCERPTS:\n' + parts.join('\n\n');
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

    const inv = body.investigation;
    const sopExcerpts = Array.isArray(body.sopExcerpts) ? body.sopExcerpts.slice(0, 3) : [];
    const deepReview = !!body.deepReview;
    const model = deepReview ? 'google/gemini-2.5-pro' : 'google/gemini-2.5-flash';

    const userMsg = `INVESTIGATION DATA (JSON):
${JSON.stringify({
  id: inv.id,
  incidentTitle: inv.incidentTitle,
  classification: inv.classification,
  location: inv.location,
  dateOfIncident: inv.dateOfIncident,
  timeOfIncident: inv.timeOfIncident,
  numbers: inv.numbers,
  injured: inv.injured,
  injuredName: inv.injuredName,
  ageSex: inv.ageSex,
  ticketDept: inv.ticketDept,
  companyContractor: inv.companyContractor,
  natureOfInjury: inv.natureOfInjury,
  reportedBy: inv.reportedBy,
  recordsReviewed: inv.recordsReviewed,
  personsInteracted: inv.personsInteracted,
  priorSimilar: inv.priorSimilar,
  summary: inv.summary,
  chronology: inv.chronology,
  facts: inv.facts,
}, null, 2)}${formatSopBlock(sopExcerpts)}

Call emit_report once with the four AI sections. Stay strictly grounded in the above. Match HPGRDC investigation tone — concise, factual, practical.`;

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMsg },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'emit_report',
            description: 'Emit the four HPGRDC AI sections.',
            parameters: REPORT_SCHEMA,
          },
        }],
        tool_choice: { type: 'function', function: { name: 'emit_report' } },
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
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) {
      console.error('No tool call', JSON.stringify(data).slice(0, 500));
      return new Response(JSON.stringify({ error: 'AI returned no structured report' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    let report: any;
    try { report = JSON.parse(args); } catch {
      return new Response(JSON.stringify({ error: 'AI returned malformed JSON' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    report.model = deepReview ? 'pro' : 'flash';

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
