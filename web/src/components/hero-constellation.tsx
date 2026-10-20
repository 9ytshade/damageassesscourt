"use client";

import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  size: number;
  color: string;
  isTriangle: boolean;
  angle: number;
  speed: number;
}

export function HeroConstellation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 560);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener("resize", handleResize);

    const colors = [
      "#8052ff", // Electric Iris
      "#966eff", // Light Iris
      "#ffb829", // Saffron Spark
      "#ffc857", // Light Gold
      "#15846e", // Deep Verdant
      "#02b8cc", // Signal Teal
      "#ffffff", // Bone White
      "#e4f222", // Acid Lime
    ];

    const particleCount = 280;
    const particles: Particle[] = [];

    // Create 3D ellipsoid / neural brain cluster of particles
    for (let i = 0; i < particleCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * 190;

      // Ellipsoid stretch
      const bx = r * Math.sin(phi) * Math.cos(theta) * 1.15;
      const by = r * Math.sin(phi) * Math.sin(theta) * 0.9;
      const bz = r * Math.cos(phi) * 1.05;

      particles.push({
        x: bx,
        y: by,
        z: bz,
        baseX: bx,
        baseY: by,
        baseZ: bz,
        size: Math.random() * 2.8 + 1.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        isTriangle: Math.random() > 0.45,
        angle: Math.random() * Math.PI * 2,
        speed: (Math.random() - 0.5) * 0.006,
      });
    }

    let rotX = 0.15;
    let rotY = 0;
    let mouseX = 0;
    let mouseY = 0;
    let targetRotY = 0;
    let targetRotX = 0.15;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / height - 0.5) * 2;
      targetRotY = nx * 0.4;
      targetRotX = 0.15 + ny * 0.3;
    };

    window.addEventListener("mousemove", handleMouseMove);

    function drawTriangle(
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      angle: number,
      color: string,
      alpha: number
    ) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.866, size * 0.5);
      ctx.lineTo(-size * 0.866, size * 0.5);
      ctx.closePath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = alpha;
      ctx.stroke();
      ctx.restore();
    }

    const render = () => {
      rotY += (targetRotY - rotY) * 0.04 + 0.003;
      rotX += (targetRotX - rotX) * 0.04;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const fov = 380;

      // Project particles to 2D
      const projected = particles.map((p) => {
        p.angle += p.speed;

        // Rotate around Y
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        let x1 = p.baseX * cosY - p.baseZ * sinY;
        let z1 = p.baseZ * cosY + p.baseX * sinY;

        // Rotate around X
        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        let y1 = p.baseY * cosX - z1 * sinX;
        let z2 = z1 * cosX + p.baseY * sinX;

        const scale = fov / (fov + z2 + 200);
        const projX = cx + x1 * scale;
        const projY = cy + y1 * scale;
        const alpha = Math.min(Math.max((z2 + 220) / 440, 0.15), 0.95);

        return {
          ...p,
          projX,
          projY,
          scale,
          alpha,
          z2,
        };
      });

      // Sort by depth
      projected.sort((a, b) => a.z2 - b.z2);

      // Connect nearby particles with hairline constellation edges
      for (let i = 0; i < projected.length; i++) {
        const p1 = projected[i];
        for (let j = i + 1; j < projected.length; j++) {
          const p2 = projected[j];
          const dx = p1.projX - p2.projX;
          const dy = p1.projY - p2.projY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 52) {
            ctx.beginPath();
            ctx.moveTo(p1.projX, p1.projY);
            ctx.lineTo(p2.projX, p2.projY);
            ctx.strokeStyle = p1.color;
            ctx.globalAlpha = (1 - dist / 52) * 0.18 * p1.alpha;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // Draw particle glyphs
      for (const p of projected) {
        if (p.isTriangle) {
          drawTriangle(ctx, p.projX, p.projY, p.size * p.scale * 2.2, p.angle, p.color, p.alpha);
        } else {
          ctx.beginPath();
          ctx.arc(p.projX, p.projY, p.size * p.scale, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="relative w-full h-[480px] sm:h-[560px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none z-10" />
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair select-none"
      />
    </div>
  );
}
