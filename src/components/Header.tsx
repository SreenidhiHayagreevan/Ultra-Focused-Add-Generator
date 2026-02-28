"use client";
import { motion } from "framer-motion";

export default function Header() {
  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="relative z-10 flex items-center justify-between px-6 h-12"
      style={{ borderBottom: "1px solid #f0f0f0" }}
    >
      {/* Left - stats */}
      <div className="flex items-center gap-6">
        {[
          { label: "Active", value: "48" },
          { label: "Streams", value: "1,247" },
          { label: "Viewers", value: "34.2M" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 + i * 0.04 }}
            className="flex items-baseline gap-1.5"
          >
            <span className="text-[11px] text-[#8a8f98] font-medium">{s.label}</span>
            <span className="text-[13px] font-semibold text-[#1a1a1a] tabular-nums">{s.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Right - live */}
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#0e6245]">
        <span className="relative flex h-1.5 w-1.5">
          <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-[#0e6245] opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#0e6245]" />
        </span>
        Live
      </div>
    </motion.header>
  );
}
