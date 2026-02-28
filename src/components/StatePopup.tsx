"use client";
import { motion, AnimatePresence } from "framer-motion";
import type { StateData } from "@/data/stateData";

interface StatePopupProps {
  data: StateData | null;
  position: { x: number; y: number };
}

export default function StatePopup({ data, position }: StatePopupProps) {
  const winW = typeof window !== "undefined" ? window.innerWidth : 1920;
  const winH = typeof window !== "undefined" ? window.innerHeight : 1080;

  return (
    <AnimatePresence>
      {data && (
        <motion.div
          key={data.name}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="fixed pointer-events-none"
          style={{
            left: Math.min(position.x + 16, winW - 300),
            top: Math.min(position.y + 4, winH - 380),
            zIndex: 50,
            width: 280,
          }}
        >
          <div
            className="rounded-lg overflow-hidden bg-white"
            style={{
              border: "1px solid #e5e5e5",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            {/* Top */}
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ background: "#635bff" }}
                >
                  {data.abbr}
                </div>
                <div>
                  <span className="text-[13px] font-semibold text-[#1a1a1a]">{data.name}</span>
                  <div className="flex items-center gap-1 mt-px">
                    <span className="w-1 h-1 rounded-full bg-[#0e6245]" />
                    <span className="text-[9px] text-[#0e6245]">{data.activeShow.viewers}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold tabular-nums text-[#1a1a1a]">{data.hotScore}</div>
                <div className="text-[8px] text-[#8a8f98] uppercase tracking-wider">score</div>
              </div>
            </div>

            {/* Thumbnail */}
            <div className="px-2.5 pb-2">
              <div className="relative rounded overflow-hidden">
                <img
                  src={data.activeShow.thumbnail}
                  alt={data.activeShow.title}
                  className="w-full h-[100px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <span
                  className="absolute top-1.5 right-1.5 px-1.5 py-px rounded text-[8px] font-semibold text-white"
                  style={{ background: "#635bff" }}
                >
                  {data.activeShow.injectedBrand}
                </span>
                <span className="absolute bottom-1.5 left-2 text-[10px] font-medium text-white">
                  {data.activeShow.title}
                </span>
              </div>
            </div>

            {/* Trending */}
            <div className="px-3 pb-2.5 pt-1 space-y-1" style={{ borderTop: "1px solid #f5f5f5" }}>
              {data.trending.map((t) => (
                <div key={t.category} className="flex items-center gap-1.5">
                  <span className="text-[10px] w-4 text-center">{t.icon}</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {t.items.map((item) => (
                      <span
                        key={item}
                        className="px-1.5 py-px rounded text-[9px] text-[#5e6370] bg-[#f7f7f8]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
