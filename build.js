const { writeFileSync, mkdirSync } = require("fs");

const THEMES = {
  light: {
    card: "#ffffff", line: "#d0d7de", fg: "#1f2328", muted: "#59636e", link: "#0969da",
    pass: "#1a7f37", pend: "#9a6700", termBg: "#f6f8fa", termDim: "#6e7781", chip: "#eaeef2", bar: "#2da44e"
  },
  dark: {
    card: "#0d1117", line: "#30363d", fg: "#e6edf3", muted: "#9198a1", link: "#4493f8",
    pass: "#3fb950", pend: "#d29922", termBg: "#161b22", termDim: "#8b949e", chip: "#21262d", bar: "#3fb950"
  }
};

const WIDTH = 830;
const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif";

const stats = {
  commits: 2633,
  activeDays: 911,
  months: [
    ["Jan", 55], ["Feb", 39], ["Mar", 44], ["Apr", 48], ["May", 46],
    ["Jun", 52], ["Jul", 39], ["Aug", 126], ["Sep", 71], ["Oct", 64]
  ]
};

const demos = [
  ["mobile-demo", "planned · Nov", "WebdriverIO + Appium on a public demo app. One locator per element for Android and iOS, page objects, Allure report. CI on an emulator and a simulator."],
  ["web-api-demo", "planned · Nov", "Playwright for the web and the API, k6 for load, all against a demo shop that runs in Docker inside the CI."],
  ["lockator", "planned · Dec", "Collects candidate locators from a running web page or mobile screen and writes them as a table ready for the test docs."],
  ["qa-templates", "planned · Dec", "The test grid, the bug ticket and the release plan I use, in a generic version."]
];

const fmt = n => new Intl.NumberFormat("en").format(n);
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Each line is a list of [style, text]; styles: fg, dim, ok, pd, b.
const terminalLines = [
  [["dim", "$"], ["fg", " npx wdio run ./profile.conf.ts"]],
  [],
  [["b", "Renan Calvet"], ["dim", " · "], ["fg", "QA Automation Engineer"]],
  [],
  [["b", "  Stack"]],
  [["ok", "    ✓"], ["fg", " mobile     WebdriverIO + Appium "], ["dim", "· Android and iOS"]],
  [["ok", "    ✓"], ["fg", " web        Playwright"]],
  [["ok", "    ✓"], ["fg", " api        REST "], ["dim", "·"], ["fg", " Postman, Playwright request"]],
  [["ok", "    ✓"], ["fg", " load       k6"]],
  [["ok", "    ✓"], ["fg", " ci/cd      GitLab CI, GitHub Actions"]],
  [["ok", "    ✓"], ["fg", " test mgmt  Qase.io"]],
  [["ok", "    ✓"], ["fg", " languages  TypeScript, Python"]],
  [["b", "  Activity"]],
  [["ok", "    ✓"], ["fg", ` ${fmt(stats.commits)} commits since 2021, most in private company repositories`]],
  [["ok", "    ✓"], ["fg", ` ${fmt(stats.activeDays)} active days`]],
  [["pd", "    -"], ["fg", " mobile-demo   "], ["dim", "public in November"]],
  [["pd", "    -"], ["fg", " web-api-demo  "], ["dim", "public in November"]],
  [],
  [["ok", "  9 passing"], ["dim", ` (${stats.activeDays}d)`]],
  [["pd", "  2 pending"]]
];

function terminal(t) {
  const pad = 20, lh = 20.8, top = 18;
  const height = Math.round(top * 2 + terminalLines.length * lh);
  const fill = { fg: t.fg, dim: t.termDim, ok: t.pass, pd: t.pend, b: t.fg };
  const rows = terminalLines
    .map((segments, i) => {
      const y = (top + (i + 1) * lh - 6).toFixed(1);
      const spans = segments
        .map(([style, text]) => `<tspan fill="${fill[style]}"${style === "b" ? ' font-weight="600"' : ""}>${esc(text)}</tspan>`)
        .join("");
      return `<text x="${pad}" y="${y}" xml:space="preserve">${spans}</text>`;
    })
    .join("\n  ");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" font-family="${MONO}" font-size="13">
  <rect x="0.5" y="0.5" width="${WIDTH - 1}" height="${height - 1}" rx="6" fill="${t.termBg}" stroke="${t.line}"/>
  ${rows}
</svg>
`;
}

function wrap(text, maxChars) {
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    if ((line + " " + word).trim().length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = (line + " " + word).trim();
    }
  }
  return [...lines, line];
}

function demoCards(t) {
  const gap = 10, cols = 2, cardW = (WIDTH - gap) / cols, padX = 14, padY = 12;
  const wrapped = demos.map(([, , text]) => wrap(text, 56));
  const maxLines = Math.max(...wrapped.map(l => l.length));
  const cardH = padY * 2 + 26 + maxLines * 20;
  const rowsCount = Math.ceil(demos.length / cols);
  const height = rowsCount * cardH + (rowsCount - 1) * gap;
  const cards = demos
    .map(([name, pill], i) => {
      const x = (i % cols) * (cardW + gap), y = Math.floor(i / cols) * (cardH + gap);
      const pillW = pill.length * 6.4 + 18;
      const desc = wrapped[i]
        .map((l, j) => `<text x="${x + padX}" y="${y + padY + 46 + j * 20}" font-family="${SANS}" font-size="13.5" fill="${t.muted}">${esc(l)}</text>`)
        .join("\n  ");
      return `<rect x="${x + 0.5}" y="${y + 0.5}" width="${cardW - 1}" height="${cardH - 1}" rx="6" fill="${t.card}" stroke="${t.line}"/>
  <text x="${x + padX}" y="${y + padY + 15}" font-family="${MONO}" font-size="14" font-weight="600" fill="${t.link}">${esc(name)}</text>
  <rect x="${x + cardW - padX - pillW + 0.5}" y="${y + padY + 1.5}" width="${pillW}" height="19" rx="9.5" fill="none" stroke="${t.pend}"/>
  <text x="${x + cardW - padX - pillW / 2}" y="${y + padY + 15}" text-anchor="middle" font-family="${SANS}" font-size="11.5" font-weight="500" fill="${t.pend}">${esc(pill)}</text>
  ${desc}`;
    })
    .join("\n  ");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}">
  ${cards}
</svg>
`;
}

function monthBars(t) {
  const width = 520, rowH = 18, gap = 8, labelW = 34, valueW = 36, inner = 10;
  const trackX = labelW + inner, trackW = width - labelW - valueW - inner * 2;
  const max = Math.max(...stats.months.map(([, v]) => v));
  const height = stats.months.length * rowH + (stats.months.length - 1) * gap;
  const rows = stats.months
    .map(([label, value], i) => {
      const y = i * (rowH + gap), mid = y + rowH / 2;
      return `<text x="0" y="${mid + 4.5}" font-size="13" fill="${t.muted}">${label}</text>
  <rect x="${trackX}" y="${mid - 5}" width="${trackW}" height="10" rx="2" fill="${t.chip}"/>
  <rect x="${trackX}" y="${mid - 5}" width="${((trackW * value) / max).toFixed(1)}" height="10" rx="2" fill="${t.bar}"/>
  <text x="${width}" y="${mid + 4.5}" font-size="13" text-anchor="end" fill="${t.fg}">${value}</text>`;
    })
    .join("\n  ");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="${SANS}">
  ${rows}
</svg>
`;
}

mkdirSync("assets", { recursive: true });
for (const [name, t] of Object.entries(THEMES)) {
  writeFileSync(`assets/terminal-${name}.svg`, terminal(t));
  writeFileSync(`assets/demos-${name}.svg`, demoCards(t));
  writeFileSync(`assets/months-${name}.svg`, monthBars(t));
}
console.log("assets written");
