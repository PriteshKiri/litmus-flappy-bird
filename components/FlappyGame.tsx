"use client";

import { useEffect, useRef } from "react";

interface FlappyGameProps {
  onGameOver: (score: number) => void;
  onScore?: (score: number) => void;
}

type Phase = "ready" | "playing" | "dead";

interface Pipe {
  x: number;
  gapY: number;
  gapH: number;
  passed: boolean;
  hue: number; // pick a CNCF-ish accent per obstacle
}

// Gameplay tuning (units: pixels, seconds).
const GRAVITY = 2000;
const FLAP_V = -520;
const MAX_FALL = 900;
const BIRD_R = 22;
const BASE_SPEED = 165;
const SPEED_RAMP = 4.2; // px/s added per point
const MAX_SPEED = 360;
const BASE_GAP = 215;
const MIN_GAP = 150;
const PIPE_W = 74;
const SPAWN_GAP = 230; // horizontal distance between pipes
const GROUND_H = 70;

// Kubernetes-blue obstacle palette + a couple of CNCF-flavoured accents.
const OBSTACLE_HUES = [212, 258, 168, 28];

export default function FlappyGame({ onGameOver, onScore }: FlappyGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onGameOverRef = useRef(onGameOver);
  const onScoreRef = useRef(onScore);
  onGameOverRef.current = onGameOver;
  onScoreRef.current = onScore;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const bird = new Image();
    bird.src = "/litmus-bird.png";
    let birdReady = false;
    bird.onload = () => {
      birdReady = true;
    };

    const kube = new Image();
    kube.src = "/kubernetes-logo.png";
    let kubeReady = false;
    kube.onload = () => {
      kubeReady = true;
    };

    // Mutable game state (kept out of React to avoid re-render churn).
    const state = {
      phase: "ready" as Phase,
      birdX: 0,
      birdY: 0,
      vy: 0,
      rot: 0,
      pipes: [] as Pipe[],
      distSinceSpawn: 0,
      score: 0,
      speed: BASE_SPEED,
      t: 0,
      bob: 0,
      shake: 0,
    };

    function resize() {
      const parent = canvas!.parentElement;
      const rect = parent
        ? parent.getBoundingClientRect()
        : { width: window.innerWidth, height: window.innerHeight };
      W = Math.max(280, rect.width);
      H = Math.max(360, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.floor(W * dpr);
      canvas!.height = Math.floor(H * dpr);
      canvas!.style.width = `${W}px`;
      canvas!.style.height = `${H}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (state.phase === "ready") {
        state.birdX = W * 0.3;
        state.birdY = H * 0.45;
      }
    }

    function reset() {
      state.phase = "ready";
      state.birdX = W * 0.3;
      state.birdY = H * 0.45;
      state.vy = 0;
      state.rot = 0;
      state.pipes = [];
      state.distSinceSpawn = SPAWN_GAP;
      state.score = 0;
      state.speed = BASE_SPEED;
      state.shake = 0;
    }

    function spawnPipe() {
      const gapH = Math.max(MIN_GAP, BASE_GAP - state.score * 1.5);
      const margin = 60;
      const minY = margin + gapH / 2;
      const maxY = H - GROUND_H - margin - gapH / 2;
      const gapY = minY + Math.random() * Math.max(10, maxY - minY);
      state.pipes.push({
        x: W + PIPE_W,
        gapY,
        gapH,
        passed: false,
        hue: OBSTACLE_HUES[Math.floor(Math.random() * OBSTACLE_HUES.length)],
      });
    }

    function flap() {
      if (state.phase === "ready") {
        state.phase = "playing";
        state.vy = FLAP_V;
      } else if (state.phase === "playing") {
        state.vy = FLAP_V;
      }
    }

    function die() {
      if (state.phase !== "playing") return;
      state.phase = "dead";
      state.shake = 1;
      const finalScore = state.score;
      window.setTimeout(() => onGameOverRef.current(finalScore), 650);
    }

    // ---- input ----
    function onPointer(e: Event) {
      e.preventDefault();
      flap();
    }
    function onKey(e: KeyboardEvent) {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        flap();
      }
    }
    canvas.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);

    // ---- drawing helpers ----
    function roundRect(x: number, y: number, w: number, h: number, r: number) {
      const rr = Math.min(r, w / 2, h / 2);
      ctx!.beginPath();
      ctx!.moveTo(x + rr, y);
      ctx!.arcTo(x + w, y, x + w, y + h, rr);
      ctx!.arcTo(x + w, y + h, x, y + h, rr);
      ctx!.arcTo(x, y + h, x, y, rr);
      ctx!.arcTo(x, y, x + w, y, rr);
      ctx!.closePath();
    }

    // Real Kubernetes logo; falls back to a procedural wheel until it loads.
    function drawKube(cx: number, cy: number, r: number, alpha: number) {
      if (kubeReady) {
        ctx!.save();
        ctx!.globalAlpha = alpha;
        ctx!.drawImage(kube, cx - r, cy - r, r * 2, r * 2);
        ctx!.restore();
      } else {
        drawHelm(cx, cy, r, alpha);
      }
    }

    // Procedural fallback: 7-spoke helm wheel emblem.
    function drawHelm(cx: number, cy: number, r: number, alpha: number) {
      ctx!.save();
      ctx!.globalAlpha = alpha;
      ctx!.strokeStyle = "rgba(255,255,255,0.9)";
      ctx!.lineWidth = Math.max(1.5, r * 0.16);
      ctx!.beginPath();
      ctx!.arc(cx, cy, r, 0, Math.PI * 2);
      ctx!.stroke();
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
        ctx!.beginPath();
        ctx!.moveTo(cx + Math.cos(a) * r * 0.35, cy + Math.sin(a) * r * 0.35);
        ctx!.lineTo(cx + Math.cos(a) * r * 0.92, cy + Math.sin(a) * r * 0.92);
        ctx!.stroke();
      }
      ctx!.restore();
    }

    function drawPipe(p: Pipe) {
      const topH = p.gapY - p.gapH / 2;
      const botY = p.gapY + p.gapH / 2;
      const botH = H - GROUND_H - botY;
      const grad = ctx!.createLinearGradient(p.x, 0, p.x + PIPE_W, 0);
      grad.addColorStop(0, `hsl(${p.hue} 70% 58%)`);
      grad.addColorStop(0.5, `hsl(${p.hue} 75% 48%)`);
      grad.addColorStop(1, `hsl(${p.hue} 70% 38%)`);

      const capH = 26;
      // top pillar
      ctx!.fillStyle = grad;
      roundRect(p.x, -20, PIPE_W, topH + 20, 12);
      ctx!.fill();
      roundRect(p.x - 5, topH - capH, PIPE_W + 10, capH, 8);
      ctx!.fill();
      // bottom pillar
      roundRect(p.x, botY, PIPE_W, botH + 40, 12);
      ctx!.fill();
      roundRect(p.x - 5, botY, PIPE_W + 10, capH, 8);
      ctx!.fill();

      // Kubernetes logo on each pillar cap
      drawKube(p.x + PIPE_W / 2, topH - capH - 24, 16, 0.95);
      drawKube(p.x + PIPE_W / 2, botY + capH + 24, 16, 0.95);

      // subtle edge highlight
      ctx!.strokeStyle = "rgba(255,255,255,0.18)";
      ctx!.lineWidth = 2;
      roundRect(p.x, -20, PIPE_W, topH + 20, 12);
      ctx!.stroke();
      roundRect(p.x, botY, PIPE_W, botH + 40, 12);
      ctx!.stroke();
    }

    let bgX = 0;
    function drawBackground(dt: number) {
      if (state.phase === "playing") bgX -= state.speed * 0.25 * dt;
      bgX %= 60;
      // faint hex/grid field for a "cluster" feel
      ctx!.save();
      ctx!.strokeStyle = "rgba(124,102,224,0.10)";
      ctx!.lineWidth = 1;
      for (let x = bgX; x < W + 60; x += 60) {
        ctx!.beginPath();
        ctx!.moveTo(x, 0);
        ctx!.lineTo(x, H);
        ctx!.stroke();
      }
      for (let y = 0; y < H; y += 60) {
        ctx!.beginPath();
        ctx!.moveTo(0, y);
        ctx!.lineTo(W, y);
        ctx!.stroke();
      }
      ctx!.restore();

      // big faint Kubernetes logo drifting in the background
      drawKube((W * 0.7 + bgX * 0.5) % (W + 120), H * 0.25, 60, 0.07);
    }

    function drawGround() {
      const y = H - GROUND_H;
      const grad = ctx!.createLinearGradient(0, y, 0, H);
      grad.addColorStop(0, "#3a2a82");
      grad.addColorStop(1, "#241857");
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, y, W, GROUND_H);
      ctx!.fillStyle = "rgba(124,102,224,0.55)";
      ctx!.fillRect(0, y, W, 4);
    }

    function drawBird() {
      ctx!.save();
      ctx!.translate(state.birdX, state.birdY);
      const targetRot =
        state.phase === "playing" || state.phase === "dead"
          ? Math.max(-0.5, Math.min(1.2, state.vy / 600))
          : 0;
      state.rot += (targetRot - state.rot) * 0.2;
      ctx!.rotate(state.rot);
      const size = BIRD_R * 2.6;
      if (birdReady) {
        ctx!.drawImage(bird, -size / 2, -size / 2, size, size);
      } else {
        ctx!.fillStyle = "#f7d94c";
        ctx!.beginPath();
        ctx!.arc(0, 0, BIRD_R, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.restore();
    }

    function drawScore() {
      ctx!.save();
      ctx!.fillStyle = "rgba(255,255,255,0.95)";
      ctx!.font = "800 44px Segoe UI, system-ui, sans-serif";
      ctx!.textAlign = "center";
      ctx!.shadowColor = "rgba(91,66,188,0.7)";
      ctx!.shadowBlur = 18;
      ctx!.fillText(String(state.score), W / 2, 64);
      ctx!.restore();
    }

    function drawReadyHint() {
      ctx!.save();
      ctx!.textAlign = "center";
      ctx!.fillStyle = "rgba(255,255,255,0.92)";
      ctx!.font = "800 22px Segoe UI, system-ui, sans-serif";
      ctx!.fillText("Tap to flap", W / 2, H * 0.62);
      ctx!.fillStyle = "rgba(184,174,224,0.85)";
      ctx!.font = "600 15px Segoe UI, system-ui, sans-serif";
      ctx!.fillText("Dodge the Kubernetes pillars", W / 2, H * 0.62 + 26);
      ctx!.restore();
    }

    // ---- main loop ----
    function update(dt: number) {
      state.t += dt;
      if (state.phase === "ready") {
        state.bob += dt;
        state.birdY = H * 0.45 + Math.sin(state.bob * 3) * 8;
        return;
      }
      if (state.phase === "dead") {
        // let the bird fall after a crash
        state.vy = Math.min(state.vy + GRAVITY * dt, MAX_FALL);
        state.birdY = Math.min(state.birdY + state.vy * dt, H - GROUND_H - BIRD_R);
        if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 3);
        return;
      }

      // playing
      state.speed = Math.min(MAX_SPEED, BASE_SPEED + state.score * SPEED_RAMP);
      state.vy = Math.min(state.vy + GRAVITY * dt, MAX_FALL);
      state.birdY += state.vy * dt;

      state.distSinceSpawn += state.speed * dt;
      if (state.distSinceSpawn >= SPAWN_GAP) {
        state.distSinceSpawn -= SPAWN_GAP;
        spawnPipe();
      }

      for (const p of state.pipes) {
        p.x -= state.speed * dt;
        if (!p.passed && p.x + PIPE_W < state.birdX) {
          p.passed = true;
          state.score += 1;
          onScoreRef.current?.(state.score);
        }
      }
      state.pipes = state.pipes.filter((p) => p.x + PIPE_W > -20);

      // collisions
      if (state.birdY + BIRD_R >= H - GROUND_H) {
        state.birdY = H - GROUND_H - BIRD_R;
        die();
      }
      if (state.birdY - BIRD_R <= 0) {
        state.birdY = BIRD_R;
        state.vy = 0;
      }
      for (const p of state.pipes) {
        const inX = state.birdX + BIRD_R > p.x && state.birdX - BIRD_R < p.x + PIPE_W;
        if (inX) {
          const topH = p.gapY - p.gapH / 2;
          const botY = p.gapY + p.gapH / 2;
          if (state.birdY - BIRD_R < topH || state.birdY + BIRD_R > botY) {
            die();
          }
        }
      }
    }

    function render(dt: number) {
      ctx!.clearRect(0, 0, W, H);
      ctx!.save();
      if (state.shake > 0) {
        const s = state.shake * 8;
        ctx!.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
      }
      drawBackground(dt);
      for (const p of state.pipes) drawPipe(p);
      drawGround();
      drawBird();
      ctx!.restore();
      drawScore();
      if (state.phase === "ready") drawReadyHint();
    }

    let raf = 0;
    let last = performance.now();
    function loop(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      update(dt);
      render(dt);
      raf = requestAnimationFrame(loop);
    }

    const onResize = () => resize();
    window.addEventListener("resize", onResize);
    resize();
    reset();
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("pointerdown", onPointer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        touchAction: "none",
        borderRadius: 18,
      }}
    />
  );
}
