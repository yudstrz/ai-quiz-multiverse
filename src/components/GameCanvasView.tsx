import React, { useEffect, useRef } from "react";
import { AvatarConfig, GameMode, QuestionItem } from "../types";
import { sounds } from "../utils/soundEffects";

interface GameCanvasViewProps {
  gameMode: GameMode;
  question: QuestionItem;
  avatarConfig: AvatarConfig;
  onAnswerResult: (isCorrect: boolean, selectedOptionText: string) => void;
  soundEnabled: boolean;
  streak?: number;
}

// Particle System
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  drag: number;
}

// Shockwave Ring on Impact
interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  life: number;
}

// Floating Score / Feedback Popups
interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  life: number;
  scale: number;
}

export const GameCanvasView: React.FC<GameCanvasViewProps> = ({
  gameMode,
  question,
  avatarConfig,
  onAnswerResult,
  soundEnabled,
  streak = 0,
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

    // --- GAME FEEL ENGINE ---
    // 1. Trauma-based screen shake (polynomial decay)
    let trauma = 0;
    const addTrauma = (amount: number) => {
      trauma = Math.min(1.0, trauma + amount);
    };

    // 2. Hit-Stop / Freeze frame
    let freezeFrames = 0;

    // 3. Squash & stretch physics
    let playerScaleX = 1.0;
    let playerScaleY = 1.0;

    // Core physics & game loop variables
    let gameSpeed = gameMode === "dash" ? 5.2 : 3.6;
    let bgOffset = 0;
    let frames = 0;

    // Particles, shockwaves & floating popups
    let particles: Particle[] = [];
    let shockwaves: Shockwave[] = [];
    let floatingTexts: FloatingText[] = [];

    const spawnParticles = (
      x: number,
      y: number,
      color: string,
      count: number,
      speed = 3
    ) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = (Math.random() * 0.8 + 0.2) * speed;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          life: 1.0,
          maxLife: 1.0,
          color,
          size: Math.random() * 3.5 + 2,
          drag: 0.96,
        });
      }
    };

    const spawnShockwave = (x: number, y: number, color: string, maxRadius = 70) => {
      shockwaves.push({
        x,
        y,
        radius: 6,
        maxRadius,
        color,
        life: 1.0,
      });
    };

    const spawnFloatingText = (
      x: number,
      y: number,
      text: string,
      color: string,
      size = 18
    ) => {
      floatingTexts.push({
        x,
        y,
        text,
        color,
        size,
        life: 1.0,
        scale: 0.4,
      });
    };

    // Player position & movement
    let playerLane = 1; // 0, 1, 2, 3
    let playerX = 80;
    let playerY = canvas.height / 2;
    let targetPlayerX = playerX;
    let playerVY = 0;
    let gravity = 0;
    let isJumping = false;
    let playerAngle = 0;

    // Coyote time & jump buffering for crisp controls
    let jumpBuffer = 0;
    let coyoteTimer = 0;

    // Options mapping - crisp pixel palette tokens
    const optionLetters = ["A", "B", "C", "D"];
    const optionColors = ["#ff3d57", "#3d9bff", "#ffb800", "#00e676"];
    let fallingOptions = question.options.map((optText, idx) => ({
      text: optText,
      label: optionLetters[idx] || `${idx + 1}`,
      isCorrect: idx === question.answer,
      color: optionColors[idx % optionColors.length],
      idx,
    }));

    let currentBlockY = -180;
    let currentBlockHeight = 110;
    let flappyWallX = canvas.width + 120;

    // Dash mode setup: steady ground obstacles with letters
    const groundY = canvas.height - 70;
    let dashObstacles = fallingOptions.map((opt, i) => ({
      ...opt,
      x: canvas.width + 50 + i * 340,
      w: 110,
      h: 62,
      y: groundY - 62,
      hit: false,
    }));

    // Shooter mode setup
    let laser = { active: false, x: 0, y: 0, w: 4, h: 28 };
    const laneW = canvas.width / 4;
    let shooterObstacles = fallingOptions.map((opt, i) => ({
      ...opt,
      startX: i * laneW + laneW / 2,
      x: i * laneW + laneW / 2,
      y: -90 - Math.random() * 60,
      w: 78,
      h: 78,
      speedY: gameSpeed * 0.45 + Math.random() * 0.35,
      hit: false,
      waveOffset: Math.random() * Math.PI * 2,
    }));

    // Mode-specific initial values
    if (gameMode === "runner") {
      playerLane = 1;
      playerX = playerLane * laneW + laneW / 2;
      targetPlayerX = playerX;
      playerY = canvas.height - 80;
    } else if (gameMode === "flappy") {
      playerX = 85;
      playerY = canvas.height / 2;
      playerVY = 0;
      gravity = 0.28;
    } else if (gameMode === "dash") {
      playerX = 85;
      playerY = groundY - 24;
      playerVY = 0;
      gravity = 0.58;
    } else if (gameMode === "shooter") {
      playerLane = 1;
      playerX = playerLane * laneW + laneW / 2;
      targetPlayerX = playerX;
      playerY = canvas.height - 65;
    }

    // --- DRAWING HELPERS ---
    const drawBlock = (
      context: CanvasRenderingContext2D,
      text: string,
      x: number,
      y: number,
      width: number,
      height: number,
      baseColor: string,
      label?: string
    ) => {
      context.save();

      // ── Pixel-art block: solid fill, NO gradient, NO glow ──
      context.shadowBlur = 0;
      context.fillStyle = baseColor;
      context.fillRect(x, y, width, height);

      // 2-px darker pixel outline (bottom-right shadow, top-left highlight)
      context.strokeStyle = "rgba(0,0,0,0.9)";
      context.lineWidth = 2;
      context.strokeRect(x, y, width, height);

      // top/left bright edge (1px)
      context.strokeStyle = "rgba(255,255,255,0.25)";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(x, y + height); context.lineTo(x, y); context.lineTo(x + width, y);
      context.stroke();

      // Letter badge: solid square, no circle
      if (label) {
        const badgeSize = 16;
        context.fillStyle = "rgba(0,0,0,0.7)";
        context.fillRect(x + 4, y + 4, badgeSize, badgeSize);
        context.strokeStyle = "rgba(255,255,255,0.6)";
        context.lineWidth = 1;
        context.strokeRect(x + 4, y + 4, badgeSize, badgeSize);
        context.fillStyle = "#ffffff";
        context.font = "bold 9px monospace";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(label, x + 4 + badgeSize / 2, y + 4 + badgeSize / 2);
      }

      drawCenteredText(context, text, x, y, width, height, 11);
      context.restore();
    };

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
      context.rect(x + 4, y + 4, Math.max(0, width - 8), Math.max(0, height - 8));
      context.clip();

      const paddingX = 10;
      const maxAvailableWidth = Math.max(16, width - paddingX * 2);
      const str = text.toString().trim();
      const rawTokens = str
        .replace(/([_\-/])/g, "$1 ")
        .split(/\s+/)
        .filter((t) => t.length > 0);

      const getWrappedLines = (fontSize: number) => {
      context.font = `bold ${fontSize}px 'Press Start 2P', monospace`;
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
        context.font = `bold ${size}px 'Press Start 2P', monospace`;
        const maxLineWidth = Math.max(
          0,
          ...finalLines.map((l) => context.measureText(l).width)
        );
        const totalHeight = finalLines.length * (size * 1.3);
        if (maxLineWidth <= maxAvailableWidth && totalHeight <= height - 8) break;
      }

      context.font = `bold ${bestFontSize}px 'Press Start 2P', monospace`;
      context.textAlign = "center";
      context.textBaseline = "middle";

      const lineHeight = Math.max(10, bestFontSize * 1.35);
      const totalTextHeight = finalLines.length * lineHeight;
      let startY = y + height / 2 - totalTextHeight / 2 + lineHeight / 2;

      finalLines.forEach((line) => {
        let displayLine = line;
        if (context.measureText(displayLine).width > maxAvailableWidth) {
          while (
            displayLine.length > 3 &&
            context.measureText(displayLine + "...").width > maxAvailableWidth
          ) {
            displayLine = displayLine.slice(0, -1);
          }
          displayLine += "...";
        }
        // Crisp 1px pixel border around text (NES style, no blur)
        context.fillStyle = "#000000";
        context.fillText(displayLine, x + width / 2 + 1, startY + 1);
        context.fillText(displayLine, x + width / 2 - 1, startY - 1);
        context.fillText(displayLine, x + width / 2 + 1, startY - 1);
        context.fillText(displayLine, x + width / 2 - 1, startY + 1);
        context.fillStyle = "#ffffff";
        context.fillText(displayLine, x + width / 2, startY);
        startY += lineHeight;
      });
      context.restore();
    };

    // Draw Player with Squash & Stretch
    const drawPlayer = (
      x: number,
      y: number,
      size: number,
      angle = 0,
      forceUpright = false
    ) => {
      ctx.save();
      ctx.translate(x, y);
      if (!forceUpright) ctx.rotate(angle);
      ctx.scale(playerScaleX, playerScaleY);

      if (avatarConfig.shape === "emoji") {
        if (!forceUpright) ctx.rotate(-angle);
        ctx.shadowBlur = 0;
        ctx.font = `${size * 1.85}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(avatarConfig.emojiChar || "👽", 0, 2);
        ctx.restore();
        return;
      }

      // ── Pixel-art player: NO glow, crisp stepped shapes ──
      ctx.shadowBlur = 0;
      ctx.fillStyle = avatarConfig.color;
      ctx.beginPath();

      if (avatarConfig.shape === "hexagon") {
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 180) * (60 * i - 30);
          const px = size * Math.cos(a);
          const py = size * Math.sin(a);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
      } else if (avatarConfig.shape === "square") {
        ctx.rect(-size, -size, size * 2, size * 2);
      } else if (avatarConfig.shape === "circle") {
        // Pixelated 8-bit circle: stepped octagonal sprite
        const s = size;
        const c = Math.floor(s * 0.4);
        ctx.moveTo(-s + c, -s);
        ctx.lineTo(s - c, -s);
        ctx.lineTo(s, -s + c);
        ctx.lineTo(s, s - c);
        ctx.lineTo(s - c, s);
        ctx.lineTo(-s + c, s);
        ctx.lineTo(-s, s - c);
        ctx.lineTo(-s, -s + c);
      }

      ctx.closePath();
      ctx.fill();

      // 2-px dark pixel border
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(0,0,0,0.95)";
      ctx.stroke();
      // 1-px white highlight edge
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.stroke();

      if (avatarConfig.face) {
        if (!forceUpright) ctx.rotate(-angle);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px 'Press Start 2P', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(avatarConfig.face, 0, 1);
      }
      ctx.restore();
    };

    // Trigger Answer Event with full Layered Feedback
    const triggerAnswer = (isCorrect: boolean, selectedOptText: string) => {
      if (isTransitioning) return;
      isTransitioning = true;

      // Hit-stop freeze frame to sell the impact!
      freezeFrames = isCorrect ? 4 : 8;

      if (isCorrect) {
        flashColor = "16, 185, 129"; // Emerald green
        flashAlpha = 0.55;
        addTrauma(0.25);
        sounds.playCorrect();

        spawnShockwave(playerX, playerY, "#10b981", 90);
        spawnParticles(playerX, playerY, "#10b981", 35, 5);
        spawnFloatingText(playerX, playerY - 30, "+100 PTS!", "#34d399", 22);

        if (streak > 0) {
          spawnFloatingText(
            playerX,
            playerY - 58,
            `🔥 ${streak + 1}X STREAK!`,
            "#fbbf24",
            17
          );
        }
      } else {
        flashColor = "239, 68, 68"; // Neon red
        flashAlpha = 0.75;
        addTrauma(0.75); // Strong screen trauma shake
        sounds.playWrong();

        spawnShockwave(playerX, playerY, "#ef4444", 80);
        spawnParticles(playerX, playerY, "#ef4444", 45, 6);
        spawnFloatingText(playerX, playerY - 30, "MISS!", "#f87171", 22);
      }

      setTimeout(() => {
        onAnswerResult(isCorrect, selectedOptText);
      }, 750);
    };

    const shootLaser = () => {
      if (!laser.active && !isTransitioning) {
        laser.x = playerX;
        laser.y = playerY - 30;
        laser.active = true;
        sounds.playLaser();

        // Laser muzzle flash & squash recoil
        playerScaleX = 1.25;
        playerScaleY = 0.85;
        spawnParticles(laser.x, laser.y, "#60a5fa", 6, 2);
      }
    };

    // Input Handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioning) return;

      if (gameMode === "runner" || gameMode === "shooter") {
        if (e.key === "ArrowLeft" && playerLane > 0) {
          playerLane--;
          targetPlayerX = playerLane * laneW + laneW / 2;
          playerScaleX = 0.8;
          playerScaleY = 1.2;
          spawnParticles(playerX + 25, playerY, avatarConfig.color, 4, 1.5);
          sounds.playClick();
        } else if (e.key === "ArrowRight" && playerLane < 3) {
          playerLane++;
          targetPlayerX = playerLane * laneW + laneW / 2;
          playerScaleX = 0.8;
          playerScaleY = 1.2;
          spawnParticles(playerX - 25, playerY, avatarConfig.color, 4, 1.5);
          sounds.playClick();
        }

        if (gameMode === "shooter" && (e.key === " " || e.key === "ArrowUp")) {
          shootLaser();
        }
      } else if (gameMode === "flappy") {
        if (e.key === " " || e.key === "ArrowUp") {
          playerVY = -6.8;
          playerScaleX = 0.8;
          playerScaleY = 1.35;
          spawnParticles(playerX, playerY + 12, "#ffffff", 6, 2);
          sounds.playJump();
        }
      } else if (gameMode === "dash") {
        if (e.key === " " || e.key === "ArrowUp") {
          jumpBuffer = 8; // Buffer jump for 8 frames
        }
      }
    };

    const handleTouchOrClick = (e: MouseEvent | TouchEvent) => {
      if (isTransitioning) return;
      if ("touches" in e && e.type === "click") return; // prevent ghost clicks

      const rect = canvas.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const canvasX = (clientX - rect.left) * (canvas.width / rect.width);

      if (gameMode === "runner" || gameMode === "shooter") {
        const clickedLane = Math.min(Math.max(Math.floor(canvasX / laneW), 0), 3);
        if (playerLane !== clickedLane) {
          playerLane = clickedLane;
          targetPlayerX = playerLane * laneW + laneW / 2;
          playerScaleX = 0.8;
          playerScaleY = 1.2;
          spawnParticles(playerX, playerY, avatarConfig.color, 4, 1.5);
          sounds.playClick();
        }
        if (gameMode === "shooter") {
          shootLaser();
        }
      } else if (gameMode === "flappy") {
        playerVY = -6.8;
        playerScaleX = 0.8;
        playerScaleY = 1.35;
        spawnParticles(playerX, playerY + 12, "#ffffff", 6, 2);
        sounds.playJump();
      } else if (gameMode === "dash") {
        jumpBuffer = 8;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isTransitioning) return;
      if (gameMode !== "runner" && gameMode !== "shooter") return;

      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches[0].clientX;
      const canvasX = (clientX - rect.left) * (canvas.width / rect.width);
      const movedLane = Math.min(Math.max(Math.floor(canvasX / laneW), 0), 3);

      if (playerLane !== movedLane) {
        playerLane = movedLane;
        targetPlayerX = playerLane * laneW + laneW / 2;
        sounds.playClick();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    canvas.addEventListener("click", handleTouchOrClick);
    canvas.addEventListener("touchstart", handleTouchOrClick, { passive: true });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: true });

    // --- GAME UPDATE ENGINE ---
    const update = () => {
      // Hit-stop freeze frame handling
      if (freezeFrames > 0) {
        freezeFrames--;
        return;
      }

      frames++;
      bgOffset = (bgOffset + gameSpeed) % 40;

      // Screen trauma decay
      if (trauma > 0) trauma = Math.max(0, trauma - 0.03);

      // Flash decay
      if (isTransitioning && flashAlpha > 0) flashAlpha -= 0.025;

      // Spring recovery for squash & stretch
      playerScaleX += (1.0 - playerScaleX) * 0.18;
      playerScaleY += (1.0 - playerScaleY) * 0.18;

      // Smooth lane lerping for Runner & Shooter
      if (gameMode === "runner" || gameMode === "shooter") {
        playerX += (targetPlayerX - playerX) * 0.28;
      }

      // Avatar particle trail
      if (frames % 3 === 0 && !isTransitioning) {
        if (gameMode === "dash" && !isJumping) {
          spawnParticles(playerX - 18, groundY, "#64748b", 1, 0.8);
        } else if (gameMode === "flappy") {
          spawnParticles(playerX - 12, playerY, avatarConfig.color, 1, 0.4);
        } else if (gameMode === "runner") {
          spawnParticles(playerX, playerY + 18, avatarConfig.color, 1, 0.5);
        }
      }

      // Mode-Specific Update
      if (gameMode === "runner") {
        gameSpeed += 0.001;
        currentBlockY += gameSpeed;

        if (!isTransitioning) {
          const size = 26;
          const py = canvas.height - 80;
          if (
            currentBlockY + currentBlockHeight >= py - size &&
            currentBlockY <= py + size
          ) {
            const hitOpt = fallingOptions[playerLane];
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

          playerAngle = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, playerVY * 0.07));
          const wallW = 120;

          if (flappyWallX < playerX + size && flappyWallX + wallW > playerX - size) {
            const laneH = canvas.height / 4;
            let lane = Math.min(Math.max(Math.floor(playerY / laneH), 0), 3);
            const hitOpt = fallingOptions[lane];
            triggerAnswer(hitOpt.isCorrect, hitOpt.text);
          }
        } else {
          playerVY = 0;
          playerY += Math.sin(frames * 0.1) * 1.5;
          playerAngle = 0;
        }
      } else if (gameMode === "dash") {
        const size = 22;

        // Coyote timer & jump buffering
        const onGround = playerY >= groundY - size - 1;
        if (onGround) {
          coyoteTimer = 6;
          isJumping = false;
        } else {
          if (coyoteTimer > 0) coyoteTimer--;
        }

        if (jumpBuffer > 0) {
          if (onGround || coyoteTimer > 0) {
            playerVY = -15.8;
            isJumping = true;
            coyoteTimer = 0;
            jumpBuffer = 0;
            playerScaleX = 0.72;
            playerScaleY = 1.38;
            spawnParticles(playerX, playerY + size, "#e2e8f0", 8, 2);
            sounds.playJump();
          } else {
            jumpBuffer--;
          }
        }

        playerY += playerVY;
        playerVY += gravity;

        if (playerY >= groundY - size) {
          if (isJumping && !isTransitioning) {
            // Landing impact squash
            playerScaleX = 1.35;
            playerScaleY = 0.75;
            spawnParticles(playerX, groundY, "#94a3b8", 5, 1.2);
          }
          playerY = groundY - size;
          playerVY = 0;
          isJumping = false;
          if (!isTransitioning) playerAngle = 0;
        } else {
          playerAngle += 0.12;
        }

        let farthestX = Math.max(...dashObstacles.map((o) => o.x));

        for (let obs of dashObstacles) {
          obs.x -= gameSpeed;
          if (obs.x + obs.w < -20) {
            obs.x = Math.max(farthestX, canvas.width) + 340;
            obs.y = groundY - 62;
            farthestX = obs.x;
            obs.hit = false;
          }
        }

        if (!isTransitioning) {
          for (let obs of dashObstacles) {
            if (obs.hit) continue;
            const pRight = playerX + size,
              pLeft = playerX - size,
              pBottom = playerY + size,
              pTop = playerY - size;
            const oLeft = obs.x,
              oRight = obs.x + obs.w,
              oTop = obs.y,
              oBottom = obs.y + obs.h;

            if (pRight > oLeft && pLeft < oRight && pBottom > oTop && pTop < oBottom) {
              obs.hit = true;
              triggerAnswer(obs.isCorrect, obs.text);
            }
          }
        }
      } else if (gameMode === "shooter") {
        shooterObstacles.forEach((obs) => {
          obs.y += obs.speedY;
          obs.x = obs.startX + Math.sin(frames * 0.05 + obs.waveOffset) * 22;
          if (obs.y > canvas.height + 60 && !obs.hit) {
            obs.y = -80 - Math.random() * 40;
          }
        });

        if (laser.active) {
          laser.y -= 19;
          spawnParticles(laser.x, laser.y + laser.h, "#60a5fa", 1, 1);
          if (laser.y < -50) laser.active = false;
        }

        if (!isTransitioning && laser.active) {
          for (let obs of shooterObstacles) {
            if (obs.hit) continue;
            if (
              laser.x > obs.x - obs.w / 2 &&
              laser.x < obs.x + obs.w / 2 &&
              laser.y > obs.y - obs.h / 2 &&
              laser.y < obs.y + obs.h / 2
            ) {
              laser.active = false;
              obs.hit = true;
              sounds.playExplosion();
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

      // Screen Shake via decaying quadratic trauma
      if (trauma > 0) {
        const shake = trauma * trauma;
        const maxOffset = 16;
        const maxAngle = 0.035;
        const offsetX = maxOffset * shake * Math.sin(frames * 0.9);
        const offsetY = maxOffset * shake * Math.cos(frames * 0.8);
        const offsetRot = maxAngle * shake * Math.sin(frames * 0.7);

        ctx.translate(canvas.width / 2 + offsetX, canvas.height / 2 + offsetY);
        ctx.rotate(offsetRot);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
      }

      // ── Pixel-Art Retro Background (Solid, NO gradients) ──
      ctx.fillStyle = "#0a0a0f";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (gameMode === "runner" || gameMode === "shooter") {
        // Crisp Pixel Highway Lane Dividers
        ctx.setLineDash([8, 8]);
        ctx.strokeStyle = "#2a2a3a";
        ctx.lineWidth = 2;
        ctx.shadowBlur = 0;
        for (let i = 1; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(i * laneW, -20 + bgOffset);
          ctx.lineTo(i * laneW, canvas.height);
          ctx.stroke();
        }
      } else {
        // Crisp Pixel Horizontal Parallax Grid
        ctx.setLineDash([16, 16]);
        ctx.strokeStyle = "#1a1a28";
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
        for (let i = 0; i < canvas.height; i += 40) {
          ctx.beginPath();
          ctx.moveTo(-100 - bgOffset * 2, i);
          ctx.lineTo(canvas.width, i);
          ctx.stroke();
        }

        if (gameMode === "dash") {
          ctx.setLineDash([]);
          // Solid Pixel Ground
          ctx.fillStyle = "#111118";
          ctx.fillRect(0, groundY, canvas.width, 70);

          // Top turf line (crisp 3px green surface)
          ctx.fillStyle = "#00e676";
          ctx.fillRect(0, groundY, canvas.width, 3);

          // Pixel gravel/stone texture
          ctx.fillStyle = "#2a2a3a";
          for (let x = 0; x < canvas.width; x += 20) {
            ctx.fillRect(((x + bgOffset * 2) % (canvas.width + 20)) - 10, groundY + 14, 6, 2);
            ctx.fillRect(((x + bgOffset * 2 + 10) % (canvas.width + 20)) - 10, groundY + 28, 8, 2);
          }
        }
      }
      ctx.setLineDash([]);

      // Mode-Specific Drawing
      if (gameMode === "runner") {
        fallingOptions.forEach((opt, i) => {
          const x = i * laneW + 4;
          const w = laneW - 8;
          drawBlock(
            ctx,
            opt.text,
            x,
            currentBlockY,
            w,
            currentBlockHeight,
            opt.color,
            opt.label
          );
        });

        drawPlayer(playerX, playerY, 24, 0, true);
      } else if (gameMode === "flappy") {
        const laneH = canvas.height / 4;
        const w = 120;

        fallingOptions.forEach((opt, i) => {
          const y = i * laneH;
          drawBlock(
            ctx,
            opt.text,
            flappyWallX,
            y + 4,
            w,
            laneH - 8,
            opt.color,
            opt.label
          );
        });

        drawPlayer(playerX, playerY, 22, playerAngle);
      } else if (gameMode === "dash") {
        dashObstacles.forEach((obs) => {
          if (obs.hit) return;
          drawBlock(ctx, obs.text, obs.x, obs.y, obs.w, obs.h, obs.color, obs.label);
        });

        drawPlayer(playerX, playerY, 24, playerAngle);
      } else if (gameMode === "shooter") {
        // Crisp Pixel Starfield
        ctx.fillStyle = "#ffffff";
        for (let i = 0; i < 28; i++) {
          let speed = (i % 3) + 1;
          let sy = (bgOffset * speed * 3 + i * 75) % canvas.height;
          let sx = (i * 91) % canvas.width;
          ctx.globalAlpha = speed / 3.5;
          ctx.fillRect(sx, sy, 2, 2);
        }
        ctx.globalAlpha = 1.0;

        shooterObstacles.forEach((obs) => {
          if (obs.y > canvas.height || obs.y + obs.h < -60 || obs.hit) return;

          // Crisp 8-Bit Pixel Invader Target Box (NO round arcs, NO blur)
          const hw = obs.w / 2;
          const hh = obs.h / 2;
          ctx.shadowBlur = 0;
          ctx.fillStyle = obs.color;
          ctx.fillRect(obs.x - hw, obs.y - hh, obs.w, obs.h);

          // 2px black border
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 2;
          ctx.strokeRect(obs.x - hw, obs.y - hh, obs.w, obs.h);

          // Top highlight edge
          ctx.fillStyle = "rgba(255,255,255,0.3)";
          ctx.fillRect(obs.x - hw + 2, obs.y - hh + 2, obs.w - 4, 3);

          // Pixel Letter Badge (square tile)
          ctx.fillStyle = "rgba(0,0,0,0.85)";
          ctx.fillRect(obs.x - 10, obs.y - hh + 5, 20, 16);
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1;
          ctx.strokeRect(obs.x - 10, obs.y - hh + 5, 20, 16);
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 9px 'Press Start 2P', monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(obs.label, obs.x, obs.y - hh + 13);

          drawCenteredText(
            ctx,
            obs.text,
            obs.x - obs.w / 2 + 4,
            obs.y - 2,
            obs.w - 8,
            obs.h / 2,
            9
          );
        });

        // Crisp 2-Tone Pixel Laser (NO glow, NO roundRect)
        if (laser.active) {
          ctx.shadowBlur = 0;
          // Outer red laser edge
          ctx.fillStyle = "#ff3d57";
          ctx.fillRect(laser.x - 3, laser.y, 6, laser.h);
          // Core bright laser beam
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(laser.x - 1, laser.y + 2, 2, laser.h - 4);
        }

        drawPlayer(playerX, playerY, 22, 0, true);
      }

      // Render Pixel Shockwaves (expanding square frames)
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.radius += (sw.maxRadius - sw.radius) * 0.18;
        sw.life -= 0.05;

        if (sw.life <= 0) {
          shockwaves.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = sw.life;
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 0;
        const halfR = Math.floor(sw.radius);
        ctx.strokeRect(sw.x - halfR, sw.y - halfR, halfR * 2, halfR * 2);
        ctx.restore();
      }

      // Render Pixel Debris Particles (square tiles, NO blur)
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.life -= 0.024;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 0;
        const pSize = Math.max(2, Math.floor(p.size));
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), pSize, pSize);
        ctx.globalAlpha = 1.0;
      }

      // Render Floating Score / Feedback Texts in Pixel Font
      for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y -= 1.8;
        ft.scale = Math.min(1.0, ft.scale + 0.15);
        ft.life -= 0.025;

        if (ft.life <= 0) {
          floatingTexts.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.life);
        ctx.translate(ft.x, ft.y);
        ctx.scale(ft.scale, ft.scale);

        const pixelSize = Math.max(8, Math.floor(ft.size * 0.65));
        ctx.font = `bold ${pixelSize}px 'Press Start 2P', monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowBlur = 0;

        // 1px cardinal black outline
        ctx.fillStyle = "#000000";
        ctx.fillText(ft.text, 1, 1);
        ctx.fillText(ft.text, -1, -1);
        ctx.fillText(ft.text, 1, -1);
        ctx.fillText(ft.text, -1, 1);
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, 0, 0);

        ctx.restore();
      }

      // Screen Flash on Hit
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
  }, [gameMode, question, avatarConfig, streak]);

  const sendKey = (key: string) => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key }));
  };

  // Concise arcade instructions that fit on all screens
  const modeHintMap: Record<string, string> = {
    runner: "◀ ▶ STEER INTO ANSWER",
    flappy: "SPACE / TAP TO FLAP",
    dash: "SPACE / TAP TO JUMP OVER WRONG",
    shooter: "◀ ▶ MOVE · SPACE / TAP TO FIRE",
  };
  const modeHint = modeHintMap[gameMode] ?? "";

  return (
    <div className="w-full flex flex-col items-center justify-center gap-2">
      {/* Game Mode Arcade Instructions Bar - placed outside canvas, guaranteed no clipping */}
      <div className="w-full max-w-md px-3 py-1.5 card-px text-center text-[8px] text-[var(--color-px-yellow)] border-[var(--color-px-border)] flex items-center justify-center gap-1.5">
        <span>🎮 {modeHint}</span>
      </div>

      <div
        ref={containerRef}
        className="relative w-full max-w-md aspect-[2/3] max-h-[64vh] mx-auto border-4 border-[var(--color-px-border)] shadow-px bg-[var(--color-px-bg)] overflow-hidden select-none touch-none"
      >
        <canvas
          ref={canvasRef}
          width={400}
          height={600}
          className="w-full h-full block bg-[var(--color-px-bg)]"
          style={{ imageRendering: "pixelated" }}
        />
      </div>

      {/* On-screen Mobile Arcade Touch Controls */}
      <div className="w-full max-w-md px-3 flex items-center justify-center gap-2 md:hidden">
        {(gameMode === "runner" || gameMode === "shooter") && (
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              sendKey("ArrowLeft");
            }}
            className="btn-px flex-1 py-3 text-[9px]"
            aria-label="Move left"
          >
            ◀ <span>LEFT</span>
          </button>
        )}

        {gameMode === "shooter" && (
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              sendKey(" ");
            }}
            className="btn-px flex-1 py-3 text-[9px] border-[var(--color-px-red)]! text-[var(--color-px-red)]"
            aria-label="Fire laser"
          >
            🔥 <span>FIRE</span>
          </button>
        )}

        {(gameMode === "runner" || gameMode === "shooter") && (
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              sendKey("ArrowRight");
            }}
            className="btn-px flex-1 py-3 text-[9px]"
            aria-label="Move right"
          >
            <span>RIGHT</span> ▶
          </button>
        )}

        {(gameMode === "flappy" || gameMode === "dash") && (
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              sendKey(" ");
            }}
            className="btn-px w-full py-3.5 text-[9px] border-[var(--color-px-yellow)]! text-[var(--color-px-yellow)]"
            aria-label={gameMode === "flappy" ? "Flap or jump" : "Jump over obstacle"}
          >
            <span>
              {gameMode === "flappy" ? "🕊️ FLAP / JUMP" : "🏃 JUMP OVER OBSTACLE"}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
