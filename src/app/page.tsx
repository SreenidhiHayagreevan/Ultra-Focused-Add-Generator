"use client";
import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Legend from "@/components/Legend";
import VideoModal from "@/components/VideoModal";
import type { StateData } from "@/data/stateData";

const USMap = dynamic(() => import("@/components/USMap"), { ssr: false });

const stats = [
  { value: "48", label: "Active states", change: "+2 this week", up: true },
  { value: "1,247", label: "Live streams", change: "+18%", up: true },
  { value: "34.2M", label: "Viewers now", change: "+4.1M today", up: true },
  { value: "$2.4M", label: "Revenue / hr", change: "+12%", up: true },
];

export default function Home() {
  const [selectedState, setSelectedState] = useState<StateData | null>(null);

  const handleSelectState = useCallback((data: StateData) => {
    setSelectedState(data);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedState(null);
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      <Header />

      {/* Stats row */}
      <div className="px-6 py-4 flex gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.04 }}
            className="flex-1 px-4 py-3 rounded-lg"
            style={{ border: "1px solid #f0f0f0" }}
          >
            <div className="text-xl font-semibold text-[#1a1a1a] tabular-nums tracking-tight">
              {s.value}
            </div>
            <div className="text-[11px] text-[#8a8f98] mt-0.5">{s.label}</div>
            <div className="flex items-center gap-1 mt-1.5">
              <svg
                width="10"
                height="10"
                viewBox="0 0 12 12"
                fill={s.up ? "#0e6245" : "#df1b41"}
              >
                <path d={s.up ? "M6 2l4 5H2l4-5z" : "M6 10L2 5h8L6 10z"} />
              </svg>
              <span className="text-[10px] font-medium" style={{ color: s.up ? "#0e6245" : "#df1b41" }}>
                {s.change}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Map */}
      <div className="flex-1 relative min-h-0 mx-6 mb-6 rounded-lg overflow-hidden" style={{ border: "1px solid #f0f0f0" }}>
        <USMap onSelectState={handleSelectState} />
        <Legend />
      </div>

      <VideoModal data={selectedState} onClose={handleCloseModal} />
    </div>
  );
}
