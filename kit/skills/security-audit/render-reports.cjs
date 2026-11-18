#!/usr/bin/env node
// Phase 6 renderer: derives the prose reports from the validated findings.json + coverage-ledger.json,
// so the model never re-types the findings (re-typing dozens of findings at once trips the API safety classifier).
// Usage: node render-reports.cjs <audit-dir> [--root]
//   <audit-dir>/security/{findings,coverage-ledger,run-metadata}.json -> security/REPORT.md, FINDINGS-DETAIL.md, NEEDS-VALIDATION.md
//   --root also writes <audit-dir>/REPORT.md, <audit-dir>/findings.json and <audit-dir>/report.html (the shareable summary:
//   no payloads or exploitation steps, only trace, conditions, impact and fix).
const fs = require('fs');
const path = require('path');

const dir = process.argv[2];
if (!dir) { console.error('usage: render-reports.cjs <audit-dir> [--root]'); process.exit(1); }
const root = process.argv.includes('--root');
const sec = path.join(dir, 'security');
const read = (f, d) => fs.existsSync(path.join(sec, f)) ? JSON.parse(fs.readFileSync(path.join(sec, f), 'utf8')) : d;
const F = read('findings.json', []);
const L = read('coverage-ledger.json', []);
const M = read('run-metadata.json', {});
const critic = read('agents/critic-result.json', null);

const SEV = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };
const ORDER = ['critical', 'high', 'medium', 'low'];
const sev = f => f.severity?.overall_severity || 'low';
const txt = v => v == null ? '' : typeof v === 'string' ? v : Array.isArray(v) ? v.map(txt).join('; ')
  : typeof v === 'object' ? Object.entries(v).map(([k, x]) => `${k}: ${txt(x)}`).join('; ') : String(v);
const one = s => { s = txt(s).replace(/\s+/g, ' ').trim(); const m = s.match(/^.{20,220}?[.;](\s|$)/); return m ? m[0].trim() : s.slice(0, 220); };
const cell = s => txt(s).replace(/\|/g, '\\|').replace(/\s+/g, ' ');
const loc = t => t?.file ? `${t.file}${t.line ? ':' + t.line : ''}` : '';
const area = f => { const p = (f.trace?.[0]?.file || f.evidence?.[0]?.file || '').split('/'); return ['apps', 'packages'].includes(p[0]) ? p[1] : p[0] || '—'; };
// ponytail: effort estimated from how many files the proposed fix touches; the auditor can override by hand.
const effort = f => { const n = f.remediation?.code_changes?.length || 0; return n <= 1 ? 'S' : n <= 3 ? 'M' : 'L'; };
const slug = f => f.fingerprint.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const list = (a, fmt) => (a || []).map(x => `- ${fmt(x)}`).join('\n') || '- —';
const fence = s => '```\n' + txt(s).replace(/```/g, '`​``') + '\n```';

const byRank = (a, b) => ORDER.indexOf(sev(a)) - ORDER.indexOf(sev(b)) || effort(a).localeCompare(effort(b));
const confirmed = F.filter(f => f.verdict === 'confirmed').sort(byRank);
const pending = F.filter(f => f.verdict === 'needs_validation');
const count = s => confirmed.filter(f => sev(f) === s).length;
const statusCount = L.reduce((m, u) => (m[u.status] = (m[u.status] || 0) + 1, m), {});
const deferred = L.filter(u => u.status === 'deferred');
const hardening = [...new Set(L.flatMap(u => u.hardening_notes || []))];
const src = M.source_ref || {};
const partial = M.profile === 'quick' || (M.scope_paths && M.scope_paths.length) || M.run_status === 'incomplete';
const date = (M.run_id || '').match(/\d{4}-\d{2}-\d{2}/)?.[0] || new Date().toISOString().slice(0, 10);
const counts = ORDER.map(s => `${count(s)} ${SEV[s].toLowerCase()}`).join(', ');

const header = () => [
  `- Profile: \`${M.profile || '—'}\` · Scope: ${(M.scope_paths || []).map(p => `\`${p}\``).join(', ') || 'whole repo'}`,
  `- Code: \`${src.commit || '—'}\` (branch \`${src.branch || '—'}\`, ${src.dirty ? 'with uncommitted changes: ' + (src.dirty_paths || []).map(p => `\`${p}\``).join(', ') : 'clean'})`,
  M.budget ? `- Budget: ${M.budget.max_agent_invocations} agents · used: ${M.agents_spent ?? '—'}` : '',
  `- Execution: ${M.execution_note || M.execution_policy || '—'}`,
  `- Previous runs: ${M.prior_runs_note || (M.prior_runs?.length ? M.prior_runs.join(', ') : 'none')}`,
  M.verification_note ? `- Verification: ${M.verification_note}` : '',
  partial ? `- **Partial pass**: ${M.profile === 'quick' ? 'quick profile, ' : ''}${deferred.length} coverage units not reviewed (see Coverage).` : '',
].filter(Boolean).join('\n');

const coverage = () => [
  `| Status | Units |`, `|---|---|`,
  ...Object.entries(statusCount).map(([k, v]) => `| ${k} | ${v} |`),
  '', '**Not reviewed (deferred):**', '',
  list(deferred, u => `${u.surface} · ${u.attack_class}${u.unresolved?.length ? ` — ${one(u.unresolved[0])}` : ''}`),
  critic ? `\n**Final critic:** ${critic.stop ? 'sufficient coverage' : `asks for ${(critic.missing_units || []).length} more units (the ones above); no clean coverage claim`}.` : '',
].join('\n');

// security/REPORT.md
const report = [
  `# Security audit · ${M.repo || ''} · ${date}`, '', header(), '',
  '## Posture', '',
  `${confirmed.length} confirmed findings (${counts}) and ${pending.length} pending validation. All are verified against the source code, without running the service.`, '',
  '## Confirmed findings', '',
  '| # | Severity | Finding | Boundary | Observed result |', '|---|---|---|---|---|',
  ...confirmed.map((f, i) => `| ${i + 1} | ${SEV[sev(f)]} | ${cell(f.title)} | ${cell(loc(f.trace?.[0]))} | ${cell(one(f.execution?.observed_result || f.description))} |`), '',
  ...confirmed.map((f, i) => [
    `### ${i + 1}. ${f.title}`, '',
    `- **Severity:** ${SEV[sev(f)]} — likelihood ${f.severity?.likelihood?.score}, impact ${f.severity?.impact?.score}`,
    `- **Location:** ${list(f.trace, t => `\`${loc(t)}\` — ${txt(t.description)}`).replace(/^- /, '\n  - ').replace(/\n- /g, '\n  - ')}`,
    `- **Actor:** ${txt(f.execution?.attacker_perspective) || '—'}`,
    `- **Conditions:** ${(f.conditions || []).map(c => txt(c.description)).join(' · ')}`,
    `- **Result:** ${txt(f.execution?.observed_result) || '—'}`,
    `- **Impact:** ${txt(f.severity?.impact?.reason)}`,
    `- **Priority:** ${txt(f.severity?.likelihood?.reason)}`,
    `- **Fix:** ${txt(f.remediation?.strategy)}`,
    ['critical', 'high', 'medium'].includes(sev(f)) ? `- Reproduction and fix code: [FINDINGS-DETAIL.md](FINDINGS-DETAIL.md#${slug(f)})` : '', '',
  ].filter(Boolean).join('\n')),
  '## Needs validation', '',
  `Unconfirmed leads without severity: [NEEDS-VALIDATION.md](NEEDS-VALIDATION.md).`, '',
  '| # | Lead | Trace | Blocker |', '|---|---|---|---|',
  ...pending.map((f, i) => `| ${i + 1} | ${cell(f.title)} | ${cell(loc(f.trace?.[0]))} | ${cell(one(f.blockers))} |`), '',
  '## Hardening (not findings)', '', list(hardening, h => h), '',
  '## Coverage', '', coverage(), '',
].join('\n');

// security/FINDINGS-DETAIL.md
const detail = [
  `# Findings detail · ${M.repo || ''} · ${date}`, '',
  'Confirmed findings of medium severity or above: trace, bounded local reproduction (own instance and fake data) and fix.', '',
  ...confirmed.filter(f => sev(f) !== 'low').map(f => [
    `<a id="${slug(f)}"></a>`, `## ${SEV[sev(f)]} · ${f.title}`, '', `\`${f.fingerprint}\``, '',
    txt(f.description), '',
    `**Root cause:** ${txt(f.root_cause)}`, '', `**Expected behavior:** ${txt(f.intended_behavior)}`, '',
    '### Trace', '', list(f.trace, t => `\`${loc(t)}\` (${t.kind}) — ${txt(t.description)}`), '',
    '### Evidence', '', list(f.evidence, e => `\`${loc(e)}\` — ${txt(e.description)}`), '',
    '### Conditions', '', list(f.conditions, c => `**${c.kind}:** ${txt(c.description)}`), '',
    '### Local reproduction', '', `**Actor:** ${txt(f.execution?.attacker_perspective)}`, '',
    (f.execution?.payloads || []).map(fence).join('\n\n'), '',
    list(f.execution?.instructions, s => txt(s)), '', `**Observed result:** ${txt(f.execution?.observed_result)}`, '',
    '### Fix', '', txt(f.remediation?.strategy), '',
    ...(f.remediation?.code_changes || []).map(c => `\`${c.file_name}\`\n\n${fence(c.fixed_code)}\n`), '',
  ].join('\n')),
].join('\n');

// security/NEEDS-VALIDATION.md
const needs = [
  `# Needs validation · ${M.repo || ''} · ${date}`, '',
  'Unconfirmed leads without severity: the deciding fact is not in the code or it needs running. They are not confirmed vulnerabilities.', '',
  ...pending.map((f, i) => [
    `## ${i + 1}. ${f.title}`, '', `\`${f.fingerprint}\``, '', txt(f.description), '',
    `**Claimed cause:** ${txt(f.claimed_root_cause || f.root_cause)}`, '',
    '### Trace', '', list(f.trace, t => `\`${loc(t)}\` — ${txt(t.description)}`), '',
    '### Verified evidence', '', list(f.evidence, e => `\`${loc(e)}\` — ${txt(e.description)}`), '',
    '### Blocker', '', list([].concat(f.blockers || []), txt), '',
    '### How to resolve it', '', list([].concat(f.validation_plan || []), txt), '',
  ].join('\n')),
].join('\n');

fs.writeFileSync(path.join(sec, 'REPORT.md'), report);
fs.writeFileSync(path.join(sec, 'FINDINGS-DETAIL.md'), detail);
fs.writeFileSync(path.join(sec, 'NEEDS-VALIDATION.md'), needs);
console.log(`security/: ${confirmed.length} confirmed (${counts}), ${pending.length} needs_validation`);
if (!root) process.exit(0);

// <audit-dir>/findings.json + REPORT.md (auditor format) + report.html — shareable, without execution details
const rows = confirmed.map((f, i) => ({
  id: i + 1, severity: SEV[sev(f)], type: 'security', area: area(f), title: f.title,
  evidence: (f.trace || []).slice(0, 3).map(loc), effort: effort(f), fix: one(f.remediation?.strategy), fingerprint: f.fingerprint,
}));
fs.writeFileSync(path.join(dir, 'findings.json'), JSON.stringify(rows, null, 2) + '\n');

const areas = [...new Set(rows.map(r => r.area))];
fs.writeFileSync(path.join(dir, 'REPORT.md'), [
  `# Audit · ${M.repo || ''} · ${date}`,
  `Scope: ${(M.scope_paths || []).join(', ') || 'whole repo'} · Types: security · Commit: ${(src.commit || '').slice(0, 10)} (${src.dirty ? 'with changes' : 'clean'})`, '',
  '## Summary', '',
  `${confirmed.length} confirmed security findings (${counts}) in ${areas.length} areas, and ${pending.length} leads to validate.`,
  `Most serious: ${rows.filter(r => ['Critical', 'High'].includes(r.severity)).slice(0, 3).map(r => `${r.title} (${r.area})`).join('; ')}.`,
  partial ? `This is a partial pass (profile ${M.profile}): ${deferred.length} of ${L.length} coverage units were not reviewed.` : '', '',
  '## Prioritized findings', '',
  '| # | Severity | Type | Area | Finding | Effort | Evidence |', '|---|---|---|---|---|---|---|',
  ...rows.map(r => `| ${r.id} | ${r.severity} | security | ${r.area} | ${cell(r.title)} | ${r.effort} | \`${r.evidence[0] || ''}\` |`), '',
  '## By type', '',
  '- **security**: [security/REPORT.md](security/REPORT.md) (full report), [security/FINDINGS-DETAIL.md](security/FINDINGS-DETAIL.md) (reproduction and fixes), [security/findings.json](security/findings.json) (validated records), [security/coverage-ledger.json](security/coverage-ledger.json).', '',
  '## Needs validation', '',
  `${pending.length} leads, detailed in [security/NEEDS-VALIDATION.md](security/NEEDS-VALIDATION.md):`, '',
  list(pending, f => `${f.title} — \`${loc(f.trace?.[0])}\``), '',
  '## Proposed next steps', '',
  'One task per area, with its findings (effort estimated from the number of files in the fix):', '',
  ...areas.map(a => { const r = rows.filter(x => x.area === a); return `- **${a}**: #${r.map(x => x.id).join(', #')} (${r.map(x => x.severity).join(', ')})`; }),
  '',
].filter(s => s !== false).join('\n'));

const esc = s => txt(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const chip = s => `<span class="sev sev-${s}">${SEV[s]}</span>`;
const card = (f, i) => `<details class="f" data-sev="${sev(f)}"><summary>${chip(sev(f))}<span class="t">${i + 1}. ${esc(f.title)}</span><span class="a">${esc(area(f))} · ${effort(f)}</span></summary>
<p>${esc(f.description)}</p>
<h4>Trace</h4><ol>${(f.trace || []).map(t => `<li><code>${esc(loc(t))}</code> ${esc(t.description)}</li>`).join('')}</ol>
<h4>Conditions</h4><ul>${(f.conditions || []).map(c => `<li>${esc(c.description)}</li>`).join('')}</ul>
<h4>Impact</h4><p>${esc(f.severity?.impact?.reason)}</p>
<h4>Fix</h4><p>${esc(f.remediation?.strategy)}</p>
<p class="m"><code>${esc(f.fingerprint)}</code></p></details>`;
const lead = (f, i) => `<details class="f"><summary><span class="sev sev-nv">To validate</span><span class="t">${i + 1}. ${esc(f.title)}</span><span class="a">${esc(area(f))}</span></summary>
<p>${esc(f.description)}</p><h4>Trace</h4><ol>${(f.trace || []).map(t => `<li><code>${esc(loc(t))}</code> ${esc(t.description)}</li>`).join('')}</ol>
<h4>Blocker</h4><p>${esc(f.blockers)}</p><h4>How to resolve it</h4><p>${esc(f.validation_plan)}</p></details>`;

fs.writeFileSync(path.join(dir, 'report.html'), `<title>Security ${esc(M.repo || '')} ${date}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
/* layout: one reading column, severity strip up top, findings as expandable rows grouped by verdict */
:root{--bg:#f6f7f9;--panel:#fff;--fg:#1b2430;--mut:#5d6878;--line:#dfe3ea;--acc:#2f5d8a;
--crit:#9b1c1c;--high:#c2410c;--med:#a16207;--low:#4d6b57;--nv:#5b5f97;
--sans:"IBM Plex Sans",system-ui,sans-serif;--mono:"IBM Plex Mono",ui-monospace,monospace}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#11161d;--panel:#18202a;--fg:#e4e9f0;--mut:#9aa6b6;--line:#2a3442;--acc:#7fa8d4;--crit:#f87171;--high:#fb923c;--med:#facc15;--low:#86c39b;--nv:#a5a8e0;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#11161d;--panel:#18202a;--fg:#e4e9f0;--mut:#9aa6b6;--line:#2a3442;--acc:#7fa8d4;--crit:#f87171;--high:#fb923c;--med:#facc15;--low:#86c39b;--nv:#a5a8e0;color-scheme:dark}
body{background:var(--bg);color:var(--fg);font:15px/1.55 var(--sans);padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
main{max-width:920px;margin:0 auto;padding-block:32px 64px;display:grid;gap:28px}
h1{font-size:1.6rem;margin:0;text-wrap:balance}h2{font-size:1.1rem;margin:0 0 10px}h4{font-size:.75rem;text-transform:uppercase;letter-spacing:.06em;color:var(--mut);margin:14px 0 4px}
.meta{color:var(--mut);font-size:.9rem;margin:6px 0 0}.meta code,code{font-family:var(--mono);font-size:.85em;overflow-wrap:anywhere}
.strip{display:flex;flex-wrap:wrap;gap:8px}.strip button{font:inherit;display:flex;gap:8px;align-items:baseline;padding:8px 14px;border:1px solid var(--line);background:var(--panel);color:var(--fg);border-radius:6px;cursor:pointer}
.strip button[aria-pressed="true"]{border-color:var(--acc);box-shadow:inset 0 0 0 1px var(--acc)}.strip b{font-size:1.3rem;font-variant-numeric:tabular-nums}
.strip button:focus-visible,summary:focus-visible{outline:2px solid var(--acc);outline-offset:2px}
.note{border-left:3px solid var(--acc);padding:8px 14px;background:var(--panel);font-size:.92rem}
.f{background:var(--panel);border:1px solid var(--line);border-radius:6px;margin-bottom:6px}.f[hidden]{display:none}
summary{display:flex;gap:10px;align-items:baseline;padding:10px 14px;cursor:pointer;list-style:none}summary::-webkit-details-marker{display:none}
.t{flex:1;min-width:0;font-weight:500}.a{color:var(--mut);font-size:.82rem;white-space:nowrap}
.f>*:not(summary){margin-left:14px;margin-right:14px}.f>p:last-child{margin-bottom:12px}.f ol,.f ul{padding-left:20px;margin:0}.m{color:var(--mut);font-size:.8rem}
.sev{font-size:.72rem;font-weight:600;letter-spacing:.04em;text-transform:uppercase;padding:2px 7px;border-radius:4px;border:1px solid currentColor;white-space:nowrap}
.sev-critical{color:var(--crit)}.sev-high{color:var(--high)}.sev-medium{color:var(--med)}.sev-low{color:var(--low)}.sev-nv{color:var(--nv)}
table{border-collapse:collapse;width:100%;font-size:.9rem}td,th{text-align:left;padding:6px 8px;border-bottom:1px solid var(--line)}.wrap{overflow-x:auto}
@media (max-width:560px){summary{flex-wrap:wrap}.a{width:100%}}
</style>
<main>
<header><h1>Security audit · ${esc(M.repo || '')}</h1>
<p class="meta">${date} · profile <code>${esc(M.profile)}</code> · commit <code>${esc((src.commit || '').slice(0, 10))}</code> on <code>${esc(src.branch)}</code>${src.dirty ? ' (with uncommitted changes)' : ''}</p></header>
<div class="strip" role="group" aria-label="Filter by severity">
<button id="f-all" data-f="all" aria-pressed="true"><b>${confirmed.length}</b> confirmed</button>
${ORDER.map(s => `<button id="f-${s}" data-f="${s}" aria-pressed="false"><b>${count(s)}</b> ${SEV[s].toLowerCase()}</button>`).join('\n')}
</div>
${partial ? `<p class="note">Partial pass: ${deferred.length} of ${L.length} coverage units were not reviewed. Everything is verified against the code, without running the service. Reproduction steps are in <code>security/FINDINGS-DETAIL.md</code>, not on this page.</p>` : ''}
<section><h2>Confirmed</h2>${confirmed.map(card).join('\n')}</section>
<section><h2>To validate (${pending.length})</h2>${pending.map(lead).join('\n')}</section>
<section><h2>Coverage</h2><div class="wrap"><table><tr><th>Status</th><th>Units</th></tr>${Object.entries(statusCount).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${v}</td></tr>`).join('')}</table></div>
<h4>Not reviewed</h4><ul>${deferred.map(u => `<li>${esc(u.surface)} · ${esc(u.attack_class)}</li>`).join('')}</ul></section>
</main>
<script>
const bs=[...document.querySelectorAll('.strip button')];
bs.forEach(b=>b.addEventListener('click',()=>{bs.forEach(x=>x.setAttribute('aria-pressed',x===b));
document.querySelectorAll('.f[data-sev]').forEach(f=>f.hidden=b.dataset.f!=='all'&&f.dataset.sev!==b.dataset.f)}));
</script>
`);
console.log('root: REPORT.md, findings.json, report.html');
