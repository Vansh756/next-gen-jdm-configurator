import { create } from "zustand";
import { CAR_CATALOG, type CarId, getCarById } from "@/lib/car-catalog";

export type FinishType = "gloss" | "matte";
export type PaintTier = "standard" | "premium";
export type AeroPackage = "stock" | "street" | "race";
export type WheelStyle = "stock" | "mesh" | "forged";
export type LightingMode = "city" | "neon" | "track";
export type PerfPackage = "none" | "pro" | "ultimate";

export interface PricingInput {
  carId: CarId;
  paintTier: PaintTier;
  finishType: FinishType;
  rideHeight: number;
  camber: number;
  underglowColor: string;
  aeroPackage: AeroPackage;
  carbonHood: boolean;
  wheelStyle: WheelStyle;
  lightingMode: LightingMode;
  perfPackage: PerfPackage;
}

export const calculateTotalCost = (config: PricingInput): number => {
  const base = getCarById(config.carId).basePrice;
  const paintUpcharge = config.paintTier === "premium" ? 4_500 : 0;
  const finishUpcharge = config.finishType === "matte" ? 1_900 : 0;

  const stanceUpcharge = config.rideHeight < -0.12 ? 1_700 : 0;
  const camberUpcharge = Math.abs(config.camber) > 0.16 ? 900 : 0;
  const underglowUpcharge = config.underglowColor === "#000000" ? 0 : 950;

  const aeroUpcharge =
    config.aeroPackage === "street"
      ? 5_800
      : config.aeroPackage === "race"
        ? 12_800
        : 0;

  const wheelUpcharge =
    config.wheelStyle === "mesh" ? 2_800 : config.wheelStyle === "forged" ? 5_700 : 0;

  const lightingUpcharge =
    config.lightingMode === "neon" ? 1_450 : config.lightingMode === "track" ? 2_200 : 0;

  const perfUpcharge =
    config.perfPackage === "pro"
      ? 6_800
      : config.perfPackage === "ultimate"
        ? 14_500
        : 0;

  const hoodUpcharge = config.carbonHood ? 3_400 : 0;

  return (
    base +
    paintUpcharge +
    finishUpcharge +
    stanceUpcharge +
    camberUpcharge +
    underglowUpcharge +
    aeroUpcharge +
    wheelUpcharge +
    lightingUpcharge +
    perfUpcharge +
    hoodUpcharge
  );
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

interface ConfiguratorState extends PricingInput {
  paintColor: string;
  modelRetryToken: number;
  modelStatus: "loading" | "ready" | "error";
  activeModelSourceLabel: string;
  modelErrorMessage: string | null;
  isInConfiguratorZone: boolean;
  isScrollLocked: boolean;
  isConfiguratorMode: boolean;
  setCarId: (carId: CarId) => void;
  forceModelRetry: () => void;
  setModelRuntime: (payload: {
    status: "loading" | "ready" | "error";
    sourceLabel?: string;
    errorMessage?: string | null;
  }) => void;
  setPaint: (paintColor: string, paintTier?: PaintTier) => void;
  setFinishType: (finishType: FinishType) => void;
  setRideHeight: (rideHeight: number) => void;
  setCamber: (camber: number) => void;
  setUnderglowColor: (underglowColor: string) => void;
  setAeroPackage: (aeroPackage: AeroPackage) => void;
  setCarbonHood: (carbonHood: boolean) => void;
  setWheelStyle: (wheelStyle: WheelStyle) => void;
  setLightingMode: (lightingMode: LightingMode) => void;
  setPerfPackage: (perfPackage: PerfPackage) => void;
  setConfiguratorZone: (isInConfiguratorZone: boolean) => void;
  setScrollLocked: (isScrollLocked: boolean) => void;
  unlockConfigurator: () => void;
  setConfiguratorMode: (isConfiguratorMode: boolean) => void;
  getTotalCost: () => number;
}

export const useConfiguratorStore = create<ConfiguratorState>((set, get) => ({
  carId: CAR_CATALOG[0].id,
  paintColor: "#0c0f17",
  paintTier: "standard",
  finishType: "gloss",
  rideHeight: -0.08,
  camber: 0.06,
  underglowColor: "#00f0ff",
  aeroPackage: "stock",
  carbonHood: false,
  wheelStyle: "stock",
  lightingMode: "city",
  perfPackage: "none",
  modelRetryToken: 0,
  modelStatus: "loading",
  activeModelSourceLabel: "Booting model stream",
  modelErrorMessage: null,
  isInConfiguratorZone: false,
  isScrollLocked: false,
  isConfiguratorMode: false,

  setCarId: (carId) => set({ carId, modelErrorMessage: null, modelStatus: "loading" }),
  forceModelRetry: () =>
    set((state) => ({
      modelRetryToken: state.modelRetryToken + 1,
      modelErrorMessage: null,
      modelStatus: "loading",
    })),
  setModelRuntime: ({ status, sourceLabel, errorMessage = null }) =>
    set((state) => ({
      modelStatus: status,
      activeModelSourceLabel: sourceLabel ?? state.activeModelSourceLabel,
      modelErrorMessage: errorMessage,
    })),
  setPaint: (paintColor, paintTier = "standard") => set({ paintColor, paintTier }),
  setFinishType: (finishType) => set({ finishType }),
  setRideHeight: (rideHeight) => set({ rideHeight: clamp(rideHeight, -0.32, 0.2) }),
  setCamber: (camber) => set({ camber: clamp(camber, -0.28, 0.28) }),
  setUnderglowColor: (underglowColor) => set({ underglowColor }),
  setAeroPackage: (aeroPackage) => set({ aeroPackage }),
  setCarbonHood: (carbonHood) => set({ carbonHood }),
  setWheelStyle: (wheelStyle) => set({ wheelStyle }),
  setLightingMode: (lightingMode) => set({ lightingMode }),
  setPerfPackage: (perfPackage) => set({ perfPackage }),
  setConfiguratorZone: (isInConfiguratorZone) =>
    set((state) => ({
      isInConfiguratorZone,
      isConfiguratorMode: isInConfiguratorZone ? state.isConfiguratorMode : false,
      isScrollLocked: isInConfiguratorZone ? state.isScrollLocked : false,
    })),
  setScrollLocked: (isScrollLocked) =>
    set(() => ({
      isScrollLocked,
      isConfiguratorMode: isScrollLocked,
    })),
  unlockConfigurator: () =>
    set(() => ({
      isScrollLocked: false,
      isConfiguratorMode: false,
    })),
  setConfiguratorMode: (isConfiguratorMode) => set({ isConfiguratorMode }),
  getTotalCost: () => {
    const state = get();
    return calculateTotalCost({
      carId: state.carId,
      paintTier: state.paintTier,
      finishType: state.finishType,
      rideHeight: state.rideHeight,
      camber: state.camber,
      underglowColor: state.underglowColor,
      aeroPackage: state.aeroPackage,
      carbonHood: state.carbonHood,
      wheelStyle: state.wheelStyle,
      lightingMode: state.lightingMode,
      perfPackage: state.perfPackage,
    });
  },
}));
