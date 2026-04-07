"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import Image from "next/image";
import { useEffect, useLayoutEffect, useRef } from "react";
import { StreetScene } from "@/components/scene/street-scene";
import { HudPanel } from "@/components/ui/hud-panel";
import { useConfiguratorStore } from "@/store/configurator-store";

const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=2069&auto=format&fit=crop";

gsap.registerPlugin(ScrollTrigger);

export function ConfiguratorExperience() {
  const shellRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const configuratorGateRef = useRef<HTMLDivElement>(null);
  const scrollProgressRef = useRef(0);
  const lenisRef = useRef<Lenis | null>(null);

  const isConfiguratorMode = useConfiguratorStore((state) => state.isConfiguratorMode);
  const isInConfiguratorZone = useConfiguratorStore((state) => state.isInConfiguratorZone);
  const isScrollLocked = useConfiguratorStore((state) => state.isScrollLocked);
  const setConfiguratorZone = useConfiguratorStore((state) => state.setConfiguratorZone);
  const setScrollLocked = useConfiguratorStore((state) => state.setScrollLocked);
  const unlockConfigurator = useConfiguratorStore((state) => state.unlockConfigurator);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      touchMultiplier: 1.18,
      wheelMultiplier: 1,
      infinite: false,
      syncTouch: true,
    });

    lenisRef.current = lenis;

    const raf = (time: number) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) {
      return;
    }

    if (isScrollLocked) {
      lenis.stop();
      document.body.style.overflow = "hidden";
    } else {
      lenis.start();
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isScrollLocked]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        unlockConfigurator();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [unlockConfigurator]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const headlineSegments = headlineRef.current?.querySelectorAll("[data-reveal]");
      if (headlineSegments && headlineSegments.length > 0) {
        gsap.fromTo(
          headlineSegments,
          {
            yPercent: 110,
            opacity: 0,
            filter: "blur(12px)",
          },
          {
            yPercent: 0,
            opacity: 1,
            filter: "blur(0px)",
            duration: 1,
            stagger: 0.14,
            ease: "power4.out",
          },
        );
      }

      ScrollTrigger.create({
        trigger: shellRef.current,
        start: "top top",
        end: "+=1800",
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          scrollProgressRef.current = self.progress;
        },
      });

      ScrollTrigger.create({
        trigger: configuratorGateRef.current,
        start: "top 72%",
        end: "bottom 20%",
        onEnter: () => setConfiguratorZone(true),
        onEnterBack: () => setConfiguratorZone(true),
        onLeave: () => setConfiguratorZone(false),
        onLeaveBack: () => {
          setConfiguratorZone(false);
          unlockConfigurator();
        },
      });
    }, shellRef);

    return () => {
      ctx.revert();
    };
  }, [setConfiguratorZone, unlockConfigurator]);

  return (
    <main ref={shellRef} className="relative min-h-[300vh] bg-obsidian text-white">
      <StreetScene
        scrollProgressRef={scrollProgressRef}
        interactive={isConfiguratorMode}
        className={isConfiguratorMode ? "[filter:saturate(1.1)]" : "[filter:saturate(1)]"}
      />

      <section className="relative z-10 flex min-h-screen items-center">
        <Image
          src={HERO_IMAGE_URL}
          alt="Neon Tokyo night street"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-black/80" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,240,255,0.2),transparent_35%),radial-gradient(circle_at_80%_70%,rgba(255,47,143,0.18),transparent_38%)]" />

        <div
          ref={headlineRef}
          className="relative z-10 mx-auto w-full max-w-7xl px-4 md:px-8"
        >
          <div className="overflow-hidden">
            <p
              data-reveal
              className="telemetry-label mb-2 text-xs text-neon-blue/80 md:text-sm"
            >
              JDM // NEXT-GEN SPEC
            </p>
          </div>

          <div className="overflow-hidden">
            <h1
              data-reveal
              className="font-display text-[clamp(3.6rem,11vw,11.5rem)] leading-[0.8] tracking-[0.08em] text-white"
            >
              BUILD YOUR
            </h1>
          </div>

          <div className="overflow-hidden">
            <h1
              data-reveal
              className="font-display bg-gradient-to-r from-white via-neon-blue to-neon-pink bg-clip-text text-[clamp(3.6rem,11vw,11.5rem)] leading-[0.8] tracking-[0.08em] text-transparent"
            >
              LEGEND
            </h1>
          </div>

          <div className="overflow-hidden">
            <p
              data-reveal
              className="mt-6 max-w-2xl font-telemetry text-[11px] uppercase tracking-telemetry text-white/65 md:text-xs"
            >
              Scroll to ignite the cinematic fly-around. Enter CONFIG mode to lock focus,
              dial stance, camber, paint chemistry, and underglow in real-time.
            </p>
          </div>

          <div className="mt-8 grid max-w-4xl gap-3 md:grid-cols-3">
            <div className="glass-panel rounded-lg px-3 py-2">
              <p className="telemetry-label text-[9px] text-neon-blue/70">Render Stack</p>
              <p className="font-telemetry text-xs uppercase tracking-telemetry text-white/70">
                R3F + Drei + Zustand
              </p>
            </div>
            <div className="glass-panel rounded-lg px-3 py-2">
              <p className="telemetry-label text-[9px] text-neon-pink/80">Motion Engine</p>
              <p className="font-telemetry text-xs uppercase tracking-telemetry text-white/70">
                GSAP + Lenis + Framer
              </p>
            </div>
            <div className="glass-panel rounded-lg px-3 py-2">
              <p className="telemetry-label text-[9px] text-neon-lime/80">Interaction Mode</p>
              <p className="font-telemetry text-xs uppercase tracking-telemetry text-white/70">
                {isScrollLocked ? "ORBIT LOCKED" : "FREE SCROLL"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 h-[120vh]" aria-hidden>
        <div className="sticky top-0 h-screen" />
      </section>

      <section
        ref={configuratorGateRef}
        className="relative z-10 flex min-h-screen items-end justify-start px-4 pb-28 md:px-8"
      >
        <div className="glass-panel max-w-xl rounded-2xl p-4 md:p-6">
          <p className="telemetry-label text-[10px] text-neon-blue">Configurator Protocol</p>
          <h2 className="font-display text-5xl leading-none tracking-wider md:text-6xl">
            ENTER PIT-LAB
          </h2>
          <p className="mt-3 font-telemetry text-[11px] uppercase tracking-telemetry text-white/55">
            This is now dual-mode: free scroll by default, optional lock for precision orbit tuning.
            Tap engage when you want to inspect details, and unlock anytime (ESC supported).
          </p>
          <button
            type="button"
            onClick={() => (isScrollLocked ? unlockConfigurator() : setScrollLocked(true))}
            className="mt-4 rounded-md border border-neon-blue/60 bg-neon-blue/10 px-3 py-2 font-telemetry text-xs tracking-telemetry text-neon-blue transition hover:bg-neon-blue/20"
          >
            {isScrollLocked ? "UNLOCK SCROLL" : "ENGAGE ORBIT LOCK"}
          </button>
        </div>
      </section>

      <section className="relative z-10 min-h-[80vh] px-4 pb-24 md:px-8">
        <div className="mx-auto grid w-full max-w-6xl gap-4 md:grid-cols-3">
          <div className="glass-panel rounded-xl p-4">
            <p className="telemetry-label text-[10px] text-neon-blue">Paint Lab</p>
            <p className="mt-2 font-telemetry text-[11px] uppercase tracking-telemetry text-white/65">
              Multi-layer finish response with live roughness + metalness shifts and carbon hood
              isolation.
            </p>
          </div>
          <div className="glass-panel rounded-xl p-4">
            <p className="telemetry-label text-[10px] text-neon-pink">Stance Tuner</p>
            <p className="mt-2 font-telemetry text-[11px] uppercase tracking-telemetry text-white/65">
              Ride-height body offset and wheel camber interpolation update in real-time.
            </p>
          </div>
          <div className="glass-panel rounded-xl p-4">
            <p className="telemetry-label text-[10px] text-neon-lime">Light Forge</p>
            <p className="mt-2 font-telemetry text-[11px] uppercase tracking-telemetry text-white/65">
              Dynamic underglow + cinematic pit lighting with fast mode swapping for track/city.
            </p>
          </div>
        </div>
      </section>

      {isInConfiguratorZone ? (
        <div className="fixed bottom-8 right-4 z-40 md:right-8">
          <button
            type="button"
            onClick={() => (isScrollLocked ? unlockConfigurator() : setScrollLocked(true))}
            className="glass-panel rounded-md border border-neon-blue/60 px-3 py-2 font-telemetry text-[10px] tracking-telemetry text-neon-blue"
          >
            {isScrollLocked ? "BACK TO SCROLL" : "LOCK ORBIT"}
          </button>
        </div>
      ) : null}

      <HudPanel locked={isConfiguratorMode} />
    </main>
  );
}
