"use client";

import { useEffect, useRef } from "react";

// A self-flying, decorative Chaos Bird that auto-navigates Kubernetes pillars.
// Rendered behind the leaderboard UI to bring the gameplay theme to the screen.

interface Pipe {
  x: number;
  gapY: number;
  gapH: number;
  hue: number;
}

const GRAVITY = 1500;
const FLAP_V = -440;
const MAX_FALL = 760;
const BIRD_R = 22;
const SPEED = 150;
const GAP_H = 230;
const PIPE_W = 74;
const SPAWN_GAP = 320; // horizontal distance between pillars
const GROUND_H = 70;

const OBSTACLE_HUES = [212, 258, 168, 28];

export default function FlappyBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

    const state = {
      birdX: 0,
      birdY: 0,
      vy: 0,
      rot: 0,
      pipes: [] as Pipe[],
      distSinceSpawn: 0,
      bgX: 0,
    };

    function resize() {
      const rect = { width: window.innerWidth, height: window.innerHeight };
      W = rect.width;
      H = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.floor(W * dpr);
      canvas!.height = Math.floor(H * dpr);
      canvas!.style.width = `${W}px`;
      canvas!.style.height = `${H}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      state.birdX = W * 0.28;
    }

    function spawnPipe() {
      const margin = 80;
      const minY = margin + GAP_H / 2;
      const maxY = H - GROUND_H - margin - GAP_H / 2;
      const gapY = minY + Math.random() * Math.max(10, maxY - minY);
      state.pipes.push({
        x: W + PIPE_W,
        gapY,
        gapH: GAP_H,
        hue: OBSTACLE_HUES[Math.floor(Math.random() * OBSTACLE_HUES.length)],
      });
    }

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

    function drawKube(cx: number, cy: number, r: number, alpha: number) {
      if (kubeReady) {
        ctx!.save();
        ctx!.globalAlpha = alpha;
        ctx!.drawImage(kube, cx - r, cy - r, r * 2, r * 2);
        ctx!.restore();
      }
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
      ctx!.fillStyle = grad;
      roundRect(p.x, -20, PIPE_W, topH + 20, 12);
      ctx!.fill();
      roundRect(p.x - 5, topH - capH, PIPE_W + 10, capH, 8);
      ctx!.fill();
      roundRect(p.x, botY, PIPE_W, botH + 40, 12);
      ctx!.fill();
      roundRect(p.x - 5, botY, PIPE_W + 10, capH, 8);
      ctx!.fill();

      drawKube(p.x + PIPE_W / 2, topH - capH - 24, 16, 0.95);
      drawKube(p.x + PIPE_W / 2, botY + capH + 24, 16, 0.95);

      ctx!.strokeStyle = "rgba(255,255,255,0.18)";
      ctx!.lineWidth = 2;
      roundRect(p.x, -20, PIPE_W, topH + 20, 12);
      ctx!.stroke();
      roundRect(p.x, botY, PIPE_W, botH + 40, 12);
      ctx!.stroke();
    }

    function drawBackground(dt: number) {
      state.bgX -= SPEED * 0.25 * dt;
      state.bgX %= 60;
      ctx!.save();
      ctx!.strokeStyle = "rgba(124,102,224,0.10)";
      ctx!.lineWidth = 1;
      for (let x = state.bgX; x < W + 60; x += 60) {
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
      const targetRot = Math.max(-0.5, Math.min(1.2, state.vy / 600));
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

    // Simple autopilot: aim for the gap of the next upcoming pillar and flap
    // when dipping below the target so the bird keeps bobbing through.
    function autopilot() {
      let target = H * 0.45;
      let nearest: Pipe | null = null;
      for (const p of state.pipes) {
        if (p.x + PIPE_W > state.birdX - 10) {
          if (!nearest || p.x < nearest.x) nearest = p;
        }
      }
      if (nearest) target = nearest.gapY;
      // Flap when falling below the aim point (with a little lead).
      if (state.birdY > target - 10 && state.vy > -120) {
        state.vy = FLAP_V;
      }
    }

    function update(dt: number) {
      autopilot();
      state.vy = Math.min(state.vy + GRAVITY * dt, MAX_FALL);
      state.birdY += state.vy * dt;

      const floor = H - GROUND_H - BIRD_R;
      if (state.birdY > floor) {
        state.birdY = floor;
        state.vy = FLAP_V;
      }
      if (state.birdY < BIRD_R) {
        state.birdY = BIRD_R;
        state.vy = 0;
      }

      state.distSinceSpawn += SPEED * dt;
      if (state.distSinceSpawn >= SPAWN_GAP) {
        state.distSinceSpawn -= SPAWN_GAP;
        spawnPipe();
      }
      for (const p of state.pipes) p.x -= SPEED * dt;
      state.pipes = state.pipes.filter((p) => p.x + PIPE_W > -20);
    }

    function render(dt: number) {
      ctx!.clearRect(0, 0, W, H);
      drawBackground(dt);
      for (const p of state.pipes) drawPipe(p);
      drawGround();
      drawBird();
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
    state.birdY = H * 0.45;
    state.distSinceSpawn = SPAWN_GAP;
    spawnPipe();
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        opacity: 0.28,
        pointerEvents: "none",
      }}
    />
  );
}
