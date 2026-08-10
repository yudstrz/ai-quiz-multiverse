import React, { useEffect, useRef } from "react";
import { AvatarConfig, GameMode, QuestionItem } from "../types";
import { sounds } from "../utils/soundEffects";

interface GameCanvasViewProps {
  gameMode: GameMode;
  question: QuestionItem;
  avatarConfig: AvatarConfig;
  onAnswerResult: (isCorrect: boolean, selectedOptionText: string) => void;
  soundEnabled: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export const GameCanvasView: React.FC<GameCanvasViewProps> = ({
  gameMode,
  question,
  avatarConfig,
  onAnswerResult,
  soundEnabled,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    sounds.enabled = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrameId: number | null = null;
    let isTransitioning = false;
    let flashColor: string | null = null;
    let flashAlpha = 0;
    
    // Core game variables
    let gameSpeed = gameMode === "dash" ? 5 : 3.5;
    let bgOffset = 0;
    let frames = 0;
    let screenShake = 0;

    // Player state
    let playerLane = 1; // 0, 1, 2, 3
    let playerX = 80;
    let playerY = canvas.height / 2;
    let playerVY = 0;
    let gravity = 0;
    let isJumping = false;
    let playerAngle = 0;

    // Particles system
    let particles: Particle[] = [];

    const spawnParticles = (x: number, y: number, color: string, count: number, speed: number = 2) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * speed;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          life: 1.0,
          maxLife: 1.0,
          color,
          size: Math.random() * 4 + 2
        });
      }
    };

    const updateAndDrawParticles = (ctx: CanvasRenderingContext2D) => {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
      }
    };

    // Runner / Flappy / Shooter / Dash options
    const optionColors = ["#ef4444", "#3b82f6", "#eab308", "#10b981"];
    let fallingOptions = question.options.map((optText, idx) => ({
      text: optText,
      isCorrect: idx === question.answer,
      color: optionColors[idx % optionColors.length],
      idx,
    }));

    let currentBlockY = -180;
    let currentBlockHeight = 110;
    let flappyWallX = canvas.width + 100;
    
    // Dash setup
    let dashObstacles = fallingOptions.map((opt, i) => ({
      ...opt,
      x: canvas.width + (i * 380) + (Math.random() * 80), // Dynamic spacing
      w: 120,
      h: 75,
      y: canvas.height - 70 - 75 - (Math.random() * 40), // Variable height obstacles
      hit: false,
    }));

    // Shooter setup
    let laser = { active: false, x: 0, y: 0, w: 4, h: 28 };
    let shooterObstacles = fallingOptions.map((opt, i) => {
      const laneW = canvas.width / 4;
      return {
        ...opt,
        startX: i * laneW + laneW / 2 - 38,
        x: i * laneW + laneW / 2 - 38,
        y: -90 - (Math.random() * 50), // Staggered spawn
        w: 76,
        h: 76,
        speedY: gameSpeed * 0.45 + (Math.random() * 0.5), // Variable speed
        hit: false,
        waveOffset: Math.random() * Math.PI * 2, // Zigzag
      };
    });

    // Setup initial positions per mode
    if (gameMode === "flappy") {
      playerX = 80;
      playerY = canvas.height / 2;
      playerVY = 0;
      gravity = 0.25;
    } else if (gameMode === "dash") {
      playerX = 80;
      playerY = canvas.height - 70 - 24;
      playerVY = 0;
      gravity = 0.65;
    }

    // Helper: Draw Glassmorphic Block with Text
    const drawBlock = (
      context: CanvasRenderingContext2D,
      text: string,
      x: number,
      y: number,
      width: number,
      height: number,
      baseColor: string
    ) => {
      context.save();
      // Gradient background
      const grad = context.createLinearGradient(x, y, x, y + height);
      grad.addColorStop(0, baseColor);
      grad.addColorStop(1, `${baseColor}66`); // Add transparency

      context.shadowColor = baseColor;
      context.shadowBlur = 15;
      context.fillStyle = grad;
      
      context.beginPath();
      context.roundRect(x, y, width, height, 12);
      context.fill();

      // Inner highlight / glass reflection
      context.shadowBlur = 0;
      context.strokeStyle = "rgba(255, 255, 255, 0.4)";
      context.lineWidth = 2;
      context.beginPath();
      context.roundRect(x + 1, y + 1, width - 2, height - 2, 11);
      context.stroke();

      // Render Text
      drawCenteredText(context, text, x, y, width, height, 14);
      context.restore();
    };

    // Helper to calculate text height in canvas and render multi-line auto-scaling text
    const drawCenteredText = (
      context: CanvasRenderingContext2D,
      text: string,
      x: number,
      y: number,
      width: number,
      height: number,
      preferredFontSize = 14
    ) => {
      if (!text) return;
      context.save();
      context.beginPath();
      context.rect(x + 2, y + 2, Math.max(0, width - 4), Math.max(0, height - 4));
      context.clip();

      const paddingX = 8;
      const maxAvailableWidth = Math.max(16, width - paddingX * 2);
      const str = text.toString().trim();
      const rawTokens = str.replace(/([_\-/])/g, "$1 ").split(/\s+/).filter((t) => t.length > 0);

      const getWrappedLines = (fontSize: number) => {
        context.font = `bold ${fontSize}px 'Inter', sans-serif`;
        const lines: string[] = [];
        let currentLine = "";

        for (let i = 0; i < rawTokens.length; i++) {
          const token = rawTokens[i];
          const testLine = currentLine ? `${currentLine} ${token}` : token;
          if (context.measureText(testLine).width <= maxAvailableWidth) {
            currentLine = testLine;
          } else {
            if (currentLine) {
              lines.push(currentLine);
              currentLine = "";
            }
            if (context.measureText(token).width > maxAvailableWidth) {
              let charChunk = "";
              for (const char of token) {
                if (context.measureText(charChunk + char).width > maxAvailableWidth) {
                  if (charChunk) lines.push(charChunk);
                  charChunk = char;
                } else {
                  charChunk += char;
                }
              }
              if (charChunk) currentLine = charChunk;
            } else {
              currentLine = token;
            }
          }
        }
        if (currentLine) lines.push(currentLine);
        return lines;
      };

      let bestFontSize = preferredFontSize;
      let finalLines: string[] = [];

      for (let size = preferredFontSize; size >= 8; size--) {
        bestFontSize = size;
        finalLines = getWrappedLines(size);
        context.font = `bold ${size}px 'Inter', sans-serif`;
        const maxLineWidth = Math.max(0, ...finalLines.map((l) => context.measureText(l).width));
        const totalHeight = finalLines.length * (size * 1.3);
        if (maxLineWidth <= maxAvailableWidth && totalHeight <= height - 8) break;
      }

      context.font = `bold ${bestFontSize}px 'Inter', sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = "#ffffff";

      const lineHeight = Math.max(12, bestFontSize * 1.3);
      const totalTextHeight = finalLines.length * lineHeight;
      let startY = y + height / 2 - totalTextHeight / 2 + lineHeight / 2;

      finalLines.forEach((line) => {
        let displayLine = line;
        if (context.measureText(displayLine).width > maxAvailableWidth) {
          while (displayLine.length > 3 && context.measureText(displayLine + "...").width > maxAvailableWidth) {
            displayLine = displayLine.slice(0, -1);
          }
          displayLine += "...";
        }
        context.shadowColor = "#000000";
        context.shadowBlur = 6;
        context.fillText(displayLine, x + width / 2, startY);
        context.shadowBlur = 0;
        startY += lineHeight;
      });
      context.restore();
    };

    const drawPlayer = (x: number, y: number, size: number, angle = 0, forceUpright = false) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      if (avatarConfig.shape === "emoji") {
        ctx.rotate(-angle);
        ctx.font = `${size * 1.8}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(255,255,255,0.4)";
        ctx.shadowBlur = 15;
        ctx.fillText(avatarConfig.emojiChar || "👽", 0, 2);
        ctx.restore();
        return;
      }

      // Outer glow pulse
      const pulse = Math.sin(frames * 0.1) * 5 + 10;
      ctx.shadowBlur = pulse;
      ctx.shadowColor = avatarConfig.color;

      ctx.fillStyle = avatarConfig.color;
      ctx.beginPath();

      if (avatarConfig.shape === "hexagon") {
        for (let i = 0; i < 6; i++) {
          const angle_deg = 60 * i - 30;
          const angle_rad = Math.PI / 180 * angle_deg;
          const px = size * Math.cos(angle_rad);
          const py = size * Math.sin(angle_rad);
          if (i === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }
      } else if (avatarConfig.shape === "square") {
        ctx.rect(-size, -size, size * 2, size * 2);
      } else if (avatarConfig.shape === "circle") {
        ctx.arc(0, 0, size, 0, Math.PI * 2);
      }

      ctx.closePath();
      ctx.fill();

      // Bright inner border
      ctx.shadowBlur = 0;
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      ctx.stroke();

      if (avatarConfig.face) {
        ctx.rotate(-angle);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        let faceOffsetY = 2;

        ctx.shadowColor = "#000000";
        ctx.shadowBlur = 4;
        ctx.fillText(avatarConfig.face, 0, faceOffsetY);
      }
      ctx.restore();
    };

    const triggerAnswer = (isCorrect: boolean, selectedOptText: string) => {
      if (isTransitioning) return;
      isTransitioning = true;

      if (isCorrect) {
        flashColor = "16, 185, 129"; // rgb emerald
        flashAlpha = 0.6;
        sounds.playCorrect();
      } else {
        flashColor = "239, 68, 68"; // rgb red
        flashAlpha = 0.8;
        screenShake = 15; // Trigger screen shake
        sounds.playWrong();
      }

      setTimeout(() => {
        onAnswerResult(isCorrect, selectedOptText);
      }, 800);
    };

    const shootLaser = () => {
      if (!laser.active && !isTransitioning) {
        const laneW = canvas.width / 4;
        laser.x = playerLane * laneW + laneW / 2;
        laser.y = canvas.height - 80;
        laser.active = true;
        sounds.playLaser();
        spawnParticles(laser.x, laser.y, "#3b82f6", 5, 2);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioning) return;

      if (gameMode === "runner" || gameMode === "shooter") {
        if (e.key === "ArrowLeft" && playerLane > 0) {
          playerLane--;
          spawnParticles(playerLane * (canvas.width / 4) + (canvas.width / 8) + 40, canvas.height - 80, avatarConfig.color, 4, 1);
        } else if (e.key === "ArrowRight" && playerLane < 3) {
          playerLane++;
          spawnParticles(playerLane * (canvas.width / 4) + (canvas.width / 8) - 40, canvas.height - 80, avatarConfig.color, 4, 1);
        }

        if (gameMode === "shooter" && (e.key === " " || e.key === "ArrowUp")) {
          shootLaser();
        }
      } else if (gameMode === "flappy") {
        if (e.key === " " || e.key === "ArrowUp") {
          playerVY = -6.5;
          spawnParticles(playerX, playerY + 10, "#ffffff", 5, 1.5);
          sounds.playJump();
        }
      } else if (gameMode === "dash") {
        if ((e.key === " " || e.key === "ArrowUp") && !isJumping) {
          playerVY = -12;
          isJumping = true;
          spawnParticles(playerX, playerY + 20, "#e2e8f0", 8, 2);
          sounds.playJump();
        }
      }
    };

    const handleTouchOrClick = (e: MouseEvent | TouchEvent) => {
      if (isTransitioning) return;
      const rect = canvas.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const canvasX = (clientX - rect.left) * (canvas.width / rect.width);

      if (gameMode === "runner" || gameMode === "shooter") {
        const laneW = canvas.width / 4;
        const clickedLane = Math.floor(canvasX / laneW);
        playerLane = Math.min(Math.max(clickedLane, 0), 3);
        spawnParticles(playerLane * laneW + laneW / 2, canvas.height - 80, avatarConfig.color, 5, 1);

        if (gameMode === "shooter") {
          shootLaser();
        }
      } else if (gameMode === "flappy") {
        playerVY = -6.5;
        spawnParticles(playerX, playerY + 10, "#ffffff", 5, 1.5);
        sounds.playJump();
      } else if (gameMode === "dash") {
        if (!isJumping) {
          playerVY = -12;
          isJumping = true;
          spawnParticles(playerX, playerY + 20, "#e2e8f0", 8, 2);
          sounds.playJump();
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isTransitioning) return;
      if (gameMode !== "runner" && gameMode !== "shooter") return;
      
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches[0].clientX;
      const canvasX = (clientX - rect.left) * (canvas.width / rect.width);
      
      const laneW = canvas.width / 4;
      const movedLane = Math.floor(canvasX / laneW);
      
      if (movedLane >= 0 && movedLane <= 3 && playerLane !== movedLane) {
        playerLane = movedLane;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    canvas.addEventListener("click", handleTouchOrClick);
    canvas.addEventListener("touchstart", handleTouchOrClick, { passive: true });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: true });

    // --- GAME UPDATE ENGINE ---
    const update = () => {
      frames++;
      bgOffset = (bgOffset + gameSpeed) % 40;
      if (screenShake > 0) screenShake--;
      if (isTransitioning && flashAlpha > 0) flashAlpha -= 0.02;

      // Particle Trail for Avatar
      if (frames % 4 === 0 && !isTransitioning) {
        if (gameMode === "dash" && !isJumping) {
          spawnParticles(playerX - 15, canvas.height - 70, "#64748b", 1, 0.5);
        } else if (gameMode === "flappy") {
          spawnParticles(playerX - 10, playerY, avatarConfig.color, 1, 0.2);
        }
      }

      if (gameMode === "runner") {
        // Accelerate runner
        gameSpeed += 0.001; 
        currentBlockY += gameSpeed;
        
        if (!isTransitioning) {
          const size = 26;
          const py = canvas.height - 80;
          if (currentBlockY + currentBlockHeight >= py - size && currentBlockY <= py + size) {
            const hitOpt = fallingOptions[playerLane];
            spawnParticles(playerLane * (canvas.width/4) + (canvas.width/8), py, hitOpt.color, 20, 4);
            triggerAnswer(hitOpt.isCorrect, hitOpt.text);
          }
          if (currentBlockY > canvas.height) {
            currentBlockY = -currentBlockHeight;
          }
        }
      } else if (gameMode === "flappy") {
        flappyWallX -= gameSpeed;
        const size = 22;

        if (!isTransitioning) {
          playerY += playerVY;
          playerVY += gravity;

          if (playerY < size) {
            playerY = size;
            playerVY = 0;
          }
          if (playerY > canvas.height - size) {
            playerY = canvas.height - size;
            playerVY = 0;
          }

          playerAngle = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, playerVY * 0.08));
          const wallW = 120;

          if (flappyWallX < playerX + size && flappyWallX + wallW > playerX - size) {
            const laneH = canvas.height / 4;
            let lane = Math.floor(playerY / laneH);
            lane = Math.min(Math.max(lane, 0), 3);
            const hitOpt = fallingOptions[lane];
            spawnParticles(playerX, playerY, hitOpt.color, 25, 5);
            triggerAnswer(hitOpt.isCorrect, hitOpt.text);
          }
        } else {
          playerVY = 0;
          // Idle floating
          playerY += Math.sin(frames * 0.1) * 1.5;
          playerAngle = 0;
        }
      } else if (gameMode === "dash") {
        const groundY = canvas.height - 70;
        const size = 22;

        playerY += playerVY;
        playerVY += gravity;

        if (playerY >= groundY - size) {
          playerY = groundY - size;
          playerVY = 0;
          if (isJumping && !isTransitioning) {
             spawnParticles(playerX, playerY + size, "#94a3b8", 4, 1);
          }
          isJumping = false;
          if (!isTransitioning) playerAngle = 0;
        } else {
          playerAngle += 0.12;
        }

        let farthestX = Math.max(...dashObstacles.map((o) => o.x));

        for (let obs of dashObstacles) {
          obs.x -= gameSpeed;
          if (obs.x + obs.w < -20) {
            obs.x = farthestX + 350 + (Math.random() * 150);
            obs.y = canvas.height - 70 - 75 - (Math.random() * 50);
            farthestX = obs.x;
            obs.hit = false;
          }
        }

        if (!isTransitioning) {
          for (let obs of dashObstacles) {
            if (obs.hit) continue;
            const pRight = playerX + size, pLeft = playerX - size, pBottom = playerY + size, pTop = playerY - size;
            const oLeft = obs.x, oRight = obs.x + obs.w, oTop = obs.y, oBottom = obs.y + obs.h;

            if (pRight > oLeft && pLeft < oRight && pBottom > oTop && pTop < oBottom) {
              obs.hit = true;
              spawnParticles(obs.x + obs.w/2, obs.y + obs.h/2, obs.color, 30, 6);
              triggerAnswer(obs.isCorrect, obs.text);
            }
          }
        }
      } else if (gameMode === "shooter") {
        let allPassed = shooterObstacles.length > 0;

        shooterObstacles.forEach((obs) => {
          obs.y += obs.speedY;
          // Zigzag sine wave movement
          obs.x = obs.startX + Math.sin(frames * 0.05 + obs.waveOffset) * 20;
          if (obs.y < canvas.height) allPassed = false;
        });

        if (allPassed && !isTransitioning) {
          triggerAnswer(false, "Missed all targets");
        }

        if (laser.active) {
          laser.y -= 18;
          spawnParticles(laser.x, laser.y + laser.h, "#60a5fa", 1, 1);
          if (laser.y < -50) laser.active = false;
        }

        if (!isTransitioning && laser.active) {
          for (let obs of shooterObstacles) {
            if (obs.hit) continue;
            if (
              laser.x > obs.x && laser.x < obs.x + obs.w &&
              laser.y > obs.y && laser.y < obs.y + obs.h
            ) {
              laser.active = false;
              obs.hit = true;
              spawnParticles(obs.x + obs.w/2, obs.y + obs.h/2, obs.color, 40, 8);
              triggerAnswer(obs.isCorrect, obs.text);
              break;
            }
          }
        }
      }
    };

    // --- RENDER ENGINE ---
    const render = () => {
      ctx.save();
      
      // Screen Shake application
      if (screenShake > 0) {
        const dx = (Math.random() - 0.5) * screenShake;
        const dy = (Math.random() - 0.5) * screenShake;
        ctx.translate(dx, dy);
      }

      // Cyberpunk Background Gradient (Solid to prevent lag)
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, "#020617");
      bgGrad.addColorStop(1, "#0f172a");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 2;

      if (gameMode === "runner" || gameMode === "shooter") {
        // Neon Grid Lines
        ctx.setLineDash([15, 15]);
        const laneW = canvas.width / 4;
        ctx.shadowColor = "#3b82f6";
        ctx.shadowBlur = 8;
        ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
        for (let i = 1; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(i * laneW, -40 + bgOffset);
          ctx.lineTo(i * laneW, canvas.height);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      } else {
        // Scrolling Horizontal Grid
        ctx.setLineDash([30, 30]);
        ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
        for (let i = 0; i < canvas.height; i += 50) {
          ctx.beginPath();
          ctx.moveTo(-100 - bgOffset * 2, i);
          ctx.lineTo(canvas.width, i);
          ctx.stroke();
        }

        if (gameMode === "dash") {
          ctx.setLineDash([]);
          const groundY = canvas.height - 70;
          const groundGrad = ctx.createLinearGradient(0, groundY, 0, canvas.height);
          groundGrad.addColorStop(0, "#0f172a");
          groundGrad.addColorStop(1, "#020617");
          ctx.fillStyle = groundGrad;
          ctx.fillRect(0, groundY, canvas.width, 70);
          
          // Neon Ground Edge
          ctx.shadowColor = "#3b82f6";
          ctx.shadowBlur = 10;
          ctx.strokeStyle = "#3b82f6";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(0, groundY);
          ctx.lineTo(canvas.width, groundY);
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Speed lines on ground
          ctx.fillStyle = "rgba(59, 130, 246, 0.3)";
          for (let i = 0; i < 5; i++) {
            ctx.fillRect(((bgOffset * (i+2)*5 + i*150) % (canvas.width + 100)) - 100, groundY + 15 + i*10, 40 + i*20, 2);
          }
        }
      }
      ctx.setLineDash([]);

      // Mode-Specific Drawing
      if (gameMode === "runner") {
        const laneW = canvas.width / 4;
        fallingOptions.forEach((opt, i) => {
          const x = i * laneW + 4;
          const w = laneW - 8;
          drawBlock(ctx, opt.text, x, currentBlockY, w, currentBlockHeight, opt.color);
        });

        const px = playerLane * laneW + laneW / 2;
        drawPlayer(px, canvas.height - 80, 24, 0, true);
      } else if (gameMode === "flappy") {
        const laneH = canvas.height / 4;
        const w = 120;

        fallingOptions.forEach((opt, i) => {
          const y = i * laneH;
          drawBlock(ctx, opt.text, flappyWallX, y + 4, w, laneH - 8, opt.color);
        });

        drawPlayer(playerX, playerY, 22, playerAngle);
      } else if (gameMode === "dash") {
        dashObstacles.forEach((obs) => {
          if (obs.hit) return;
          drawBlock(ctx, obs.text, obs.x, obs.y, obs.w, obs.h, obs.color);
        });

        drawPlayer(playerX, playerY, 24, playerAngle);
      } else if (gameMode === "shooter") {
        // Hyperspace Starfield
        ctx.fillStyle = "#e2e8f0";
        for (let i = 0; i < 25; i++) {
          let speed = (i % 3) + 1;
          let sy = ((bgOffset * speed * 3 + i * 80) % canvas.height);
          let sx = (i * 97) % canvas.width;
          ctx.globalAlpha = speed / 3;
          ctx.beginPath();
          ctx.arc(sx, sy, speed, 0, Math.PI*2);
          ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        shooterObstacles.forEach((obs) => {
          if (obs.y > canvas.height || obs.y + obs.h < -50 || obs.hit) return;
          
          // Draw circular glowing target
          ctx.shadowBlur = 15;
          ctx.shadowColor = obs.color;
          ctx.fillStyle = obs.color;
          ctx.beginPath();
          ctx.arc(obs.x + obs.w / 2, obs.y + obs.h / 2, obs.w / 2, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowBlur = 0;
          ctx.strokeStyle = "rgba(255,255,255,0.6)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(obs.x + obs.w / 2, Math.max(obs.y + obs.h / 2, 0), obs.w / 2 - 4, 0, Math.PI * 2);
          ctx.stroke();

          drawCenteredText(ctx, obs.text, obs.x, obs.y, obs.w, obs.h, 12);
        });

        // Laser
        if (laser.active) {
          const glowGrad = ctx.createLinearGradient(laser.x, laser.y, laser.x, laser.y + laser.h);
          glowGrad.addColorStop(0, "#ffffff");
          glowGrad.addColorStop(1, "#3b82f6");
          ctx.fillStyle = glowGrad;
          ctx.shadowBlur = 20;
          ctx.shadowColor = "#60a5fa";
          ctx.beginPath();
          ctx.roundRect(laser.x - laser.w / 2, laser.y, laser.w, laser.h, 4);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        const laneW = canvas.width / 4;
        const px = playerLane * laneW + laneW / 2;
        drawPlayer(px, canvas.height - 60, 22, 0, true);
      }

      // Draw Particles on top
      updateAndDrawParticles(ctx);

      // Flash Color overlay on answer hit
      if (isTransitioning && flashColor && flashAlpha > 0) {
        ctx.fillStyle = `rgba(${flashColor}, ${flashAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      ctx.restore();
    };

    // Loop
    const loop = () => {
      update();
      render();
      animFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      window.removeEventListener("keydown", handleKeyDown);
      canvas.removeEventListener("click", handleTouchOrClick);
      canvas.removeEventListener("touchstart", handleTouchOrClick);
      canvas.removeEventListener("touchmove", handleTouchMove);
    };
  }, [gameMode, question, avatarConfig]);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-md aspect-[2/3] max-h-[70vh] my-auto mx-auto border-2 border-slate-700/50 rounded-2xl overflow-hidden bg-slate-950 shadow-[0_0_40px_rgba(59,130,246,0.15)] select-none touch-none"
    >
      <canvas
        ref={canvasRef}
        width={400}
        height={600}
        className="w-full h-full block bg-slate-950"
      />
    </div>
  );
};
