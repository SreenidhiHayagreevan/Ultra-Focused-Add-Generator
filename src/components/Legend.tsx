"use client";
import { motion } from "framer-motion";

export default function Legend() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="absolute bottom-3 left-3 z-10 px-2.5 py-2 rounded-lg bg-white"
      style={{
        border: "1px solid #e5e5e5",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      <div className="text-[8px] uppercase tracking-widest text-[#8a8f98] font-medium mb-1">
        Engagement
      </div>
      <div className="flex items-center gap-px">
        {["#e8e6ff", "#d0cdff", "#b8b3ff", "#a29bfe", "#8a84ff", "#635bff"].map(
          (color, i) => (
            <div
              key={i}
              className="w-5 h-1.5"
              style={{
                background: color,
                borderRadius: i === 0 ? "2px 0 0 2px" : i === 5 ? "0 2px 2px 0" : 0,
              }}
            />
          )
        )}
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-[7px] text-[#8a8f98]">Low</span>
        <span className="text-[7px] text-[#8a8f98]">High</span>
      </div>
    </motion.div>
  );
}
