"use client";

import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CAR_CATALOG } from "@/lib/car-catalog";
import {
  type AeroPackage,
  type FinishType,
  type LightingMode,
  type PaintTier,
  type PerfPackage,
  type WheelStyle,
  useConfiguratorStore,
} from "@/store/configurator-store";
import { MotionSlider } from "./motion-slider";

interface HudPanelProps {
  locked: boolean;
}

interface SwatchSpec {
  color: string;
  tier: PaintTier;
  name: string;
}

interface GlowSpec {
  color: string;
  name: string;
}

const paintSwatches: SwatchSpec[] = [
  { color: "#0c0f17", tier: "standard", name: "Midnight Slate" },
  { color: "#151515", tier: "standard", name: "Shadow Black" },
  { color: "#1b2439", tier: "standard", name: "Storm Navy" },
  { color: "#00f0ff", tier: "premium", name: "Aqua Burst" },
  { color: "#7d5cff", tier: "premium", name: "Hyper Violet" },
  { color: "#ff2f8f", tier: "premium", name: "Tokyo Magenta" },
];

const underglowSwatches: GlowSpec[] = [
  { color: "#00f0ff", name: "Neon Cyan" },
  { color: "#ff2f8f", name: "Magenta" },
  { color: "#a3ff12", name: "Acid Lime" },
  { color: "#7d5cff", name: "Ultra Violet" },
  { color: "#000000", name: "Off" },
];

const aeroOptions: Array<{ id: AeroPackage; label: string; upcharge: number }> = [
  { id: "stock", label: "Stock", upcharge: 0 },
  { id: "street", label: "Street Kit", upcharge: 5800 },
  { id: "race", label: "Race Widebody", upcharge: 12800 },
];

const finishOptions: Array<{ id: FinishType; label: string }> = [
  { id: "gloss", label: "Gloss" },
  { id: "matte", label: "Matte" },
];

const wheelOptions: Array<{ id: WheelStyle; label: string; upcharge: number }> = [
  { id: "stock", label: "Stock Mono", upcharge: 0 },
  { id: "mesh", label: "Mesh Deep Dish", upcharge: 2800 },
  { id: "forged", label: "Forged Neon", upcharge: 5700 },
];

const lightingOptions: Array<{ id: LightingMode; label: string; upcharge: number }> = [
  { id: "city", label: "City", upcharge: 0 },
  { id: "neon", label: "Neon District", upcharge: 1450 },
  { id: "track", label: "Track Flood", upcharge: 2200 },
];

const perfOptions: Array<{ id: PerfPackage; label: string; upcharge: number }> = [
  { id: "none", label: "Factory", upcharge: 0 },
  { id: "pro", label: "Pro Tune", upcharge: 6800 },
  { id: "ultimate", label: "Ultimate Attack", upcharge: 14500 },
];

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function MagneticSwatch({
  color,
  active,
  onClick,
  title,
}: {
  color: string;
  active: boolean;
  onClick: () => void;
  title: string;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  return (
    <motion.button
      type="button"
      title={title}
      className={cn(
        "relative h-8 w-8 rounded-full border transition-colors",
        active ? "border-neon-blue" : "border-white/25",
      )}
      style={{
        background: color,
        x,
        y,
      }}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        x.set(dx * 0.22);
        y.set(dy * 0.22);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
      whileTap={{ scale: 0.88 }}
      whileHover={{ scale: 1.08 }}
      transition={{ type: "spring", stiffness: 420, damping: 26, mass: 0.4 }}
      onClick={onClick}
    >
      {active ? (
        <motion.span
          layoutId={`active-${title}`}
          className="absolute inset-[-4px] rounded-full border border-neon-blue/80"
          transition={{ type: "spring", stiffness: 380, damping: 24 }}
        />
      ) : null}
    </motion.button>
  );
}

function OptionPill({
  active,
  label,
  helper,
  onClick,
}: {
  active: boolean;
  label: string;
  helper: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-md border px-2 py-2 text-left transition",
        active
          ? "border-neon-blue bg-neon-blue/10"
          : "border-white/20 bg-black/20 hover:border-neon-blue/60",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="telemetry-label text-[10px] text-white/78">{label}</span>
        <span className="font-telemetry text-[10px] text-neon-blue">{helper}</span>
      </div>
    </button>
  );
}

function Accordion({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="neon-border overflow-hidden rounded-xl bg-black/40">
      <button
        type="button"
        className="flex w-full items-center justify-between px-3 py-2 text-left"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="telemetry-label text-[10px] text-white/75">{title}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-xs text-neon-blue">
          ▾
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-4 px-3 pb-3">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function HudPanel({ locked }: HudPanelProps) {
  const carId = useConfiguratorStore((state) => state.carId);
  const paintColor = useConfiguratorStore((state) => state.paintColor);
  const finishType = useConfiguratorStore((state) => state.finishType);
  const rideHeight = useConfiguratorStore((state) => state.rideHeight);
  const camber = useConfiguratorStore((state) => state.camber);
  const underglowColor = useConfiguratorStore((state) => state.underglowColor);
  const aeroPackage = useConfiguratorStore((state) => state.aeroPackage);
  const carbonHood = useConfiguratorStore((state) => state.carbonHood);
  const wheelStyle = useConfiguratorStore((state) => state.wheelStyle);
  const lightingMode = useConfiguratorStore((state) => state.lightingMode);
  const perfPackage = useConfiguratorStore((state) => state.perfPackage);
  const modelStatus = useConfiguratorStore((state) => state.modelStatus);
  const activeModelSourceLabel = useConfiguratorStore((state) => state.activeModelSourceLabel);
  const modelErrorMessage = useConfiguratorStore((state) => state.modelErrorMessage);
  const getTotalCost = useConfiguratorStore((state) => state.getTotalCost);

  const setCarId = useConfiguratorStore((state) => state.setCarId);
  const forceModelRetry = useConfiguratorStore((state) => state.forceModelRetry);
  const setPaint = useConfiguratorStore((state) => state.setPaint);
  const setFinishType = useConfiguratorStore((state) => state.setFinishType);
  const setRideHeight = useConfiguratorStore((state) => state.setRideHeight);
  const setCamber = useConfiguratorStore((state) => state.setCamber);
  const setUnderglowColor = useConfiguratorStore((state) => state.setUnderglowColor);
  const setAeroPackage = useConfiguratorStore((state) => state.setAeroPackage);
  const setCarbonHood = useConfiguratorStore((state) => state.setCarbonHood);
  const setWheelStyle = useConfiguratorStore((state) => state.setWheelStyle);
  const setLightingMode = useConfiguratorStore((state) => state.setLightingMode);
  const setPerfPackage = useConfiguratorStore((state) => state.setPerfPackage);

  const activeCar = useMemo(
    () => CAR_CATALOG.find((car) => car.id === carId) ?? CAR_CATALOG[0],
    [carId],
  );

  const liveTotal = getTotalCost();

  const animatedPrice = useSpring(liveTotal, {
    stiffness: 110,
    damping: 26,
    mass: 0.6,
  });

  const roundedPrice = useTransform(animatedPrice, (value) => Math.round(value));
  const [displayPrice, setDisplayPrice] = useState(liveTotal);

  useEffect(() => {
    const unsubscribe = roundedPrice.on("change", (latest) => {
      setDisplayPrice(latest);
    });

    return unsubscribe;
  }, [roundedPrice]);

  useEffect(() => {
    animatedPrice.set(liveTotal);
  }, [liveTotal, animatedPrice]);

  const statusBadgeClass =
    modelStatus === "ready"
      ? "bg-neon-lime/15 text-neon-lime"
      : modelStatus === "loading"
        ? "bg-neon-blue/15 text-neon-blue"
        : "bg-neon-pink/15 text-neon-pink";

  return (
    <>
      <motion.aside
        initial={{ opacity: 0, x: 32 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="glass-panel fixed right-4 top-4 z-40 rounded-2xl px-4 py-3 md:right-8 md:top-8"
      >
        <p className="telemetry-label text-[10px] text-white/60">Total Build</p>
        <p className="font-display text-4xl leading-none tracking-wide text-neon-blue">
          {formatMoney(displayPrice)}
        </p>
        <p className="mt-1 font-telemetry text-[10px] text-white/45">
          BASE: {formatMoney(activeCar.basePrice)}
        </p>
      </motion.aside>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="glass-panel fixed bottom-4 left-4 z-40 h-[min(78vh,760px)] w-[min(92vw,390px)] overflow-hidden rounded-2xl p-3 md:bottom-8 md:left-8"
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-3xl leading-none tracking-wider text-white">CONFIGURE</h2>
          <span
            className={cn(
              "telemetry-label rounded-full px-2 py-1 text-[9px]",
              locked ? "bg-neon-blue/15 text-neon-blue" : "bg-white/10 text-white/70",
            )}
          >
            {locked ? "LOCKED FOCUS" : "SCROLL MODE"}
          </span>
        </div>

        <div className="mb-2 rounded-lg border border-white/10 bg-black/30 px-2 py-2">
          <div className="flex items-center justify-between gap-2">
            <span className="telemetry-label text-[10px] text-white/65">Model Link</span>
            <span className={cn("telemetry-label rounded-full px-2 py-1 text-[9px]", statusBadgeClass)}>
              {modelStatus.toUpperCase()}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 font-telemetry text-[10px] uppercase tracking-telemetry text-white/60">
            {activeModelSourceLabel}
          </p>
          {modelErrorMessage ? (
            <p className="mt-1 line-clamp-2 font-telemetry text-[9px] uppercase tracking-telemetry text-neon-pink/85">
              {modelErrorMessage}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => forceModelRetry()}
            className="mt-2 rounded-md border border-neon-blue/60 bg-neon-blue/10 px-2 py-1 font-telemetry text-[10px] tracking-telemetry text-neon-blue transition hover:bg-neon-blue/20"
          >
            RETRY MODEL
          </button>
        </div>

        <div className="h-[calc(100%-108px)] space-y-2 overflow-y-auto pr-1">
          <Accordion title="GARAGE" defaultOpen>
            <div className="space-y-2">
              {CAR_CATALOG.map((car) => (
                <button
                  key={car.id}
                  type="button"
                  onClick={() => setCarId(car.id)}
                  className={cn(
                    "w-full rounded-md border px-2 py-2 text-left transition",
                    carId === car.id
                      ? "border-neon-blue bg-neon-blue/10"
                      : "border-white/20 bg-black/20 hover:border-neon-blue/60",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="telemetry-label text-[10px] text-white/82">{car.name}</span>
                    <span className="font-telemetry text-[10px]" style={{ color: car.accent }}>
                      {formatMoney(car.basePrice)}
                    </span>
                  </div>
                  <p className="mt-1 font-telemetry text-[10px] uppercase tracking-telemetry text-white/50">
                    {car.subtitle}
                  </p>
                </button>
              ))}
            </div>
          </Accordion>

          <Accordion title="PAINT" defaultOpen>
            <div className="space-y-2">
              <p className="telemetry-label text-[10px] text-white/50">Body Tone</p>
              <div className="flex flex-wrap gap-2">
                {paintSwatches.map((swatch) => (
                  <MagneticSwatch
                    key={swatch.color}
                    color={swatch.color}
                    title={`${swatch.name} - ${swatch.tier}`}
                    active={paintColor.toLowerCase() === swatch.color.toLowerCase()}
                    onClick={() => setPaint(swatch.color, swatch.tier)}
                  />
                ))}
              </div>

              <div className="mt-2 flex gap-2">
                {finishOptions.map((finish) => (
                  <button
                    key={finish.id}
                    type="button"
                    onClick={() => setFinishType(finish.id)}
                    className={cn(
                      "telemetry-label rounded-md border px-2 py-1 text-[10px] transition",
                      finishType === finish.id
                        ? "border-neon-blue text-neon-blue"
                        : "border-white/20 text-white/60 hover:border-neon-blue/60",
                    )}
                  >
                    {finish.label}
                  </button>
                ))}
              </div>
            </div>
          </Accordion>

          <Accordion title="STANCE" defaultOpen>
            <div className="space-y-3">
              <MotionSlider
                label="Ride Height"
                min={-0.32}
                max={0.2}
                step={0.01}
                value={rideHeight}
                onChange={setRideHeight}
                formatValue={(val) => `${(val * 100).toFixed(0)} mm`}
              />
              <MotionSlider
                label="Camber"
                min={-0.28}
                max={0.28}
                step={0.01}
                value={camber}
                onChange={setCamber}
                formatValue={(val) => `${(val * 100).toFixed(0)}°`}
              />

              <div>
                <p className="telemetry-label mb-2 text-[10px] text-white/50">Underglow</p>
                <div className="flex flex-wrap gap-2">
                  {underglowSwatches.map((swatch) => (
                    <MagneticSwatch
                      key={swatch.color}
                      color={swatch.color}
                      title={swatch.name}
                      active={underglowColor.toLowerCase() === swatch.color.toLowerCase()}
                      onClick={() => setUnderglowColor(swatch.color)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Accordion>

          <Accordion title="AERO">
            <div className="space-y-2">
              {aeroOptions.map((option) => (
                <OptionPill
                  key={option.id}
                  active={aeroPackage === option.id}
                  label={option.label}
                  helper={option.upcharge > 0 ? `+${formatMoney(option.upcharge)}` : "INCLUDED"}
                  onClick={() => setAeroPackage(option.id)}
                />
              ))}

              <button
                type="button"
                onClick={() => setCarbonHood(!carbonHood)}
                className={cn(
                  "mt-1 w-full rounded-md border px-2 py-2 text-left transition",
                  carbonHood
                    ? "border-neon-pink bg-neon-pink/10 text-neon-pink"
                    : "border-white/20 bg-black/20 text-white/70 hover:border-neon-pink/60",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="telemetry-label text-[10px]">Carbon Hood</span>
                  <span className="font-telemetry text-xs">+{formatMoney(3400)}</span>
                </div>
              </button>
            </div>
          </Accordion>

          <Accordion title="WHEELS">
            <div className="space-y-2">
              {wheelOptions.map((option) => (
                <OptionPill
                  key={option.id}
                  active={wheelStyle === option.id}
                  label={option.label}
                  helper={option.upcharge > 0 ? `+${formatMoney(option.upcharge)}` : "INCLUDED"}
                  onClick={() => setWheelStyle(option.id)}
                />
              ))}
            </div>
          </Accordion>

          <Accordion title="LIGHTING">
            <div className="space-y-2">
              {lightingOptions.map((option) => (
                <OptionPill
                  key={option.id}
                  active={lightingMode === option.id}
                  label={option.label}
                  helper={option.upcharge > 0 ? `+${formatMoney(option.upcharge)}` : "INCLUDED"}
                  onClick={() => setLightingMode(option.id)}
                />
              ))}
            </div>
          </Accordion>

          <Accordion title="PACKAGES">
            <div className="space-y-2">
              {perfOptions.map((option) => (
                <OptionPill
                  key={option.id}
                  active={perfPackage === option.id}
                  label={option.label}
                  helper={option.upcharge > 0 ? `+${formatMoney(option.upcharge)}` : "INCLUDED"}
                  onClick={() => setPerfPackage(option.id)}
                />
              ))}
            </div>
          </Accordion>
        </div>
      </motion.section>
    </>
  );
}
