"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";

interface MotionSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  className?: string;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const snap = (value: number, step: number): number =>
  Math.round(value / step) * step;

export function MotionSlider({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  formatValue,
  className,
}: MotionSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [trackWidth, setTrackWidth] = useState(1);

  const ratio = useMemo(() => {
    const normalized = (value - min) / (max - min);
    return clamp(normalized, 0, 1);
  }, [value, min, max]);

  const updateValue = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) {
        return;
      }

      const rect = track.getBoundingClientRect();
      const normalized = clamp((clientX - rect.left) / rect.width, 0, 1);
      const next = min + (max - min) * normalized;
      onChange(clamp(snap(next, step), min, max));
    },
    [min, max, onChange, step],
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    const measure = () => setTrackWidth(track.getBoundingClientRect().width || 1);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(track);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!dragging) {
      return;
    }

    const onMove = (event: PointerEvent) => updateValue(event.clientX);
    const onEnd = () => setDragging(false);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
    };
  }, [dragging, updateValue]);

  const thumbX = ratio * trackWidth - 10;

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-2 flex items-center justify-between">
        <span className="telemetry-label text-[10px] text-white/60">{label}</span>
        <span className="font-telemetry text-xs text-neon-blue">
          {formatValue ? formatValue(value) : value.toFixed(2)}
        </span>
      </div>

      <div
        ref={trackRef}
        role="slider"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        tabIndex={0}
        className="relative h-8 cursor-grab touch-none"
        onPointerDown={(event) => {
          event.preventDefault();
          setDragging(true);
          updateValue(event.clientX);
        }}
      >
        <div className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 rounded-full bg-white/20" />
        <motion.div
          className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-gradient-to-r from-neon-blue via-neon-violet to-neon-pink"
          animate={{ width: `${ratio * 100}%` }}
          transition={{ type: "spring", stiffness: 220, damping: 30, mass: 0.5 }}
        />

        <motion.div
          className="absolute top-1/2 h-5 w-5 rounded-full border border-neon-blue/80 bg-black/80 shadow-neon"
          animate={{ x: thumbX, y: "-50%", scale: dragging ? 1.15 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 26, mass: 0.45 }}
        />
      </div>
    </div>
  );
}
