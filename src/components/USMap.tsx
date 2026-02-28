"use client";
import { useState, useCallback, memo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { motion } from "framer-motion";
import { getStateData } from "@/data/stateData";
import type { StateData } from "@/data/stateData";
import StatePopup from "./StatePopup";

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

function getHeatColor(score: number): string {
  if (score >= 90) return "#635bff";
  if (score >= 80) return "#8a84ff";
  if (score >= 70) return "#a29bfe";
  if (score >= 60) return "#b8b3ff";
  if (score >= 50) return "#d0cdff";
  return "#e8e6ff";
}

interface USMapProps {
  onSelectState: (data: StateData) => void;
}

const USMap = memo(function USMap({ onSelectState }: USMapProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  const hoveredData = hoveredState ? getStateData(hoveredState) : null;

  return (
    <div className="relative w-full h-full" onMouseMove={handleMouseMove}>
      <ComposableMap
        projection="geoAlbersUsa"
        projectionConfig={{ scale: 1100 }}
        className="w-full h-full"
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup center={[-96, 38]} zoom={1}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const stateName = geo.properties.name;
                const stateData = getStateData(stateName);

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => setHoveredState(stateName)}
                    onMouseLeave={() => setHoveredState(null)}
                    onClick={() => {
                      setHoveredState(null);
                      onSelectState(stateData);
                    }}
                    style={{
                      default: {
                        fill: getHeatColor(stateData.hotScore),
                        stroke: "#fff",
                        strokeWidth: 1,
                        transition: "all 0.3s ease",
                      },
                      hover: {
                        fill: "#635bff",
                        stroke: "#fff",
                        strokeWidth: 1.5,
                        filter: "drop-shadow(0 2px 8px rgba(99,91,255,0.3))",
                        transition: "all 0.15s ease",
                      },
                      pressed: {
                        fill: "#4b44d4",
                        stroke: "#fff",
                        strokeWidth: 1.5,
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {hoveredState && (
        <motion.div
          className="fixed pointer-events-none px-2 py-0.5 rounded text-[11px] font-medium text-[#1a1a1a]"
          style={{
            left: mousePos.x + 12,
            top: mousePos.y - 28,
            background: "#fff",
            border: "1px solid #e5e5e5",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            zIndex: 40,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
        >
          {hoveredState}
        </motion.div>
      )}

      <StatePopup data={hoveredData} position={mousePos} />
    </div>
  );
});

export default USMap;
