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

const FORBIDDEN_TERMS = [
  'scada','mfc','syringe pump','interlock','iot','smart sensor','predictive analytics',
  'predictive maintenance','automation','digital twin','ai monitoring','plc upgrade',
  'machine learning','neural network',
];

const BLAME_REGEX = /\b(negligence|incompetence|carelessly|careless|misconduct|operator fault|at fault|operator['’]s fault)\b/gi;
const CERTAINTY_REGEX = /\b(confirmed root cause|definitively|definitely caused|proves that|clearly caused|conclusively)\b/gi;
const BANNED_VERBS = /\b(improve|improving|enhance|enhancing|optimize|optimizing|optimise|consider|considering|explore|exploring)\b/gi;

const QUESTIONS_SYSTEM_PROMPT = `You are an HPGRDC Incident Investigation assistant in QUESTION mode. You DO NOT draw conclusions, you DO NOT propose causes, you DO NOT propose recommendations. Your only job is to help the investigator by:
1. Producing 6–12 SPECIFIC investigation questions grounded in the user-entered facts, the attached SOP/manual excerpts (and the extracted controls list when present), and photo names.
2. Producing UP TO 5 "Missing checks" — short, concrete evidence the investigator should still verify, framed as "To verify: …".

ABSOLUTE GROUNDING (highest priority):
- Use ONLY what is present in user inputs, SOP/manual excerpts, or photo names. Never invent equipment, instruments, control systems, or procedures.
- FORBIDDEN unless the exact term appears in inputs: SCADA, MFC, syringe pump, interlock, IoT, smart sensor, predictive analytics, predictive maintenance, automation, digital twin, AI monitoring, machine learning, sensor failure.
- Never ask generic questions like "Was the SOP followed?", "Were safety procedures observed?", "Was the equipment inspected?", "Was training given?", "Did the operator follow procedure?". Reference the SPECIFIC SOP step, manual limit, photo detail, or chronology fact.
- Good example: "Was the fuel line pressure verified at ≥ 0.7 bar before powering ON the FCU pump, per the SOP startup check?"
- Bad example: "Was the SOP followed during startup?" — too generic, drop it.
- Each question must include:
   - "why": one short line explaining why the question matters for this investigation.
   - "evidenceSource": EXACTLY one of "User input", "SOP/manual", "Photo", "Missing evidence". Do not invent page numbers; mention a page only if the SOP excerpt explicitly carries one in its label.
   - Optional "sopRef": short reference like "<document> p.<n>" — only include when the page number literally appears in the SOP excerpt label. Otherwise omit.
- Missing checks must be concrete physical/procedural items the investigator should still verify (e.g. "To verify: last calibration date of the temperature gauge mentioned in fact #3"). Each <= 140 chars.
- Do not suggest causes, fixes, or recommendations. Do not classify severity. Do not draw the WHY Tree.

Call emit_questions exactly once.`;

const QUESTIONS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          question: { type: 'string' },
          why: { type: 'string' },
          evidenceSource: { type: 'string' },
          sopRef: { type: 'string' },
        },
        required: ['question', 'why', 'evidenceSource'],
      },
    },
    missingChecks: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: { text: { type: 'string' } },
        required: ['text'],
      },
    },
  },
  required: ['questions', 'missingChecks'],
};

const SYSTEM_PROMPT = `You are an experienced HPGRDC Incident Investigation Committee member analysing an R&D lab incident. Produce ONLY the four AI-generated sections of the HPGRDC Incident Investigation Report. Write in a concise, factual, engineering-investigation style — like a real HPGRDC committee, not a chatbot, consultant, or essayist.

ABSOLUTE GROUNDING RULES (HIGHEST PRIORITY)
- Ground EVERY output strictly in the user-entered investigation fields and the attached SOP / manual excerpts.
- NEVER invent names, dates, equipment models, chemicals, instrument tags, departments, operating values, safeguards, or procedural details that are not literally present in the input.
- Never introduce hypothetical failure modes, alternate technical possibilities, undocumented procedural deviations, equipment malfunction assumptions, control-system assumptions, or predictive-maintenance assumptions.
- The following concepts are FORBIDDEN unless the exact word appears in the user's summary, chronology, facts, records reviewed, or SOP excerpts: SCADA, MFC, syringe pump, sensor failure, interlock, IoT, smart sensor, predictive analytics, predictive maintenance, automation, digital twin, AI monitoring, machine learning. Use the GROUNDED VOCABULARY list provided below as the only source of allowed investigation-specific technical terms.
- When no evidence is available for a node, item, or recommendation, output the exact phrase: "No evidence available during investigation."
- Do not summarise the user's narrative back at them. Do not add safety platitudes. No generic language.

NO FALSE CERTAINTY
- Prefer: "during investigation it was observed", "based on available investigation inputs", "appears associated with", "likely contributed".
- Avoid: definitive root-cause declarations, "confirmed", "definitively", "clearly caused", "proves that".

NO BLAME LANGUAGE
- Never use: negligence, incompetence, careless, carelessness, misconduct, operator fault.
- Use neutral wording: "valve was not opened", "step was missed", "procedure deviation observed".

NO UNSAFE OPERATIONAL GUIDANCE
- Do not generate emergency response, isolation, shutdown, or safety-critical handling instructions unless directly grounded in uploaded SOP / manual excerpts. If absent, write: "No verified procedural guidance available in uploaded investigation records."

NEVER DECLARE CLOSURE
- Do not state the incident is closed, the root cause is confirmed, corrective action is complete, or risk is eliminated.

OUTPUT SECTIONS
1. whyTree — concise cascading cause analysis matching HPGRDC WHY Tree style.
   - effect: the observed failure, 1 short line.
   - cause: { primary, secondary } — direct causes, 1 short line each (secondary optional).
   - why: 1-3 short items.
   - deeper: 1-3 short items.
   - rootWeakness: 1-3 short items.
   No essays. Each node = a short engineering phrase.

2. keyFactors — short, incident-specific factual bullets. Each bullet 1 line.
   - system / human / physical. Empty array allowed.

3. systemsToReinforce — only systems with a real, concrete, lab-actionable deficiency grounded in this incident. Use EXACT names from the fixed 13-system list:
${SYSTEMS.map((s, i) => `   ${i + 1}. ${s}`).join('\n')}
   Do not fill Contractors Management, Safety Leadership, or Management of Change unless the user's inputs literally reference them.

4. recommendations — practical, low-complexity HPGRDC committee actions only.
   PREFER: SOP updates, checklist additions, operator counselling/training, engineering safeguard review, visual indication, procedural verification, equipment manual review, alternate analysis method, engineering feasibility study, periodic verification check.
   AVOID: plant redesign, enterprise software, major CAPEX, AI/predictive systems, advanced automation, IoT, digital twin, smart sensor, interlock (unless severity is FATAL/LWC AND grounded in inputs).
   Each item: short recommendation; responsibility/targetDate/verifiedBy are blank unless the value appears in the inputs.

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

/** Heuristic extraction of concrete SOP/manual controls. */
function extractSopControls(sopExcerpts: any[]): { document: string; page?: string; text: string; tag: string }[] {
  const out: { document: string; page?: string; text: string; tag: string }[] = [];
  const tagWords: { tag: string; re: RegExp }[] = [
    { tag: 'startup',     re: /\b(startup|start[- ]up|power[- ]on|switch on|power on|initiat)/i },
    { tag: 'shutdown',    re: /\b(shutdown|shut[- ]down|power[- ]off|switch off|isolat|emergency stop|e-?stop)/i },
    { tag: 'inspection',  re: /\b(inspect|check|verify|record|logbook|checklist|confirm)/i },
    { tag: 'limit',       re: /\b(pressure|temperature|temp|flow|load|level|limit|minimum|maximum|min|max)\b.{0,40}\d/i },
    { tag: 'hazard',      re: /\b(leak|loose|tighten|spill|hazard|fire|static|vapou?r|overpressure|connection)\b/i },
    { tag: 'equipment',   re: /\b(valve|pump|MCB|switch|line|tank|FCU|HMI|VFD|burner|nozzle)\b/i },
  ];
  for (const s of sopExcerpts || []) {
    const doc = String(s?.name || 'document').slice(0, 80);
    const pages = Array.isArray(s?.pages) ? s.pages : [];
    for (const p of pages) {
      const pageLabel = p?.page !== undefined && p?.page !== null ? String(p.page) : '';
      const text = String(p?.text || '');
      const lines = text.split(/\r?\n+|\.(?=\s)/).map(l => l.trim()).filter(l => l.length >= 12 && l.length <= 220);
      for (const line of lines) {
        for (const { tag, re } of tagWords) {
          if (re.test(line)) {
            out.push({ document: doc, page: pageLabel || undefined, text: line.slice(0, 200), tag });
            break;
          }
        }
        if (out.length >= 40) break;
      }
      if (out.length >= 40) break;
    }
    if (out.length >= 40) break;
  }
  return out;
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
    const mode: 'questions' | 'final' = body.mode === 'final' ? 'final' : 'questions';
    const photoNames: string[] = Array.isArray(inv.photographs) ? inv.photographs.map((p: any) => String(p?.name || '')) : [];

    // ---- Grounded vocabulary preprocessing ----
    const groundedSourceParts: string[] = [
      String(inv.summary || ''),
      ...(Array.isArray(inv.chronology) ? inv.chronology.map((c: any) => String(c?.event || '')) : []),
      ...(Array.isArray(inv.facts) ? inv.facts.map(String) : []),
      ...(Array.isArray(inv.recordsReviewed) ? inv.recordsReviewed.map(String) : []),
      ...(Array.isArray(inv.personsInteracted) ? inv.personsInteracted.map(String) : []),
    ];
    for (const s of sopExcerpts) {
      const pages = Array.isArray(s?.pages) ? s.pages : [];
      for (const p of pages) groundedSourceParts.push(String(p?.text || ''));
    }
    for (const n of photoNames) groundedSourceParts.push(n);
    const groundedSource = groundedSourceParts.join(' \n ').toLowerCase();
    const groundedTokens = new Set(
      groundedSource.split(/[^a-z0-9]+/).filter((t) => t.length >= 3),
    );
    const isGrounded = (term: string) => {
      const lower = term.toLowerCase();
      if (groundedSource.includes(lower)) return true;
      return lower.split(/\s+/).every((tok) => groundedTokens.has(tok));
    };

    // ============ QUESTIONS MODE ============
    if (mode === 'questions') {
      const qModel = 'google/gemini-3-flash-preview';
      const sopControls = extractSopControls(sopExcerpts);
      const controlsBlock = sopControls.length
        ? '\n\nSOP/MANUAL EXTRACTED CONTROLS (use these specific items to anchor questions):\n' +
          sopControls.map(c => `- [${c.tag}] [${c.document}${c.page ? ' p.' + c.page : ''}] ${c.text}`).join('\n')
        : '';
      const qUserMsg = `INVESTIGATION INPUTS:
${JSON.stringify({
  incidentTitle: inv.incidentTitle, classification: inv.classification,
  nm: inv.nm, pfe: inv.pfe, location: inv.location, labName: inv.labName,
  dateOfIncident: inv.dateOfIncident, timeOfIncident: inv.timeOfIncident,
  reportedBy: inv.reportedBy, recordsReviewed: inv.recordsReviewed,
  personsInteracted: inv.personsInteracted, priorSimilar: inv.priorSimilar,
  summary: inv.summary, chronology: inv.chronology, facts: inv.facts,
  suspectedCause: inv.suspectedCause, correctiveActionTaken: inv.correctiveActionTaken,
  photoNames,
}, null, 2)}${formatSopBlock(sopExcerpts)}${controlsBlock}

GROUNDED VOCABULARY (only these technical terms are allowed): ${Array.from(groundedTokens).slice(0, 400).join(', ')}

Produce 6–12 grounded investigation questions and up to 5 missing checks. Call emit_questions once.`;

      const qResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: qModel,
          messages: [
            { role: 'system', content: QUESTIONS_SYSTEM_PROMPT },
            { role: 'user', content: qUserMsg },
          ],
          tools: [{ type: 'function', function: { name: 'emit_questions', description: 'Emit grounded investigation questions and missing checks.', parameters: QUESTIONS_SCHEMA } }],
          tool_choice: { type: 'function', function: { name: 'emit_questions' } },
        }),
      });
      if (qResp.status === 429) return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (qResp.status === 402) return new Response(JSON.stringify({ error: 'AI credits exhausted. Add credits in Settings > Workspace > Usage.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (!qResp.ok) {
        const t = await qResp.text(); console.error('AI gateway error', qResp.status, t);
        return new Response(JSON.stringify({ error: `AI gateway error (${qResp.status})` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const qData = await qResp.json();
      const qArgs = qData?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (!qArgs) return new Response(JSON.stringify({ error: 'AI returned no questions' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      let parsed: any;
      try { parsed = JSON.parse(qArgs); } catch { return new Response(JSON.stringify({ error: 'AI returned malformed JSON' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }

      const allowedSources = new Set(['User input', 'SOP/manual', 'Photo', 'Missing evidence']);
      // Filter generic questions
      const genericPatterns: RegExp[] = [
        /^(was|were)\s+(the\s+)?(sop|procedure|safety|protocol|standard|guideline)s?\s+(followed|observed|adhered)/i,
        /^was\s+(the\s+)?equipment\s+inspected/i,
        /^was\s+training\s+given/i,
        /^did\s+the\s+operator\s+follow/i,
      ];
      const isGeneric = (t: string) => genericPatterns.some(re => re.test(t));

      const cleanForbidden = (s: string): string | null => {
        for (const term of FORBIDDEN_TERMS) {
          const re = new RegExp(`\\b${term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
          if (re.test(s) && !isGrounded(term)) return null;
        }
        return s;
      };

      const cleanedQ = (Array.isArray(parsed.questions) ? parsed.questions : [])
        .map((q: any, i: number) => {
          const text = String(q?.question || '').trim();
          if (!text || isGeneric(text)) return null;
          const cleaned = cleanForbidden(text);
          if (!cleaned) return null;
          const src = String(q?.evidenceSource || '').trim();
          const evidenceSource = allowedSources.has(src) ? src : 'Missing evidence';
          const sopRef = String(q?.sopRef || '').trim();
          return {
            id: `q${Date.now().toString(36)}-${i}`,
            question: cleaned,
            why: String(q?.why || '').trim(),
            evidenceSource,
            ...(sopRef ? { sopRef: sopRef.slice(0, 140) } : {}),
          };
        })
        .filter(Boolean)
        .slice(0, 12);

      const cleanedM = (Array.isArray(parsed.missingChecks) ? parsed.missingChecks : [])
        .map((m: any, i: number) => {
          let text = String(m?.text || '').trim();
          if (!text) return null;
          if (!/^to verify[:\s]/i.test(text)) text = 'To verify: ' + text.replace(/^verify[:\s]+/i, '');
          const cleaned = cleanForbidden(text);
          if (!cleaned) return null;
          return { id: `m${Date.now().toString(36)}-${i}`, text: cleaned.slice(0, 200) };
        })
        .filter(Boolean)
        .slice(0, 5);

      return new Response(JSON.stringify({ questions: cleanedQ, missingChecks: cleanedM }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ============ FINAL MODE ============
    const deepReview = true;
    const model = 'google/gemini-2.5-pro';
    const answers = Array.isArray(body.answers) ? body.answers : [];
    const missingResponses = Array.isArray(body.missingCheckResponses) ? body.missingCheckResponses : [];
    const recommendationCategories: string[] = Array.isArray(body.recommendationCategories) ? body.recommendationCategories : [];

    const userMsg = `INVESTIGATION DATA (JSON):
${JSON.stringify({
  id: inv.id,
  incidentTitle: inv.incidentTitle,
  classification: inv.classification,
  nm: inv.nm,
  pfe: inv.pfe,
  location: inv.location,
  labName: inv.labName,
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
  suspectedCause: inv.suspectedCause,
  correctiveActionTaken: inv.correctiveActionTaken,
}, null, 2)}${formatSopBlock(sopExcerpts)}

INVESTIGATOR-CONFIRMED ANSWERS (use as ground truth, do not contradict):
${JSON.stringify(answers, null, 2)}

INVESTIGATOR MISSING-CHECK RESPONSES:
${JSON.stringify(missingResponses, null, 2)}

APPLICABLE RECOMMENDATION CATEGORIES (restrict recommendations to these):
${JSON.stringify(recommendationCategories)}

GROUNDED VOCABULARY (only investigation-specific technical terms from these sources may be used; anything else must be replaced with "No evidence available during investigation."):
${Array.from(groundedTokens).slice(0, 400).join(', ')}

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

    // ============ POST-FILTER: enforce grounding, no-blame, no-certainty ============
    const NO_EVIDENCE = 'No evidence available during investigation.';
    const classification = String(inv.classification || '').toUpperCase();
    const severityAllowsInterlock = classification === 'FATAL' || classification === 'LWC';

    const cleanString = (s: string, opts: { drop?: boolean } = {}): string | null => {
      if (typeof s !== 'string') return '';
      let out = s.trim();
      if (!out) return out;

      // Forbidden terms — replace whole string with NO_EVIDENCE unless grounded.
      for (const term of FORBIDDEN_TERMS) {
        const re = new RegExp(`\\b${term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
        if (re.test(out) && !isGrounded(term)) {
          if (term === 'interlock' && !severityAllowsInterlock) {
            out = out.replace(new RegExp(term, 'ig'), 'engineering safeguard');
          } else {
            return opts.drop ? null : NO_EVIDENCE;
          }
        }
      }

      // Blame language
      out = out.replace(BLAME_REGEX, '').replace(/\s{2,}/g, ' ').trim();
      // Certainty language
      out = out.replace(CERTAINTY_REGEX, 'appears associated with');

      return out;
    };

    const cleanArray = (arr: any): string[] => {
      if (!Array.isArray(arr)) return [];
      return arr.map((x) => cleanString(String(x))).filter((x): x is string => !!x && x.length > 0);
    };

    if (report?.whyTree) {
      report.whyTree.effect = cleanString(String(report.whyTree.effect || '')) || NO_EVIDENCE;
      if (report.whyTree.cause) {
        report.whyTree.cause.primary = cleanString(String(report.whyTree.cause.primary || '')) || NO_EVIDENCE;
        if (report.whyTree.cause.secondary) {
          report.whyTree.cause.secondary = cleanString(String(report.whyTree.cause.secondary)) || '';
        }
      }
      report.whyTree.why = cleanArray(report.whyTree.why);
      report.whyTree.deeper = cleanArray(report.whyTree.deeper);
      report.whyTree.rootWeakness = cleanArray(report.whyTree.rootWeakness);
    }
    if (report?.keyFactors) {
      report.keyFactors.system = cleanArray(report.keyFactors.system);
      report.keyFactors.human = cleanArray(report.keyFactors.human);
      report.keyFactors.physical = cleanArray(report.keyFactors.physical);
    }
    if (Array.isArray(report?.systemsToReinforce)) {
      report.systemsToReinforce = report.systemsToReinforce
        .map((s: any) => ({
          system: String(s?.system || ''),
          deficiency: cleanString(String(s?.deficiency || '')) || '',
        }))
        .filter((s: any) => s.deficiency);
    }
    if (Array.isArray(report?.recommendations)) {
      const checkValueGrounded = (v: string) => {
        const t = (v || '').trim();
        if (!t) return true;
        return groundedSource.includes(t.toLowerCase());
      };
      report.recommendations = report.recommendations
        .map((r: any) => {
          let rec = cleanString(String(r?.recommendation || ''), { drop: true });
          if (!rec) return null;
          // Strip banned soft verbs
          rec = rec.replace(BANNED_VERBS, '').replace(/\s{2,}/g, ' ').trim();
          if (!rec || rec.length < 6) return null;
          return {
            recommendation: rec,
            responsibility: checkValueGrounded(r?.responsibility) ? (r?.responsibility || '') : '',
            targetDate: checkValueGrounded(r?.targetDate) ? (r?.targetDate || '') : '',
            verifiedBy: checkValueGrounded(r?.verifiedBy) ? (r?.verifiedBy || '') : '',
          };
        })
        .filter(Boolean);
    }
    // ============ END POST-FILTER ============

    report.model = 'pro';

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
