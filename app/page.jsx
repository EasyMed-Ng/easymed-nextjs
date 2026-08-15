"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Pill,
  Activity,
  MessageCircle,
  Truck,
  Bell,
  Check,
  AlertTriangle,
  Send,
  ChevronRight,
  Radio,
  FileText,
  Clock,
  X,
} from "lucide-react";

/* ---------- design tokens ----------
  bg outer:   #EFF1EC (sage mist)
  frame:      #FBFBF9
  ink:        #16221F
  muted:      #5B6B66
  teal:       #0B4F4A   (trust / clinical)
  teal-lt:    #146B64
  amber:      #E8A33D   (medication / attention)
  red:        #D6472E   (escalation / critical)
  green:      #3F8F5F   (adherence / streak)
------------------------------------- */

const INITIAL_MEDS = [
  { id: "m1", name: "Amlodipine", dose: "5mg", time: "7:00 AM", taken: false },
  { id: "m2", name: "Metformin", dose: "500mg", time: "1:00 PM", taken: false },
  { id: "m3", name: "Lisinopril", dose: "10mg", time: "8:00 PM", taken: false },
];

function Pulse({ level }) {
  // level: 'stable' | 'watch' | 'critical'
  const cfg = {
    stable: { color: "#3F8F5F", label: "Stable", ring: "rgba(63,143,95,0.18)" },
    watch: { color: "#E8A33D", label: "Watch", ring: "rgba(232,163,61,0.22)" },
    critical: { color: "#D6472E", label: "Critical", ring: "rgba(214,71,46,0.22)" },
  }[level];
  return (
    <div className="flex items-center gap-2.5">
      <span className="relative flex h-3 w-3">
        <span
          className="absolute inline-flex h-full w-full rounded-full animate-ping"
          style={{ backgroundColor: cfg.ring }}
        />
        <span
          className="relative inline-flex h-3 w-3 rounded-full"
          style={{ backgroundColor: cfg.color }}
        />
      </span>
      <span
        className="text-[11px] font-semibold tracking-wide uppercase"
        style={{ color: cfg.color, fontFamily: "'IBM Plex Mono', monospace" }}
      >
        {cfg.label}
      </span>
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors"
      style={{ color: active ? "#0B4F4A" : "#9AA5A1" }}
    >
      <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
      <span
        className="text-[10px] font-medium"
        style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
      >
        {label}
      </span>
    </button>
  );
}

function Toast({ message, tone = "teal", onClose }) {
  const bg = tone === "red" ? "#D6472E" : tone === "amber" ? "#E8A33D" : "#0B4F4A";
  useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className="absolute left-4 right-4 top-4 z-50 flex items-start gap-2 rounded-xl px-3.5 py-3 shadow-lg"
      style={{ backgroundColor: bg, fontFamily: "'IBM Plex Sans', sans-serif" }}
    >
      <p className="flex-1 text-[12.5px] leading-snug text-white">{message}</p>
      <button onClick={onClose} className="text-white/80 hover:text-white">
        <X size={14} />
      </button>
    </div>
  );
}

export default function EasyMedPage() {
  const [tab, setTab] = useState("dashboard");
  const [meds, setMeds] = useState(INITIAL_MEDS);
  const [streak, setStreak] = useState(6);
  const [symptoms, setSymptoms] = useState([
    { id: "s0", text: "Mild dizziness after breakfast", severity: "watch", time: "Yesterday, 9:12 AM" },
  ]);
  const [carelinkLog, setCarelinkLog] = useState([]);
  const [toast, setToast] = useState(null);
  const [symptomDraft, setSymptomDraft] = useState("");
  const [chat, setChat] = useState([
    { from: "pharm", text: "Hi Baba Tunde, I'm Pharm. Nkechi, your EasyMed telepharmacist. How can I help today?" },
  ]);
  const [chatDraft, setChatDraft] = useState("");
  const [refillDays, setRefillDays] = useState(4);

  const takenCount = meds.filter((m) => m.taken).length;
  const adherence = Math.round((takenCount / meds.length) * 100);

  const riskLevel = useMemo(() => {
    const critical = symptoms.some((s) => s.severity === "critical");
    if (critical) return "critical";
    const missed = meds.filter((m) => !m.taken).length;
    if (symptoms.some((s) => s.severity === "watch") || missed >= 2) return "watch";
    return "stable";
  }, [symptoms, meds]);

  function toggleMed(id) {
    setMeds((prev) => {
      const next = prev.map((m) => (m.id === id ? { ...m, taken: !m.taken } : m));
      const nowTaken = next.find((m) => m.id === id).taken;
      if (nowTaken) setToast({ message: "Dose logged. AI HealthWatch is tracking your regimen.", tone: "teal" });
      return next;
    });
  }

  function submitSymptom(severity) {
    if (!symptomDraft.trim()) return;
    const entry = {
      id: `s${Date.now()}`,
      text: symptomDraft.trim(),
      severity,
      time: "Just now",
    };
    setSymptoms((prev) => [entry, ...prev]);
    setSymptomDraft("");

    if (severity === "critical") {
      setCarelinkLog((prev) => [
        {
          id: `c${Date.now()}`,
          title: "Critical symptom escalation",
          detail: "14-day adherence + symptom report auto-generated and sent to Dr. Adeyemi (linked physician).",
          time: "Just now",
        },
        ...prev,
      ]);
      setToast({
        message: "AI HealthWatch flagged this as high-risk. Your physician has been alerted — a pharmacist will call within minutes.",
        tone: "red",
      });
      setTab("carelink");
    } else {
      setToast({ message: "Symptom logged. We'll keep monitoring your trend.", tone: "amber" });
    }
  }

  function sendChat() {
    if (!chatDraft.trim()) return;
    const userMsg = { from: "user", text: chatDraft.trim() };
    setChat((prev) => [...prev, userMsg]);
    setChatDraft("");
    setTimeout(() => {
      setChat((prev) => [
        ...prev,
        {
          from: "pharm",
          text: "Got it — that's a common reaction with Amlodipine. Take it with food this evening and log how you feel tomorrow. I'll check your report in 24 hours.",
        },
      ]);
    }, 900);
  }

  function requestRefill() {
    setRefillDays(21);
    setToast({ message: "Refill requested. A verified pharmacy partner will deliver before your supply runs out.", tone: "teal" });
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center p-6"
      style={{ backgroundColor: "#EFF1EC", fontFamily: "'IBM Plex Sans', sans-serif" }}
    >

      {/* phone frame */}
      <div
        className="relative flex h-[780px] w-[380px] flex-col overflow-hidden rounded-[2.25rem] border-8 shadow-2xl"
        style={{ backgroundColor: "#FBFBF9", borderColor: "#16221F" }}
      >
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}

        {/* status bar */}
        <div className="flex items-center justify-between px-5 pb-1 pt-3 text-[11px]" style={{ color: "#16221F" }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>9:41</span>
          <span className="h-1.5 w-16 rounded-full" style={{ backgroundColor: "#16221F", opacity: 0.15 }} />
        </div>

        {/* header */}
        <div className="flex items-center justify-between px-5 pb-3 pt-1">
          <div>
            <p className="text-[11px] uppercase tracking-wider" style={{ color: "#5B6B66" }}>
              Good morning
            </p>
            <h1
              className="text-[19px] font-semibold"
              style={{ color: "#16221F", fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Baba Tunde
            </h1>
          </div>
          <button
            className="relative flex h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: "#F1EEE6" }}
          >
            <Bell size={16} color="#16221F" />
            {carelinkLog.length > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2"
                style={{ backgroundColor: "#D6472E", borderColor: "#FBFBF9" }}
              />
            )}
          </button>
        </div>

        {/* content */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {tab === "dashboard" && (
            <div className="flex flex-col gap-4">
              {/* HealthWatch card */}
              <div
                className="rounded-2xl p-4"
                style={{ backgroundColor: "#0B4F4A" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Radio size={14} color="#EFF1EC" />
                    <span className="text-[11px] font-medium text-white/80">AI HealthWatch</span>
                  </div>
                  <Pulse level={riskLevel} />
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <p
                      className="text-[28px] font-semibold leading-none text-white"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      {adherence}%
                    </p>
                    <p className="mt-1 text-[11px] text-white/70">today's adherence</p>
                  </div>
                  <div className="text-right">
                    <p
                      className="text-[20px] font-semibold leading-none text-white"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      {streak}d
                    </p>
                    <p className="mt-1 text-[11px] text-white/70">streak</p>
                  </div>
                </div>
              </div>

              {/* meds list */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-[13px] font-semibold" style={{ color: "#16221F" }}>
                    Today's medication
                  </h2>
                  <span className="text-[11px]" style={{ color: "#5B6B66" }}>
                    {takenCount}/{meds.length} taken
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {meds.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => toggleMed(m.id)}
                      className="flex items-center justify-between rounded-xl border px-3.5 py-3 text-left transition-colors"
                      style={{
                        borderColor: m.taken ? "#3F8F5F" : "#E7E4DA",
                        backgroundColor: m.taken ? "rgba(63,143,95,0.06)" : "#FFFFFF",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg"
                          style={{ backgroundColor: "#F1EEE6" }}
                        >
                          <Pill size={15} color="#0B4F4A" />
                        </div>
                        <div>
                          <p className="text-[13.5px] font-medium" style={{ color: "#16221F" }}>
                            {m.name} <span style={{ color: "#5B6B66" }}>{m.dose}</span>
                          </p>
                          <p className="text-[11px]" style={{ color: "#5B6B66" }}>
                            {m.time}
                          </p>
                        </div>
                      </div>
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-full border"
                        style={{
                          backgroundColor: m.taken ? "#3F8F5F" : "transparent",
                          borderColor: m.taken ? "#3F8F5F" : "#C9C4B6",
                        }}
                      >
                        {m.taken && <Check size={13} color="#fff" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* refill mini card */}
              <button
                onClick={() => setTab("refill")}
                className="flex items-center justify-between rounded-xl px-3.5 py-3"
                style={{ backgroundColor: "#F1EEE6" }}
              >
                <div className="flex items-center gap-2.5">
                  <Truck size={16} color="#0B4F4A" />
                  <p className="text-[12.5px]" style={{ color: "#16221F" }}>
                    Next refill in <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{refillDays}d</span>
                  </p>
                </div>
                <ChevronRight size={15} color="#5B6B66" />
              </button>
            </div>
          )}

          {tab === "track" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2
                  className="text-[16px] font-semibold"
                  style={{ color: "#16221F", fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Report a symptom
                </h2>
                <p className="mt-1 text-[12px]" style={{ color: "#5B6B66" }}>
                  AI HealthWatch reviews every entry and escalates high-risk patterns automatically.
                </p>
              </div>
              <textarea
                value={symptomDraft}
                onChange={(e) => setSymptomDraft(e.target.value)}
                placeholder="e.g. Chest tightness since this morning..."
                rows={3}
                className="w-full resize-none rounded-xl border px-3.5 py-3 text-[13px] outline-none"
                style={{ borderColor: "#E7E4DA", color: "#16221F" }}
              />
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => submitSymptom("mild")}
                  className="rounded-lg py-2.5 text-[12px] font-medium"
                  style={{ backgroundColor: "#F1EEE6", color: "#16221F" }}
                >
                  Mild
                </button>
                <button
                  onClick={() => submitSymptom("watch")}
                  className="rounded-lg py-2.5 text-[12px] font-medium text-white"
                  style={{ backgroundColor: "#E8A33D" }}
                >
                  Concerning
                </button>
                <button
                  onClick={() => submitSymptom("critical")}
                  className="rounded-lg py-2.5 text-[12px] font-medium text-white"
                  style={{ backgroundColor: "#D6472E" }}
                >
                  Severe
                </button>
              </div>

              <div>
                <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wide" style={{ color: "#5B6B66" }}>
                  Recent log
                </h3>
                <div className="flex flex-col gap-2">
                  {symptoms.map((s) => (
                    <div key={s.id} className="rounded-xl border px-3.5 py-2.5" style={{ borderColor: "#E7E4DA" }}>
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[10px] font-semibold uppercase tracking-wide"
                          style={{
                            color:
                              s.severity === "critical" ? "#D6472E" : s.severity === "watch" ? "#E8A33D" : "#5B6B66",
                          }}
                        >
                          {s.severity}
                        </span>
                        <span className="text-[10.5px]" style={{ color: "#9AA5A1" }}>
                          {s.time}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px]" style={{ color: "#16221F" }}>
                        {s.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "carelink" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2
                  className="text-[16px] font-semibold"
                  style={{ color: "#16221F", fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  CareLink escalations
                </h2>
                <p className="mt-1 text-[12px]" style={{ color: "#5B6B66" }}>
                  Automatic reports sent to your physician when risk is detected.
                </p>
              </div>
              {carelinkLog.length === 0 ? (
                <div
                  className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-10 text-center"
                  style={{ borderColor: "#E7E4DA" }}
                >
                  <FileText size={20} color="#9AA5A1" />
                  <p className="text-[12px]" style={{ color: "#5B6B66" }}>
                    No escalations yet. Report a severe symptom to see how CareLink responds.
                  </p>
                </div>
              ) : (
                carelinkLog.map((c) => (
                  <div key={c.id} className="rounded-xl border px-3.5 py-3" style={{ borderColor: "#F2C9C0", backgroundColor: "#FDF3F1" }}>
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} color="#D6472E" />
                      <p className="text-[12.5px] font-semibold" style={{ color: "#D6472E" }}>
                        {c.title}
                      </p>
                    </div>
                    <p className="mt-1.5 text-[12.5px] leading-snug" style={{ color: "#16221F" }}>
                      {c.detail}
                    </p>
                    <div className="mt-2 flex items-center gap-1 text-[10.5px]" style={{ color: "#9AA5A1" }}>
                      <Clock size={11} />
                      {c.time}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "pharmacy" && (
            <div className="flex h-full flex-col">
              <div className="mb-3 flex items-center gap-2.5 rounded-xl px-3 py-2.5" style={{ backgroundColor: "#F1EEE6" }}>
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-semibold text-white"
                  style={{ backgroundColor: "#0B4F4A" }}
                >
                  N
                </div>
                <div>
                  <p className="text-[12.5px] font-medium" style={{ color: "#16221F" }}>
                    Pharm. Nkechi
                  </p>
                  <p className="text-[10.5px]" style={{ color: "#3F8F5F" }}>
                    Online now
                  </p>
                </div>
              </div>
              <div className="flex-1 space-y-2.5 overflow-y-auto pb-2">
                {chat.map((m, i) => (
                  <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className="max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-snug"
                      style={{
                        backgroundColor: m.from === "user" ? "#0B4F4A" : "#F1EEE6",
                        color: m.from === "user" ? "#fff" : "#16221F",
                      }}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  value={chatDraft}
                  onChange={(e) => setChatDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChat()}
                  placeholder="Ask your pharmacist..."
                  className="flex-1 rounded-full border px-4 py-2.5 text-[12.5px] outline-none"
                  style={{ borderColor: "#E7E4DA", color: "#16221F" }}
                />
                <button
                  onClick={sendChat}
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ backgroundColor: "#0B4F4A" }}
                >
                  <Send size={14} color="#fff" />
                </button>
              </div>
            </div>
          )}

          {tab === "refill" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2
                  className="text-[16px] font-semibold"
                  style={{ color: "#16221F", fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Refill network
                </h2>
                <p className="mt-1 text-[12px]" style={{ color: "#5B6B66" }}>
                  Verified pharmacies, delivered before you run out.
                </p>
              </div>
              <div className="rounded-2xl p-4" style={{ backgroundColor: "#0B4F4A" }}>
                <p className="text-[11px] text-white/70">Next delivery in</p>
                <p
                  className="mt-1 text-[30px] font-semibold leading-none text-white"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {refillDays} days
                </p>
                <button
                  onClick={requestRefill}
                  className="mt-3 w-full rounded-lg py-2.5 text-[12.5px] font-semibold"
                  style={{ backgroundColor: "#E8A33D", color: "#16221F" }}
                >
                  Request refill now
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {["MedPlus Pharmacy — Ikeja", "HealthPlus — Yaba", "PPMV Verified Partner — Surulere"].map((p) => (
                  <div
                    key={p}
                    className="flex items-center justify-between rounded-xl border px-3.5 py-3"
                    style={{ borderColor: "#E7E4DA" }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: "#F1EEE6" }}>
                        <Truck size={14} color="#0B4F4A" />
                      </div>
                      <p className="text-[12.5px]" style={{ color: "#16221F" }}>
                        {p}
                      </p>
                    </div>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ backgroundColor: "rgba(63,143,95,0.12)", color: "#3F8F5F" }}
                    >
                      Verified
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* bottom nav */}
        <div className="flex border-t" style={{ borderColor: "#EDEAE0", backgroundColor: "#FBFBF9" }}>
          <TabBtn active={tab === "dashboard"} onClick={() => setTab("dashboard")} icon={Activity} label="Home" />
          <TabBtn active={tab === "track"} onClick={() => setTab("track")} icon={Pill} label="Track" />
          <TabBtn active={tab === "carelink"} onClick={() => setTab("carelink")} icon={AlertTriangle} label="CareLink" />
          <TabBtn active={tab === "pharmacy"} onClick={() => setTab("pharmacy")} icon={MessageCircle} label="Pharmacist" />
          <TabBtn active={tab === "refill"} onClick={() => setTab("refill")} icon={Truck} label="Refill" />
        </div>
      </div>
    </div>
  );
}
