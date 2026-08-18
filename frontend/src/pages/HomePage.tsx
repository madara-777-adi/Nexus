import { useEffect, useRef } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Constants for the animation
const TOPICS = [
  "React",
  "TypeScript",
  "Node.js",
  "Express",
  "MongoDB",
  "Java",
  "Python",
  "C",
  "Data Structures",
  "Algorithms",
  "O(log n)",
  "Binary Tree",
  "Tailwind CSS",
  "Vite",
  "Hash Map",
  "REST API",
  "GraphQL",
  "Docker",
  "Redis",
  "WebSockets",
  "SQL",
  "PostgreSQL",
  "FastAPI",
  "JWT",
  "OAuth",
];
const COLOR_POOL = ["188, 255, 60", "0, 255, 255", "156, 163, 175"];

class DataParticle {
  index: number;
  totalParticles: number;
  radius: number = 0;
  angle: number = 0;
  speed: number = 0;
  text: string = "";
  fontSize: number = 0;
  baseOpacity: number = 0;
  colorStr: string = "";
  x: number = 0;
  y: number = 0;
  canvasWidth: number;
  canvasHeight: number;

  constructor(
    index: number,
    totalParticles: number,
    canvasWidth: number,
    canvasHeight: number,
  ) {
    this.index = index;
    this.totalParticles = totalParticles;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.reset();
  }

  randomFixed(seed: number) {
    const x = Math.sin(this.index * 17.13 + seed) * 10000;
    return x - Math.floor(x);
  }

  reset() {
    const minRadius = 140;
    const maxRadius = Math.max(this.canvasWidth, this.canvasHeight) / 1.05;
    const totalRings = 8;

    const ringIndex = this.index % totalRings;
    const radiusStep = (maxRadius - minRadius) / totalRings;

    this.radius =
      minRadius + ringIndex * radiusStep + (this.randomFixed(1) * 20 - 10);

    const ringOffsetAngle = (ringIndex / totalRings) * Math.PI;
    const particlesInRing = Math.ceil(this.totalParticles / totalRings);
    const particleInRingIndex = Math.floor(this.index / totalRings);

    this.angle =
      ringOffsetAngle + (particleInRingIndex / particlesInRing) * Math.PI * 2;

    const direction = ringIndex % 2 === 0 ? 1 : -1;
    const baseVelocity = 0.0035;

    this.speed = (120 / this.radius) * baseVelocity * direction;
    this.text = TOPICS[Math.floor(this.randomFixed(2) * TOPICS.length)];
    this.fontSize = this.randomFixed(3) * 6 + 12;
    this.baseOpacity = this.randomFixed(4) * 0.35 + 0.25;
    this.colorStr =
      COLOR_POOL[Math.floor(this.randomFixed(5) * COLOR_POOL.length)];
  }

  update(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.angle += this.speed;

    const centerX = this.canvasWidth / 2;
    const centerY = this.canvasHeight / 2;
    this.x = centerX + Math.cos(this.angle) * this.radius;
    this.y = centerY + Math.sin(this.angle) * this.radius;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.font = `bold ${this.fontSize}px monospace`;
    ctx.shadowBlur = 4;
    ctx.shadowColor = `rgba(${this.colorStr}, ${this.baseOpacity})`;

    ctx.fillStyle = `rgba(${this.colorStr}, ${this.baseOpacity})`;
    ctx.fillText(this.text, this.x, this.y);

    ctx.shadowBlur = 0;
  }
}

export function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (loading || isAuthenticated) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: DataParticle[] = [];
    const particleCount = 128;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Re-initialize particles to adapt to new screen bounds
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(
          new DataParticle(i, particleCount, canvas.width, canvas.height),
        );
      }
    };

    const drawCentralVoid = () => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const voidRadius = 260;

      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        voidRadius,
      );

      gradient.addColorStop(0, "rgba(8, 10, 15, 0.95)");
      gradient.addColorStop(0.6, "rgba(8, 10, 15, 0.7)");
      gradient.addColorStop(1, "rgba(8, 10, 15, 0)");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, voidRadius, 0, Math.PI * 2);
      ctx.fill();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.update(canvas.width, canvas.height);
        particle.draw(ctx);
      });

      drawCentralVoid();
      animationRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [loading, isAuthenticated]);

  if (loading) return null;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-midnight text-white flex flex-col items-center justify-center px-4 sm:px-6 py-8 relative overflow-hidden font-sans">
      {/* Orbital Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 pointer-events-none"
      ></canvas>

      {/* Circular Blurred Dark Void Element */}
      <div className="absolute w-[340px] h-[340px] sm:w-[500px] sm:h-[500px] lg:w-[620px] lg:h-[620px] bg-midnight/90 rounded-full blur-2xl pointer-events-none z-0"></div>

      {/* Soft Ambient Lime Glow Layer */}
      <div className="absolute w-[200px] h-[200px] sm:w-[280px] sm:h-[280px] bg-neon-lime/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

      {/* Pure Hero Content Container */}
      <div className="text-center w-full max-w-xl mx-auto flex flex-col items-center gap-4 sm:gap-6 z-10 animate-in fade-in zoom-in-95 duration-700 ease-out">
        {/* Tagline */}
        <div>
          <span className="font-merkur text-neon-lime text-base sm:text-xl lg:text-2xl tracking-widest uppercase block drop-shadow-[0_0_10px_rgba(188,255,60,0.5)]">
            BUILD &bull; LEARN &bull; GROW
          </span>
        </div>

        {/* Title */}
        <div>
          <h1 className="font-neovision text-4xl sm:text-5xl lg:text-6xl text-white tracking-wider leading-tight">
            WELCOME TO <br />
            <span className="text-neon-lime drop-shadow-[0_0_25px_rgba(188,255,60,0.4)]">
              NEXUSSPACE
            </span>
          </h1>
        </div>

        {/* Description */}
        <div>
          <p className="text-gray-300 text-sm sm:text-base max-w-md mx-auto leading-relaxed px-1 font-medium">
            Your next-generation interactive learning environment and workspace.
            Connect, innovate, and master your technical skills.
          </p>
        </div>

        {/* Interactive Button */}
        <div className="mt-2 w-full flex justify-center">
          <Link
            to="/login"
            className="font-neovision font-bold text-sm sm:text-lg w-full max-w-xs sm:w-auto sm:max-w-none min-h-[44px] px-8 sm:px-10 py-3.5 sm:py-4 rounded-full transition-all duration-300 cursor-pointer uppercase tracking-wider relative overflow-hidden bg-neon-lime text-midnight shadow-[0_0_25px_rgba(188,255,60,0.35)] hover:shadow-[0_0_40px_rgba(188,255,60,0.6)] hover:scale-105 inline-flex items-center justify-center"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Continue to Begin
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
