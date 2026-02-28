"use client";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { StateData } from "@/data/stateData";

interface VideoModalProps {
  data: StateData | null;
  onClose: () => void;
}

const socials = [
  { name: "X (Twitter)", icon: "𝕏", bg: "#000000" },
  { name: "Instagram", icon: "◷", bg: "#E1306C" },
  { name: "TikTok", icon: "♪", bg: "#111111" },
  { name: "YouTube", icon: "▶", bg: "#FF0000" },
  { name: "Reddit", icon: "⬡", bg: "#FF4500" },
];

const mid = [
  { name: "Tavily", sub: "Web Search", bg: "#3b82f6" },
  { name: "Yutori", sub: "Trend Analysis", bg: "#8b5cf6" },
];

const chain = [
  { name: "Reka", sub: "AI Analysis", bg: "#f59e0b" },
  { name: "Kling AI", sub: "Video Gen", bg: "#10b981" },
  { name: "Airbyte", sub: "Data Sync", bg: "#635bff" },
];

function PipelineNode({
  name,
  sub,
  bg,
  icon,
  delay = 0,
  output = false,
}: {
  name: string;
  sub?: string;
  bg: string;
  icon?: string;
  delay?: number;
  output?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
      className="flex-shrink-0 rounded-xl px-4 py-3 flex items-center gap-3"
      style={
        output
          ? {
              background: `linear-gradient(135deg, ${bg}, ${bg}dd)`,
              boxShadow: `0 2px 12px ${bg}30, 0 1px 3px rgba(0,0,0,0.08)`,
              color: "#fff",
              minWidth: 100,
            }
          : {
              background: "#fff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
              border: "1px solid #f0f0f0",
              minWidth: icon ? 52 : 100,
            }
      }
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{
          background: output ? "rgba(255,255,255,0.2)" : bg,
          boxShadow: output ? "none" : `0 2px 8px ${bg}25`,
        }}
      >
        {icon || name.charAt(0)}
      </div>
      <div className="min-w-0">
        <div
          className="text-[12px] font-semibold leading-tight truncate"
          style={{ color: output ? "#fff" : "#1a1a1a" }}
        >
          {name}
        </div>
        {sub && (
          <div
            className="text-[10px] mt-px leading-tight truncate"
            style={{ color: output ? "rgba(255,255,255,0.6)" : "#a0a0a0" }}
          >
            {sub}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Connector({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      className="flex-shrink-0 flex items-center mx-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
    >
      <div className="w-6 h-[2px] rounded-full bg-gradient-to-r from-[#e0e0e0] to-[#d0d0d0]" />
      <div
        className="w-0 h-0 flex-shrink-0"
        style={{
          borderTop: "4px solid transparent",
          borderBottom: "4px solid transparent",
          borderLeft: "5px solid #d0d0d0",
        }}
      />
    </motion.div>
  );
}

export default function VideoModal({ data, onClose }: VideoModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (data) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [data, onClose]);

  return (
    <AnimatePresence>
      {data && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(8px)" }}
            onClick={onClose}
          />

          <motion.div
            className="relative w-full max-w-[1080px] max-h-[90vh] bg-white rounded-2xl overflow-hidden flex flex-col"
            style={{
              boxShadow:
                "0 0 0 1px rgba(0,0,0,0.03), 0 24px 80px -12px rgba(0,0,0,0.2), 0 8px 24px -8px rgba(0,0,0,0.08)",
            }}
            initial={{ scale: 0.97, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", damping: 32, stiffness: 380 }}
          >
            {/* ── Header ── */}
            <div
              className="flex items-center justify-between px-6 h-[60px] flex-shrink-0"
              style={{ borderBottom: "1px solid #f0f0f0" }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold text-white"
                  style={{
                    background: "linear-gradient(135deg, #635bff, #8b5cf6)",
                    boxShadow: "0 2px 8px rgba(99,91,255,0.25)",
                  }}
                >
                  {data.abbr}
                </div>
                <div>
                  <div className="text-[15px] font-semibold text-[#1a1a1a] leading-tight">
                    {data.name}
                  </div>
                  <div className="text-[12px] text-[#a0a0a0] leading-tight mt-px">
                    {data.activeShow.title}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div
                  className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white"
                  style={{
                    background: "linear-gradient(135deg, #635bff, #8b5cf6)",
                    boxShadow: "0 2px 8px rgba(99,91,255,0.2)",
                  }}
                >
                  {data.activeShow.injectedBrand}
                </div>
                <div className="flex items-center gap-2 text-[12px] text-[#0e6245] font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-[#0e6245]" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0e6245]" />
                  </span>
                  {data.activeShow.viewers}
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-[#c0c0c0] hover:text-[#1a1a1a] hover:bg-[#f5f5f5] transition-all"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* ── Scrollable ── */}
            <div className="flex-1 overflow-y-auto">
              {/* Video */}
              <div className="relative bg-[#0a0a0a]" style={{ aspectRatio: "16/9" }}>
                {data.activeShow.videoUrl ? (
                  <video className="w-full h-full object-contain" src={data.activeShow.videoUrl} controls autoPlay />
                ) : (
                  <div className="w-full h-full relative flex items-center justify-center">
                    <img src={data.activeShow.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 blur-md" />
                    <div className="relative flex flex-col items-center gap-4">
                      <motion.div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}
                        animate={{ scale: [1, 1.06, 1] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="white" opacity={0.3}><path d="M8 5v14l11-7z" /></svg>
                      </motion.div>
                      <span className="text-[13px] text-white/20 font-medium">No feed available</span>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Pipeline ── */}
              <div className="px-8 py-6">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-[13px] font-semibold text-[#1a1a1a]">Injection Pipeline</span>
                  <span className="text-[11px] text-[#b0b0b0]">Real-time processing flow</span>
                </div>

                <div
                  className="rounded-2xl p-6 overflow-x-auto"
                  style={{
                    background: "#fafafa",
                    border: "1px solid #f0f0f0",
                  }}
                >
                  <div className="flex items-center">
                    {/* Socials */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {socials.map((s, i) => (
                        <PipelineNode key={s.name} name={s.name} icon={s.icon} bg={s.bg} delay={0.05 + i * 0.04} />
                      ))}
                    </div>

                    {/* Fan-in SVG */}
                    <div className="flex-shrink-0 w-12 self-stretch relative">
                      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 48 250" fill="none">
                        {[0, 1, 2, 3, 4].map((i) => {
                          const sy = 28 + i * 50;
                          return (
                            <motion.path
                              key={i}
                              d={`M0 ${sy} C24 ${sy} 24 125 48 125`}
                              stroke="#ddd"
                              strokeWidth="1.5"
                              strokeDasharray="4 3"
                              fill="none"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ delay: 0.2 + i * 0.04, duration: 0.4 }}
                            />
                          );
                        })}
                      </svg>
                    </div>

                    <Connector delay={0.35} />

                    {/* Split to Tavily/Yutori */}
                    <div className="flex flex-col gap-3 flex-shrink-0">
                      {mid.map((m, i) => (
                        <PipelineNode key={m.name} name={m.name} sub={m.sub} bg={m.bg} delay={0.4 + i * 0.06} />
                      ))}
                    </div>

                    <Connector delay={0.5} />

                    {/* Chain: Reka → Kling → Airbyte */}
                    {chain.map((c, i) => (
                      <div key={c.name} className="flex items-center flex-shrink-0">
                        <PipelineNode name={c.name} sub={c.sub} bg={c.bg} delay={0.55 + i * 0.08} />
                        {i < chain.length - 1 && <Connector delay={0.6 + i * 0.08} />}
                      </div>
                    ))}

                    <Connector delay={0.8} />

                    {/* Output */}
                    <PipelineNode name="Output" sub="Live Stream" bg="#635bff" delay={0.85} output />
                  </div>
                </div>

                {/* Animated progress */}
                <div className="relative h-1 mt-4 rounded-full bg-[#f0f0f0] overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 w-24 rounded-full"
                    style={{
                      background: "linear-gradient(90deg, transparent, rgba(99,91,255,0.5), transparent)",
                    }}
                    animate={{ x: ["-96px", "1080px"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              </div>

              {/* ── Trending ── */}
              <div className="px-8 pb-8" style={{ borderTop: "1px solid #f5f5f5" }}>
                <div className="text-[13px] font-semibold text-[#1a1a1a] pt-6 mb-5">
                  Trending in {data.name}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {data.trending.map((t, i) => (
                    <motion.div
                      key={t.category}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 + i * 0.06 }}
                      className="rounded-2xl p-5"
                      style={{
                        background: "#fafafa",
                        border: "1px solid #f0f0f0",
                      }}
                    >
                      <div className="flex items-center gap-2.5 mb-4">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-[16px]"
                          style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0" }}
                        >
                          {t.icon}
                        </div>
                        <span className="text-[13px] font-semibold text-[#1a1a1a]">{t.category}</span>
                      </div>
                      <div className="flex flex-col gap-3">
                        {t.items.map((item, j) => (
                          <div key={item} className="flex items-center gap-3">
                            <span
                              className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                              style={{ background: "#fff", border: "1px solid #ebebeb", color: "#b0b0b0" }}
                            >
                              {j + 1}
                            </span>
                            <span className="text-[13px] text-[#404040]">{item}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
