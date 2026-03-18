// ─────────────────────────────────────────────────────────────
//  AI Life Scanner — App
//  Stack: React 18 (CDN) + Babel Standalone
//  API:   LiteLLM (OpenAI-compatible)
// ─────────────────────────────────────────────────────────────

// ── Konfigurasi API ─────────────────────────────────────────
const CONFIG = {
  API_KEY:  "sk-elHciW1cJjGB5f33vHjo8g",
  API_BASE: "https://litellm.koboi2026.biz.id/v1/chat/completions",
  MODEL:    "openai/gpt-5.2",
};
// ─────────────────────────────────────────────────────────────

const { useState, useEffect } = React;

// ── Constants ─────────────────────────────────────────────────
const MOODS = [
  { v: 1, label: "Sangat Tertekan", color: "#f85149" },
  { v: 2, label: "Kurang Baik",     color: "#d29922" },
  { v: 3, label: "Biasa Saja",      color: "#8b949e" },
  { v: 4, label: "Cukup Baik",      color: "#3fb950" },
  { v: 5, label: "Sangat Baik",     color: "#58a6ff" },
];

const DRAIN_OPTS = [
  "Meeting tidak perlu",     "Doom scrolling sosmed",
  "Notifikasi berlebihan",   "Tugas tidak jelas",
  "Multitasking berlebih",   "Kurang tidur",
  "Konflik interpersonal",   "Prioritas tidak jelas",
  "Prokrastinasi",           "Beban administrasi",
  "Overthinking / anxious",  "FOMO / compare diri",
  "Distraksi dari HP",       "Burnout AI / info overload",
];

const WORK_MODES = ["WFH penuh", "Hybrid", "Kerja di kantor", "Freelance", "Nomad digital"];
const FINANCE_STRESS = [
  { v: 1, label: "Tidak stres" },
  { v: 2, label: "Sedikit stres" },
  { v: 3, label: "Lumayan stres" },
  { v: 4, label: "Stres berat" },
  { v: 5, label: "Sangat stres" },
];

const C = {
  bg0: "#0d1117", bg1: "#161b22", bg2: "#21262d", bg3: "#30363d",
  accent: "#58a6ff", accentDim: "rgba(31,58,95,.6)",
  green: "#3fb950",  greenDim:  "rgba(15,42,20,.6)",
  red:   "#f85149",  redDim:    "rgba(58,15,15,.6)",
  amber: "#d29922",  amberDim:  "rgba(42,31,10,.6)",
  txt0: "#e6edf3",   txt1: "#8b949e", txt2: "#6e7681",
};

// ── LocalStorage helper ────────────────────────────────────────
const db = {
  getAll() {
    const arr = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith("scan:")) {
        try { arr.push(JSON.parse(localStorage.getItem(k))); } catch {}
      }
    }
    return arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  save(scan) { localStorage.setItem(scan.id, JSON.stringify(scan)); },
};

// ── Utility ───────────────────────────────────────────────────
function fmt(iso) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}
function weekLabel(iso) {
  const d = new Date(iso);
  return `Minggu ${d.getDate()} ${d.toLocaleDateString("id-ID", { month: "short", year: "numeric" })}`;
}
function avg(arr) {
  if (!arr.length) return "—";
  return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
}
function cr(scan) {
  const total = scan.taskDone + scan.taskPending;
  return total > 0 ? Math.round((scan.taskDone / total) * 100) : 0;
}

// ── NavBtn ────────────────────────────────────────────────────
function NavBtn({ label, active, onClick }) {
  return (
    <button className={`nav-btn ${active ? "active" : ""}`} onClick={onClick}>
      {label}
    </button>
  );
}

// ── StatCard ──────────────────────────────────────────────────
function StatCard({ label, value, unit, color }) {
  return (
    <div className="stat-card">
      <div className="stat-num" style={{ color: color || C.accent }}>
        {value}
        {unit && <span style={{ fontSize: "11px", color: C.txt2, marginLeft: "2px" }}>{unit}</span>}
      </div>
      <div className="stat-lbl">{label}</div>
    </div>
  );
}

// ── RangeSlider ───────────────────────────────────────────────
function RangeSlider({ min, max, step, value, onChange, accentColor }) {
  const col = accentColor || C.accent;
  return (
    <div>
      <input type="range" min={min} max={max} step={step || 0.5}
        value={value} onChange={e => onChange(parseFloat(e.target.value))}
        style={{ accentColor: col }} />
      <div className="range-labels">
        <span>{min}</span>
        <span style={{ color: col, fontWeight: 700 }}>{value}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

// ── MoodBar ───────────────────────────────────────────────────
function MoodBar({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: "6px" }}>
      {MOODS.map(m => (
        <button key={m.v} className="mood-btn"
          style={value === m.v ? {
            background: m.color + "22",
            borderColor: m.color,
            color: m.color,
          } : {}}
          onClick={() => onChange(m.v)}>
          {m.label}
        </button>
      ))}
    </div>
  );
}

// ── CheckGrid ─────────────────────────────────────────────────
function CheckGrid({ options, selected, onChange }) {
  function toggle(v) {
    onChange(selected.includes(v)
      ? selected.filter(x => x !== v)
      : [...selected, v]);
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      {options.map(o => (
        <button key={o} className={`tag-pill ${selected.includes(o) ? "on" : ""}`}
          onClick={() => toggle(o)}>
          {o}
        </button>
      ))}
    </div>
  );
}

// ── InputForm ─────────────────────────────────────────────────
function InputForm({ onSave, onBack }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    // Existing
    avgSleep: 6.5, energy: 3, mood: null,
    taskDone: 5,   taskPending: 8, deepWork: 2,
    drains: [],    topExpense: "", note: "",
    // New 2026
    screentime: 4,      // jam/hari total HP
    sosmedTime: 2,      // jam/hari sosmed
    aiToolsTime: 1,     // jam/hari pakai AI tools
    exercise: 2,        // hari/minggu olahraga
    workMode: "",       // WFH/Hybrid/dll
    finStress: null,    // stress finansial 1-5
    hasSideHustle: null, // true/false
    digitalNote: "",    // catatan digital habits
  });
  const [saving, setSaving] = useState(false);

  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }

  const sleepColor = form.avgSleep >= 7 ? C.green : form.avgSleep >= 6 ? C.amber : C.red;
  const deepColor  = form.deepWork >= 3 ? C.green : form.deepWork >= 1.5 ? C.amber : C.red;
  const crTotal    = form.taskDone + form.taskPending;
  const crPct      = crTotal > 0 ? Math.round((form.taskDone / crTotal) * 100) : 0;

  const scrColor  = form.screentime >= 8 ? C.red : form.screentime >= 5 ? C.amber : C.green;
  const sosColor  = form.sosmedTime >= 4 ? C.red : form.sosmedTime >= 2 ? C.amber : C.green;

  const steps = [
    {
      title: "Tidur & Energi",
      sub: "Data dasar kondisi fisik minggu ini",
      valid: form.mood !== null,
      content: (
        <div className="gap-md">
          <div>
            <label className="label">Rata-rata jam tidur per malam</label>
            <RangeSlider min={3} max={10} step={0.5} value={form.avgSleep}
              onChange={v => set("avgSleep", v)} accentColor={sleepColor} />
            <p className="txt-xs muted" style={{ marginTop: "6px" }}>
              {form.avgSleep >= 7 ? "✓ Optimal" : form.avgSleep >= 6 ? "⚠ Sedikit kurang" : "✗ Di bawah batas — perlu perhatian"}
            </p>
          </div>
          <div>
            <label className="label">Level energi rata-rata (1–5)</label>
            <RangeSlider min={1} max={5} step={1} value={form.energy}
              onChange={v => set("energy", v)} />
          </div>
          <div>
            <label className="label">Mood dominan minggu ini *</label>
            <MoodBar value={form.mood} onChange={v => set("mood", v)} />
            {!form.mood && <p className="txt-xs" style={{ color: C.txt2, marginTop: "6px" }}>Pilih salah satu untuk melanjutkan</p>}
          </div>
        </div>
      ),
    },
    {
      title: "Pekerjaan & Fokus",
      sub: "Seberapa produktif minggu ini sebenarnya",
      valid: true,
      content: (
        <div className="gap-md">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label className="label">Task selesai</label>
              <RangeSlider min={0} max={30} step={1} value={form.taskDone}
                onChange={v => set("taskDone", v)} accentColor={C.green} />
            </div>
            <div>
              <label className="label">Task tertunda</label>
              <RangeSlider min={0} max={30} step={1} value={form.taskPending}
                onChange={v => set("taskPending", v)} accentColor={C.red} />
            </div>
          </div>
          <div style={{
            background: C.bg2, border: `1px solid ${C.bg3}`,
            borderRadius: "8px", padding: "10px 14px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span className="txt-sm muted">Completion rate</span>
            <span className="mono" style={{
              fontWeight: 700, fontSize: "18px",
              color: crPct >= 70 ? C.green : crPct >= 40 ? C.amber : C.red,
            }}>{crPct}%</span>
          </div>
          <div>
            <label className="label">Jam kerja fokus (deep work) per hari — rata-rata</label>
            <RangeSlider min={0} max={8} step={0.5} value={form.deepWork}
              onChange={v => set("deepWork", v)} accentColor={deepColor} />
            <p className="txt-xs muted" style={{ marginTop: "6px" }}>
              {form.deepWork >= 3 ? "✓ Deep work cukup" : form.deepWork >= 1.5 ? "⚠ Bisa ditingkatkan" : "✗ Terlalu sedikit"}
            </p>
          </div>
          <div>
            <label className="label">Apa yang paling menguras energi? (bisa lebih dari satu)</label>
            <CheckGrid options={DRAIN_OPTS} selected={form.drains}
              onChange={v => set("drains", v)} />
          </div>
        </div>
      ),
    },
    {
      title: "Digital & Gaya Hidup",
      sub: "Kebiasaan digital dan kondisi hidup di 2026",
      valid: form.workMode !== "" && form.finStress !== null,
      content: (
        <div className="gap-md">
          <div>
            <label className="label">Total screentime HP per hari (jam)</label>
            <RangeSlider min={0} max={16} step={0.5} value={form.screentime}
              onChange={v => set("screentime", v)} accentColor={scrColor} />
            <p className="txt-xs muted" style={{ marginTop: "6px" }}>
              {form.screentime >= 8 ? "✗ Sangat tinggi — kemungkinan besar menguras fokus"
              : form.screentime >= 5 ? "⚠ Di atas rata-rata — perlu dicek"
              : "✓ Masih dalam batas wajar"}
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label className="label">Sosial media (jam/hari)</label>
              <RangeSlider min={0} max={8} step={0.5} value={form.sosmedTime}
                onChange={v => set("sosmedTime", v)} accentColor={sosColor} />
              <div className="range-labels">
                <span></span>
                <span style={{ color: sosColor, fontWeight: 700 }}>{form.sosmedTime}j</span>
                <span></span>
              </div>
            </div>
            <div>
              <label className="label">Pakai AI tools (jam/hari)</label>
              <RangeSlider min={0} max={8} step={0.5} value={form.aiToolsTime}
                onChange={v => set("aiToolsTime", v)} accentColor={C.accent} />
              <div className="range-labels">
                <span></span>
                <span style={{ color: C.accent, fontWeight: 700 }}>{form.aiToolsTime}j</span>
                <span></span>
              </div>
            </div>
          </div>
          <div>
            <label className="label">Olahraga minggu ini (hari)</label>
            <RangeSlider min={0} max={7} step={1} value={form.exercise}
              onChange={v => set("exercise", v)}
              accentColor={form.exercise >= 3 ? C.green : form.exercise >= 1 ? C.amber : C.red} />
            <p className="txt-xs muted" style={{ marginTop: "6px" }}>
              {form.exercise >= 3 ? "✓ Bagus" : form.exercise >= 1 ? "⚠ Bisa lebih" : "✗ Tidak olahraga sama sekali"}
            </p>
          </div>
          <div>
            <label className="label">Mode kerja minggu ini *</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {WORK_MODES.map(w => (
                <button key={w} className={`tag-pill ${form.workMode === w ? "on" : ""}`}
                  onClick={() => set("workMode", w)}>{w}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Level stress finansial minggu ini *</label>
            <div style={{ display: "flex", gap: "6px" }}>
              {FINANCE_STRESS.map(f => (
                <button key={f.v} className="mood-btn"
                  style={form.finStress === f.v ? {
                    background: [C.green,C.green,C.amber,C.red,C.red][f.v-1] + "22",
                    borderColor: [C.green,C.green,C.amber,C.red,C.red][f.v-1],
                    color: [C.green,C.green,C.amber,C.red,C.red][f.v-1],
                  } : {}}
                  onClick={() => set("finStress", f.v)}>{f.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Punya side hustle / income tambahan?</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {[{v: true, label: "Ya, aktif"}, {v: false, label: "Tidak / belum"}].map(o => (
                <button key={String(o.v)} className={`tag-pill ${form.hasSideHustle === o.v ? "on" : ""}`}
                  style={{ flex: 1 }} onClick={() => set("hasSideHustle", o.v)}>{o.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Catatan kebiasaan digital <span style={{color:C.txt2}}>(opsional)</span></label>
            <textarea className="input" rows={2}
              placeholder="contoh: susah lepas dari HP sebelum tidur, sering doomscroll saat bosan…"
              value={form.digitalNote} onChange={e => set("digitalNote", e.target.value)} />
          </div>
        </div>
      ),
    },
    {
      title: "Keuangan & Catatan",
      sub: "Pengeluaran dan refleksi akhir minggu",
      valid: true,
      content: (
        <div className="gap-md">
          <div>
            <label className="label">Kategori pengeluaran terbesar minggu ini</label>
            <input className="input" placeholder="contoh: makan di luar, transport, langganan…"
              value={form.topExpense} onChange={e => set("topExpense", e.target.value)} />
          </div>
          <div>
            <label className="label">Apa yang paling tidak beres minggu ini? (1–2 kalimat)</label>
            <textarea className="input" rows={3}
              placeholder="Tidak perlu panjang — tulis yang langsung terlintas…"
              value={form.note} onChange={e => set("note", e.target.value)} />
          </div>
          <div style={{ background: C.bg2, border: `1px solid ${C.bg3}`, borderRadius: "10px", padding: "14px" }}>
            <p className="mono txt-xs muted" style={{ textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "10px" }}>Ringkasan input</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "13px", color: C.txt1 }}>
              <span>Tidur: <strong style={{ color: C.txt0 }}>{form.avgSleep}j</strong></span>
              <span>Energi: <strong style={{ color: C.txt0 }}>{form.energy}/5</strong></span>
              <span>Task selesai: <strong style={{ color: C.green }}>{form.taskDone}</strong></span>
              <span>Task pending: <strong style={{ color: C.red }}>{form.taskPending}</strong></span>
              <span>Screentime: <strong style={{ color: form.screentime >= 8 ? C.red : C.txt0 }}>{form.screentime}j/hr</strong></span>
              <span>Sosmed: <strong style={{ color: form.sosmedTime >= 4 ? C.red : C.txt0 }}>{form.sosmedTime}j/hr</strong></span>
              <span>Olahraga: <strong style={{ color: C.txt0 }}>{form.exercise}x/minggu</strong></span>
              <span>Mode kerja: <strong style={{ color: C.txt0 }}>{form.workMode || "—"}</strong></span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  async function handleSubmit() {
    setSaving(true);
    const id = `scan:${Date.now()}`;
    const scan = { ...form, id, createdAt: new Date().toISOString(), diagnosis: null };
    db.save(scan);
    onSave(scan);
    setSaving(false);
  }

  const cur = steps[step];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.75rem" }}>
        <button className="btn-ghost" onClick={onBack}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "19px", fontWeight: 600 }}>Scan Minggu Ini</div>
          <div className="mono txt-xs muted">Langkah {step + 1} dari {steps.length}</div>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {steps.map((_, i) => (
            <div key={i} className="step-bar"
              style={{ background: i <= step ? C.accent : C.bg3 }} />
          ))}
        </div>
      </div>

      {/* Step label */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div className="mono txt-xs" style={{ color: C.accent, textTransform: "uppercase", letterSpacing: ".7px", marginBottom: "4px" }}>
          {cur.title}
        </div>
        <div className="txt-sm muted">{cur.sub}</div>
      </div>

      {/* Content */}
      <div style={{ marginBottom: "1.75rem" }}>{cur.content}</div>

      {/* Navigation */}
      <div className="row">
        {step > 0 && (
          <button className="btn-ghost" onClick={() => setStep(s => s - 1)}>← Kembali</button>
        )}
        {step < steps.length - 1 ? (
          <button className="btn" style={{ flex: 1 }}
            disabled={!cur.valid} onClick={() => setStep(s => s + 1)}>
            Lanjut →
          </button>
        ) : (
          <button className="btn" style={{ flex: 1 }}
            disabled={saving} onClick={handleSubmit}>
            {saving ? "Menyimpan…" : "Kirim ke AI Scanner ◈"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── DiagnosisView ─────────────────────────────────────────────
function DiagnosisView({ scan, onBack, onUpdate }) {
  const [loading,  setLoading]  = useState(!scan.diagnosis);
  const [err,      setErr]      = useState(null);
  const [elapsed,  setElapsed]  = useState(0);
  const timerRef    = React.useRef(null);
  const hardStopRef = React.useRef(null);

  useEffect(() => {
    if (loading) {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
      // Hard UI cutoff — paksa stop setelah 60 detik
      hardStopRef.current = setTimeout(() => {
        setLoading(false);
        setErr("Timeout 60 detik — Server LiteLLM terlalu lambat atau tidak merespons.\n\nCoba lagi beberapa saat.");
      }, 60000);
    } else {
      clearInterval(timerRef.current);
      clearTimeout(hardStopRef.current);
    }
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(hardStopRef.current);
    };
  }, [loading]);

  async function runDiagnosis() {
    setLoading(true); setErr(null); setElapsed(0);

    const completion = cr(scan);
    const moodLabel    = MOODS.find(m => m.v === scan.mood)?.label || "—";
    const finLabel     = FINANCE_STRESS.find(f => f.v === scan.finStress)?.label || "tidak diisi";
    const digitalScore = scan.screentime && scan.sosmedTime
      ? Math.round(((scan.screentime + scan.sosmedTime) / 2))
      : null;

    const prompt = `Diagnosis kondisi hidup minggu ini. Balas HANYA JSON, tanpa teks lain.

Data: tidur ${scan.avgSleep}j, energi ${scan.energy}/5, mood ${moodLabel}, task selesai ${scan.taskDone} tertunda ${scan.taskPending} (CR ${completion}%), deep work ${scan.deepWork}j/hr, mode kerja ${scan.workMode||"-"}, drains: ${scan.drains?.join(",")||"-"}, screentime ${scan.screentime||0}j, sosmed ${scan.sosmedTime||0}j, AI tools ${scan.aiToolsTime||0}j, olahraga ${scan.exercise||0}x/mgg, side hustle ${scan.hasSideHustle?"ya":"tidak"}, stress finansial ${finLabel}, pengeluaran ${scan.topExpense||"-"}, catatan: "${scan.note||"-"}"

JSON yang harus dikembalikan:
{"status":"KRITIS/OVERLOADED/TERFRAGMENTASI/STABIL/OPTIMAL","statusColor":"red/amber/blue/green","headline":"diagnosis satu kalimat spesifik","bottlenecks":[{"masalah":"bottleneck 1","solusi":"solusi konkret"},{"masalah":"bottleneck 2","solusi":"solusi konkret"}],"digitalHealth":{"score":"BAIK/WASPADA/KRITIS","scoreColor":"green/amber/red","finding":"temuan digital spesifik"},"leaks":["kebocoran 1","kebocoran 2"],"strengths":["kekuatan 1"],"actions":[{"time":"Hari ini","action":"tindakan"},{"time":"3 hari ini","action":"tindakan"},{"time":"Minggu ini","action":"tindakan"}],"insight":"insight mendalam 1-2 kalimat"}`;

    try {
      console.log("[LifeScanner] Fetching:", CONFIG.API_BASE);
      const controller   = new AbortController();
      const fetchTimeout = setTimeout(() => controller.abort(), 55000);

      const res = await fetch(CONFIG.API_BASE, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${CONFIG.API_KEY}`,
        },
        body: JSON.stringify({
          model:      CONFIG.MODEL,
          max_tokens: 2000,
          messages:   [{ role: "user", content: prompt }],
        }),
      });
      clearTimeout(fetchTimeout);
      console.log("[LifeScanner] Response:", res.status);

      const contentType = res.headers.get("content-type") || "";
      const rawText = await res.text();

      if (!res.ok || contentType.includes("text/html")) {
        if (contentType.includes("text/html")) {
          throw new Error(`Server mengembalikan HTML bukan JSON (HTTP ${res.status}). Kemungkinan endpoint salah atau server down.`);
        }
        throw new Error(`HTTP ${res.status} — ${rawText.slice(0, 200)}`);
      }

      let data;
      try { data = JSON.parse(rawText); }
      catch { throw new Error("Respons bukan JSON valid: " + rawText.slice(0, 150)); }

      // Log full structure untuk debug
      console.log("[LifeScanner] Full response keys:", Object.keys(data));
      console.log("[LifeScanner] Choices:", JSON.stringify(data.choices?.slice(0,1)));

      // Coba berbagai path response
      const raw =
        data.choices?.[0]?.message?.content ||
        data.choices?.[0]?.text ||
        data.content ||
        data.text ||
        data.result ||
        data.output ||
        (typeof data.choices?.[0] === "string" ? data.choices[0] : "") ||
        "";

      console.log("[LifeScanner] Raw AI:", raw.slice(0, 300));
      if (!raw) {
        throw new Error("Response kosong. Full response: " + JSON.stringify(data).slice(0, 300));
      }

      // Coba 3 cara ekstrak JSON
      let diagnosis = null;
      const tryParse = (str) => { try { return JSON.parse(str); } catch { return null; } };

      // Cara 1: langsung parse
      diagnosis = tryParse(raw.trim());

      // Cara 2: strip ```json``` markdown block
      if (!diagnosis) {
        const stripped = raw.replace(/```json|```/gi, "").trim();
        diagnosis = tryParse(stripped);
      }

      // Cara 3: ambil dari { pertama ke } terakhir
      if (!diagnosis) {
        const s = raw.indexOf("{"), e = raw.lastIndexOf("}");
        if (s !== -1 && e > s) diagnosis = tryParse(raw.slice(s, e + 1));
      }

      if (!diagnosis) throw new Error("AI tidak mengembalikan JSON. Response: " + raw.slice(0, 200));

      const updated   = { ...scan, diagnosis };
      db.save(updated);
      onUpdate(updated);
    } catch (e) {
      console.error("[LifeScanner] Error:", e);
      if (e.name === "AbortError") {
        setErr("Timeout — API tidak merespons dalam 55 detik. Coba lagi.");
      } else if (e.message?.includes("Failed to fetch")) {
        setErr("Tidak bisa menghubungi API. Cek koneksi internet.");
      } else {
        setErr(e.message);
      }
    }
    setLoading(false);
  }

  useEffect(() => { if (!scan.diagnosis) runDiagnosis(); }, []);

  const STATUS_COLOR = { red: C.red, amber: C.amber, blue: C.accent, green: C.green };
  const d = scan.diagnosis;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.75rem" }}>
        <button className="btn-ghost" onClick={onBack}>←</button>
        <div>
          <div style={{ fontSize: "19px", fontWeight: 600 }}>Hasil Diagnosis</div>
          <div className="mono txt-xs muted">{weekLabel(scan.createdAt)}</div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <div className="mono txt-xs" style={{ color: C.accent, letterSpacing: ".5px", marginBottom: "16px" }}>
            SCANNING… <span style={{ color: C.txt2 }}>{elapsed}s</span>
          </div>
          <div className="scan-progress" style={{ marginBottom: "12px" }}>
            <div className="scan-fill" />
          </div>
          <p className="txt-xs muted" style={{ marginBottom: "16px" }}>
            {elapsed < 8  ? "AI sedang membaca pola dari data kamu…"
            : elapsed < 20 ? "Sedang menganalisis, server agak lambat…"
            : elapsed < 40 ? "Masih loading, harap sabar…"
            : "Hampir timeout, coba batalkan dan ulangi…"}
          </p>
          {elapsed >= 10 && (
            <button className="btn-ghost" style={{ fontSize: "12px" }}
              onClick={() => { setLoading(false); setErr("Dibatalkan. Coba lagi kalau siap."); }}>
              Batalkan
            </button>
          )}
        </div>
      ) : err ? (
        <div className="card card-red">
          <p className="mono txt-xs" style={{ color: C.red, marginBottom: "12px" }}>{err}</p>
          <button className="btn-ghost" onClick={runDiagnosis}>Coba lagi</button>
        </div>
      ) : d ? (
        <div className="gap-sm">

          {/* Status hero */}
          <div className="card" style={{
            borderColor: (STATUS_COLOR[d.statusColor] || C.accent) + "55",
            background: (STATUS_COLOR[d.statusColor] || C.accent) + "11",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div className="mono" style={{
                fontSize: "20px", fontWeight: 700,
                color: STATUS_COLOR[d.statusColor] || C.accent,
              }}>{d.status}</div>
              <div style={{ fontSize: "15px", lineHeight: 1.5, flex: 1 }}>{d.headline}</div>
            </div>
          </div>

          {/* Stats */}
          <div className="stat-grid">
            <StatCard label="Tidur"
              value={scan.avgSleep} unit="jam"
              color={scan.avgSleep >= 7 ? C.green : scan.avgSleep >= 6 ? C.amber : C.red} />
            <StatCard label="Completion"
              value={cr(scan)} unit="%"
              color={cr(scan) >= 70 ? C.green : cr(scan) >= 40 ? C.amber : C.red} />
            <StatCard label="Deep Work"
              value={scan.deepWork} unit="j/hr"
              color={scan.deepWork >= 3 ? C.green : C.amber} />
          </div>
          {scan.screentime > 0 && (
            <div className="stat-grid">
              <StatCard label="Screentime"
                value={scan.screentime} unit="j/hr"
                color={scan.screentime >= 8 ? C.red : scan.screentime >= 5 ? C.amber : C.green} />
              <StatCard label="Sosmed"
                value={scan.sosmedTime || 0} unit="j/hr"
                color={scan.sosmedTime >= 4 ? C.red : scan.sosmedTime >= 2 ? C.amber : C.green} />
              <StatCard label="Olahraga"
                value={scan.exercise || 0} unit="x/mgg"
                color={scan.exercise >= 3 ? C.green : scan.exercise >= 1 ? C.amber : C.red} />
            </div>
          )}

          {/* Digital Health */}
          {d.digitalHealth && (
            <div className="card" style={{
              borderColor: ({green: C.green, amber: C.amber, red: C.red}[d.digitalHealth.scoreColor] || C.txt1) + "55",
              background:  ({green: C.green, amber: C.amber, red: C.red}[d.digitalHealth.scoreColor] || C.txt1) + "0d",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <div className="section-label" style={{ color: C.accent, marginBottom: 0 }}>📱 Digital Health</div>
                <span className="badge" style={{
                  color: ({green: C.green, amber: C.amber, red: C.red}[d.digitalHealth.scoreColor] || C.txt1),
                  background: ({green: C.green, amber: C.amber, red: C.red}[d.digitalHealth.scoreColor] || C.txt1) + "22",
                }}>{d.digitalHealth.score}</span>
              </div>
              <p style={{ fontSize: "14px", color: C.txt0, lineHeight: 1.6 }}>{d.digitalHealth.finding}</p>
              {scan.screentime > 0 && (
                <div style={{ display: "flex", gap: "12px", marginTop: "10px", fontSize: "12px", fontFamily: "'Space Mono', monospace" }}>
                  <span style={{ color: scan.screentime >= 8 ? C.red : C.txt2 }}>📱 {scan.screentime}j/hr total</span>
                  <span style={{ color: scan.sosmedTime >= 4 ? C.red : C.txt2 }}>🌀 {scan.sosmedTime || 0}j sosmed</span>
                  <span style={{ color: C.accent }}>🤖 {scan.aiToolsTime || 0}j AI tools</span>
                </div>
              )}
            </div>
          )}

          {/* Bottlenecks + Solusi */}
          <div className="card">
            <div className="section-label" style={{ color: C.red }}>● Bottleneck & Cara Mengatasinya</div>
            {d.bottlenecks?.map((b, i) => {
              const masalah = typeof b === "string" ? b : b.masalah;
              const solusi  = typeof b === "string" ? null : b.solusi;
              return (
                <div key={i} style={{ marginBottom: i < d.bottlenecks.length - 1 ? "14px" : 0 }}>
                  <div className="bottleneck-item" style={{ marginBottom: solusi ? "6px" : 0 }}>
                    <span className="bottleneck-num">{String(i + 1).padStart(2, "0")}</span>
                    <span style={{ fontSize: "14px", fontWeight: 500 }}>{masalah}</span>
                  </div>
                  {solusi && (
                    <div style={{
                      marginLeft: "28px", padding: "8px 12px",
                      background: C.greenDim, borderRadius: "6px",
                      borderLeft: `2px solid ${C.green}`,
                      fontSize: "13px", color: C.green, lineHeight: 1.6,
                    }}>
                      → {solusi}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Energy leaks */}
          {d.leaks?.length > 0 && (
            <div className="card">
              <div className="section-label" style={{ color: C.amber }}>⚡ Kebocoran Energi / Waktu</div>
              {d.leaks.map((l, i) => (
                <div key={i} className="leak-item">{l}</div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="card">
            <div className="section-label" style={{ color: C.green }}>→ Tindakan Prioritas</div>
            {d.actions?.map((a, i) => (
              <div key={i} className="action-item">
                <span className="action-time badge"
                  style={{ background: C.greenDim, color: C.green }}>
                  {a.time}
                </span>
                <span style={{ fontSize: "14px" }}>{a.action}</span>
              </div>
            ))}
          </div>

          {/* Insight */}
          {d.insight && (
            <div className="card card-accent">
              <div className="section-label" style={{ color: C.accent }}>◈ Insight</div>
              <p style={{ fontSize: "14px", lineHeight: 1.75 }}>{d.insight}</p>
            </div>
          )}

          {/* Strengths */}
          {d.strengths?.filter(s => s && s !== "null").length > 0 && (
            <div className="card">
              <div className="section-label" style={{ color: C.green }}>✓ Yang Berjalan Baik</div>
              {d.strengths.filter(s => s && s !== "null").map((s, i) => (
                <p key={i} className="txt-sm muted" style={{ marginBottom: "4px" }}>{s}</p>
              ))}
            </div>
          )}

        </div>
      ) : null}
    </div>
  );
}

// ── HistoryView ───────────────────────────────────────────────
function HistoryView({ scans, onSelect }) {
  if (!scans.length) return (
    <div className="empty">
      <div className="empty-icon">◌</div>
      <p className="muted txt-sm">Belum ada scan tersimpan.</p>
    </div>
  );

  const STATUS_COLOR = { red: C.red, amber: C.amber, blue: C.accent, green: C.green };

  return (
    <div>
      <div style={{ fontSize: "19px", fontWeight: 600, marginBottom: ".25rem" }}>Riwayat Scan</div>
      <p className="txt-sm muted" style={{ marginBottom: "1.5rem" }}>{scans.length} scan tersimpan</p>

      {scans.map(s => {
        const d  = s.diagnosis;
        const sc = STATUS_COLOR[d?.statusColor] || C.txt2;
        const pct = cr(s);
        return (
          <div key={s.id} className="card" onClick={() => onSelect(s)}
            style={{ marginBottom: "8px", cursor: "pointer", borderLeft: `3px solid ${sc}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "14px", fontWeight: 500 }}>{weekLabel(s.createdAt)}</span>
              {d
                ? <span className="badge" style={{ color: sc, background: sc + "22" }}>{d.status}</span>
                : <span className="mono txt-xs hint">belum didiagnosis</span>
              }
            </div>
            {d && <p className="txt-sm muted" style={{ marginBottom: "8px", lineHeight: 1.5 }}>{d.headline}</p>}
            <div style={{ display: "flex", gap: "16px", fontSize: "12px" }} className="mono hint">
              <span>tidur {s.avgSleep}j</span>
              <span>selesai {pct}%</span>
              <span>deep work {s.deepWork}j</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── TrendView ─────────────────────────────────────────────────
function TrendView({ scans }) {
  if (scans.length < 2) return (
    <div className="empty">
      <div className="empty-icon">◌</div>
      <p className="muted txt-sm">Butuh minimal 2 scan untuk melihat tren.</p>
    </div>
  );

  const recent = scans.slice(0, 6).reverse();

  function TrendBar({ value, maxVal, color, dateLabel }) {
    const h = Math.max(4, Math.round((value / maxVal) * 80));
    return (
      <div className="trend-bar-wrap">
        <div className="trend-bar-val">{value}</div>
        <div className="trend-bar-h">
          <div className="trend-bar-fill" style={{ height: `${h}px`, background: color }} />
        </div>
        <div className="trend-bar-lbl">{dateLabel}</div>
      </div>
    );
  }

  function dayLabel(iso) {
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }

  const avgSleep = avg(recent.map(s => parseFloat(s.avgSleep)));
  const avgDeep  = avg(recent.map(s => parseFloat(s.deepWork)));
  const avgCr    = avg(recent.map(s => cr(s)));

  return (
    <div>
      <div style={{ fontSize: "19px", fontWeight: 600, marginBottom: ".25rem" }}>Tren</div>
      <p className="txt-sm muted" style={{ marginBottom: "1.5rem" }}>
        Berdasarkan {recent.length} scan terakhir
      </p>

      <div className="stat-grid" style={{ marginBottom: "12px" }}>
        <StatCard label="Rata tidur" value={avgSleep} unit="jam"
          color={parseFloat(avgSleep) >= 7 ? C.green : C.amber} />
        <StatCard label="Completion" value={avgCr} unit="%"
          color={parseFloat(avgCr) >= 70 ? C.green : C.amber} />
        <StatCard label="Deep work"  value={avgDeep} unit="j/hr" color={C.accent} />
      </div>

      {/* Sleep chart */}
      <div className="card" style={{ marginBottom: "10px" }}>
        <div className="mono txt-xs muted" style={{ textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "12px" }}>
          Jam Tidur per Minggu
        </div>
        <div className="trend-bars">
          {recent.map((s, i) => (
            <TrendBar key={i} value={s.avgSleep} maxVal={10}
              color={s.avgSleep >= 7 ? C.green : s.avgSleep >= 6 ? C.amber : C.red}
              dateLabel={dayLabel(s.createdAt)} />
          ))}
        </div>
      </div>

      {/* Completion chart */}
      <div className="card" style={{ marginBottom: "10px" }}>
        <div className="mono txt-xs muted" style={{ textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "12px" }}>
          Task Completion Rate (%)
        </div>
        <div className="trend-bars">
          {recent.map((s, i) => {
            const pct = cr(s);
            return (
              <TrendBar key={i} value={pct} maxVal={100}
                color={pct >= 70 ? C.green : pct >= 40 ? C.amber : C.red}
                dateLabel={dayLabel(s.createdAt)} />
            );
          })}
        </div>
      </div>

      {/* Deep work chart */}
      <div className="card">
        <div className="mono txt-xs muted" style={{ textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "12px" }}>
          Deep Work per Hari (jam)
        </div>
        <div className="trend-bars">
          {recent.map((s, i) => (
            <TrendBar key={i} value={s.deepWork} maxVal={8}
              color={s.deepWork >= 3 ? C.green : s.deepWork >= 1.5 ? C.amber : C.red}
              dateLabel={dayLabel(s.createdAt)} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────
function Dashboard({ scans, go, pick }) {
  const latest = scans[0];
  const d = latest?.diagnosis;
  const STATUS_COLOR = { red: C.red, amber: C.amber, blue: C.accent, green: C.green };
  const sc = STATUS_COLOR[d?.statusColor] || C.txt1;

  return (
    <div>
      <div style={{ marginBottom: "1.75rem" }}>
        <div className="mono txt-xs" style={{ color: C.accent, letterSpacing: ".7px", textTransform: "uppercase", marginBottom: "4px" }}>
          AI Life Scanner
        </div>
        <div style={{ fontSize: "22px", fontWeight: 600, letterSpacing: "-.3px" }}>
          {scans.length === 0 ? "Belum ada scan" : `${scans.length} scan tersimpan`}
        </div>
        <p className="txt-sm muted" style={{ marginTop: ".2rem" }}>
          {scans.length === 0
            ? "Mulai scan pertama untuk mendapatkan diagnosis kondisi kamu."
            : "Tunjukkan data hidupmu, dan AI akan membacanya."}
        </p>
      </div>

      {/* Latest scan card */}
      {latest && d && (
        <div className="card" onClick={() => { pick(latest); go("diagnosis"); }}
          style={{ borderLeft: `3px solid ${sc}`, marginBottom: "12px", cursor: "pointer" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span className="mono txt-xs muted">Scan Terakhir · {fmt(latest.createdAt)}</span>
            <span className="badge" style={{ color: sc, background: sc + "22" }}>{d.status}</span>
          </div>
          <p style={{ fontSize: "15px", marginBottom: "10px", lineHeight: 1.5 }}>{d.headline}</p>
          {d.actions?.[0] && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: C.green }}>
              <span className="badge" style={{ background: C.greenDim, color: C.green, fontSize: "10px" }}>Hari ini</span>
              {d.actions[0].action}
            </div>
          )}
        </div>
      )}

      {/* Aggregate stats */}
      {scans.length >= 2 && (
        <div className="stat-grid" style={{ marginBottom: "12px" }}>
          <StatCard label="Scan" value={scans.length} color={C.accent} />
          <StatCard label="Tidur rata"
            value={avg(scans.slice(0, 4).map(s => parseFloat(s.avgSleep)))} unit="jam"
            color={C.green} />
          <StatCard label="Deep Work"
            value={avg(scans.slice(0, 4).map(s => parseFloat(s.deepWork)))} unit="j"
            color={C.amber} />
        </div>
      )}

      {scans.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem 1rem", borderStyle: "dashed" }}>
          <div className="empty-icon">◎</div>
          <p style={{ fontSize: "15px", color: C.txt1, marginBottom: "6px" }}>Scan pertama hanya butuh 5 menit</p>
          <p className="txt-sm hint" style={{ marginBottom: "1.5rem", lineHeight: 1.6 }}>
            Isi data sederhana minggu ini,<br/>dan AI akan mendiagnosis kondisimu.
          </p>
          <button className="btn" onClick={() => go("form")}>Mulai Scan →</button>
        </div>
      ) : (
        <button className="btn-ghost" onClick={() => go("trend")}
          style={{ width: "100%", fontSize: "13px", borderStyle: "dashed" }}>
          ◈ Lihat tren &amp; perbandingan
        </button>
      )}
    </div>
  );
}

// ── App Root ──────────────────────────────────────────────────
function App() {
  const [view,  setView]  = useState("dashboard");
  const [scans, setScans] = useState([]);
  const [sel,   setSel]   = useState(null);

  useEffect(() => { setScans(db.getAll()); }, []);

  function handleSave(scan) {
    setScans(p => [scan, ...p.filter(s => s.id !== scan.id)]);
    setSel(scan);
    setView("diagnosis");
  }

  function handleUpdate(scan) {
    setScans(p => p.map(s => s.id === scan.id ? scan : s));
    setSel(scan);
  }

  const NAV = [
    { id: "dashboard", label: "Beranda"  },
    { id: "history",   label: "Riwayat"  },
    { id: "trend",     label: "Tren"     },
  ];

  return (
    <div style={{ background: C.bg0, color: C.txt0, minHeight: "100vh", fontFamily: "'Space Grotesk', sans-serif", fontSize: "15px", lineHeight: "1.65" }}>
      {/* Header */}
      <header className="header">
        <div className="logo">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="#58a6ff" strokeWidth="1.5"/>
            <circle cx="8" cy="8" r="3" fill="#58a6ff" opacity=".35"/>
            <line x1="1"  y1="8" x2="4"  y2="8"  stroke="#58a6ff" strokeWidth="1.5"/>
            <line x1="12" y1="8" x2="15" y2="8"  stroke="#58a6ff" strokeWidth="1.5"/>
            <line x1="8"  y1="1" x2="8"  y2="4"  stroke="#58a6ff" strokeWidth="1.5"/>
            <line x1="8"  y1="12" x2="8" y2="15" stroke="#58a6ff" strokeWidth="1.5"/>
          </svg>
          LIFE SCANNER
        </div>
        <nav className="nav">
          {NAV.map(n => (
            <NavBtn key={n.id} label={n.label} active={view === n.id}
              onClick={() => setView(n.id)} />
          ))}
        </nav>
      </header>

      {/* Main */}
      <main className="page">
        {view === "dashboard" && <Dashboard scans={scans} go={setView} pick={setSel} />}
        {view === "form"      && <InputForm onSave={handleSave} onBack={() => setView("dashboard")} />}
        {view === "diagnosis" && sel && <DiagnosisView scan={sel} onBack={() => setView("dashboard")} onUpdate={handleUpdate} />}
        {view === "history"   && <HistoryView scans={scans} onSelect={s => { setSel(s); setView("diagnosis"); }} />}
        {view === "trend"     && <TrendView scans={scans} />}
      </main>

      {/* FAB */}
      {(view === "dashboard" || view === "history") && (
        <button className="fab" onClick={() => setView("form")}>+</button>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
