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
    let gameSpeed = gameMode === "dash" ? 4.5 : 3.2;

    // Game state variables
    let playerLane = 1; // 0, 1, 2, 3
    let playerX = 80;
    let playerY = canvas.height / 2;
    let playerVY = 0;
    let gravity = 0;
    let isJumping = false;
    let playerAngle = 0;
    let bgOffset = 0;

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

    let dashObstacles = fallingOptions.map((opt, i) => ({
      ...opt,
      x: canvas.width + i * 320,
      w: 120,
      h: 75,
      y: canvas.height - 70 - 130,
      hit: false,
    }));

    let laser = { active: false, x: 0, y: 0, w: 5, h: 22 };
    let shooterObstacles = fallingOptions.map((opt, i) => {
      const laneW = canvas.width / 4;
      return {
        ...opt,
        x: i * laneW + laneW / 2 - 38,
        y: -90,
        w: 76,
        h: 76,
        speedY: gameSpeed * 0.55,
        hit: false,
      };
    });

    // Setup initial positions per mode
    if (gameMode === "flappy") {
      playerX = 80;
      playerY = canvas.height / 2;
      playerVY = 0;
      gravity = 0.28;
    } else if (gameMode === "dash") {
      playerX = 80;
      playerY = canvas.height - 70 - 24;
      playerVY = 0;
      gravity = 0.6;
    }

    // Helper to calculate text height in canvas and render multi-line auto-scaling text
    const drawCenteredText = (
      context: CanvasRenderingContext2D,
      text: string,
      x: number,
      y: number,
      width: number,
      height: number,
      preferredFontSize = 12
    ) => {
      if (!text) return;

      context.save();

      // Hard clipping region to ensure text never bleeds outside the option box
      context.beginPath();
      context.rect(x + 2, y + 2, Math.max(0, width - 4), Math.max(0, height - 4));
      context.clip();

      const paddingX = 6;
      const maxAvailableWidth = Math.max(16, width - paddingX * 2);

      // Tokenize by spaces and split after underscores, hyphens, or slashes
      const str = text.toString().trim();
      const rawTokens = str
        .replace(/([_\-/])/g, "$1 ")
        .split(/\s+/)
        .filter((t) => t.length > 0);

      const getWrappedLines = (fontSize: number) => {
        context.font = `bold ${fontSize}px sans-serif`;
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

            // If a single token is wider than maxAvailableWidth, character wrap it
            if (context.measureText(token).width > maxAvailableWidth) {
              let charChunk = "";
              for (const char of token) {
                if (
                  context.measureText(charChunk + char).width > maxAvailableWidth
                ) {
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
        if (currentLine) {
          lines.push(currentLine);
        }
        return lines;
      };

      let bestFontSize = preferredFontSize;
      let finalLines: string[] = [];

      for (let size = preferredFontSize; size >= 8; size--) {
        bestFontSize = size;
        finalLines = getWrappedLines(size);
        context.font = `bold ${size}px sans-serif`;

        const maxLineWidth = Math.max(
          0,
          ...finalLines.map((l) => context.measureText(l).width)
        );
        const totalHeight = finalLines.length * (size * 1.25);

        if (maxLineWidth <= maxAvailableWidth && totalHeight <= height - 6) {
          break;
        }
      }

      context.font = `bold ${bestFontSize}px sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = "#ffffff";

      const lineHeight = Math.max(10, bestFontSize * 1.25);
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

        context.shadowColor = "#000000";
        context.shadowBlur = 4;
        context.fillText(displayLine, x + width / 2, startY);
        context.shadowBlur = 0;
        startY += lineHeight;
      });

      context.restore();
    };

    // Draw Avatar Player
    const drawPlayer = (
      x: number,
      y: number,
      size: number,
      angle = 0,
      forceUpright = false
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      ctx.shadowBlur = 12;
      ctx.shadowColor = avatarConfig.color;

      ctx.fillStyle = avatarConfig.color;
      ctx.beginPath();

      if (avatarConfig.shape === "triangle") {
        if (gameMode === "runner" || forceUpright) {
          ctx.moveTo(0, -size);
          ctx.lineTo(-size, size);
          ctx.lineTo(size, size);
        } else {
          ctx.moveTo(size, 0);
          ctx.lineTo(-size, -size);
          ctx.lineTo(-size, size);
        }
      } else if (avatarConfig.shape === "square") {
        ctx.rect(-size, -size, size * 2, size * 2);
      } else if (avatarConfig.shape === "circle") {
        ctx.arc(0, 0, size, 0, Math.PI * 2);
      }

      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      if (avatarConfig.face) {
        ctx.rotate(-angle);
        ctx.fillStyle = "#000000";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        let faceOffsetY = 2;
        if (
          avatarConfig.shape === "triangle" &&
          (gameMode === "runner" || forceUpright)
        )
          faceOffsetY = 6;

        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#ffffff";
        ctx.strokeText(avatarConfig.face, 0, faceOffsetY);
        ctx.fillText(avatarConfig.face, 0, faceOffsetY);
      }
      ctx.restore();
    };

    // Trigger Answer Selection
    const triggerAnswer = (isCorrect: boolean, selectedOptText: string) => {
      if (isTransitioning) return;
      isTransitioning = true;

      if (isCorrect) {
        flashColor = "rgba(16, 185, 129, 0.4)";
        sounds.playCorrect();
      } else {
        flashColor = "rgba(239, 68, 68, 0.45)";
        sounds.playWrong();
      }

      setTimeout(() => {
        onAnswerResult(isCorrect, selectedOptText);
      }, 700);
    };

    // Shoot Laser
    const shootLaser = () => {
      if (!laser.active && !isTransitioning) {
        const laneW = canvas.width / 4;
        laser.x = playerLane * laneW + laneW / 2;
        laser.y = canvas.height - 80;
        laser.active = true;
        sounds.playLaser();
      }
    };

    // Keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioning) return;

      if (gameMode === "runner" || gameMode === "shooter") {
        if (e.key === "ArrowLeft" && playerLane > 0) playerLane--;
        else if (e.key === "ArrowRight" && playerLane < 3) playerLane++;

        if (gameMode === "shooter" && (e.key === " " || e.key === "ArrowUp")) {
          shootLaser();
        }
      } else if (gameMode === "flappy") {
        if (e.key === " " || e.key === "ArrowUp") {
          playerVY = -6;
          sounds.playJump();
        }
      } else if (gameMode === "dash") {
        if ((e.key === " " || e.key === "ArrowUp") && !isJumping) {
          playerVY = -11;
          isJumping = true;
          sounds.playJump();
        }
      }
    };

    // Touch / Mouse controls
    const handleTouchOrClick = (e: MouseEvent | TouchEvent) => {
      if (isTransitioning) return;
      const rect = canvas.getBoundingClientRect();
      const clientX =
        "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const canvasX = (clientX - rect.left) * (canvas.width / rect.width);

      if (gameMode === "runner" || gameMode === "shooter") {
        const laneW = canvas.width / 4;
        const clickedLane = Math.floor(canvasX / laneW);
        playerLane = Math.min(Math.max(clickedLane, 0), 3);

        if (gameMode === "shooter") {
          shootLaser();
        }
      } else if (gameMode === "flappy") {
        playerVY = -6;
        sounds.playJump();
      } else if (gameMode === "dash") {
        if (!isJumping) {
          playerVY = -11;
          isJumping = true;
          sounds.playJump();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    canvas.addEventListener("click", handleTouchOrClick);
    canvas.addEventListener("touchstart", handleTouchOrClick, {
      passive: true,
    });

    // --- GAME UPDATE ENGINE ---
    const update = () => {
      bgOffset = (bgOffset + gameSpeed) % 40;

      if (gameMode === "runner") {
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

          playerAngle = Math.min(
            Math.PI / 4,
            Math.max(-Math.PI / 4, playerVY * 0.08)
          );
          const wallW = 110;

          if (
            flappyWallX < playerX + size &&
            flappyWallX + wallW > playerX - size
          ) {
            const laneH = canvas.height / 4;
            let lane = Math.floor(playerY / laneH);
            lane = Math.min(Math.max(lane, 0), 3);
            const hitOpt = fallingOptions[lane];
            triggerAnswer(hitOpt.isCorrect, hitOpt.text);
          }
        } else {
          playerVY = 0;
          playerY += Math.sin(Date.now() / 150) * 1.5;
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
          isJumping = false;
          if (!isTransitioning) playerAngle = 0;
        } else {
          playerAngle += 0.15;
        }

        let farthestX = Math.max(...dashObstacles.map((o) => o.x));

        for (let obs of dashObstacles) {
          obs.x -= gameSpeed;
          if (obs.x + obs.w < -20) {
            obs.x = farthestX + 320;
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

            if (
              pRight > oLeft &&
              pLeft < oRight &&
              pBottom > oTop &&
              pTop < oBottom
            ) {
              obs.hit = true;
              triggerAnswer(obs.isCorrect, obs.text);
            }
          }
        }
      } else if (gameMode === "shooter") {
        let allPassed = shooterObstacles.length > 0;

        shooterObstacles.forEach((obs) => {
          obs.y += obs.speedY;
          if (obs.y < canvas.height) allPassed = false;
        });

        if (allPassed && !isTransitioning) {
          triggerAnswer(false, "Missed all targets");
        }

        if (laser.active) {
          laser.y -= 16;
          if (laser.y < -50) laser.active = false;
        }

        if (!isTransitioning && laser.active) {
          for (let obs of shooterObstacles) {
            if (obs.hit) continue;
            if (
              laser.x > obs.x &&
              laser.x < obs.x + obs.w &&
              laser.y > obs.y &&
              laser.y < obs.y + obs.h
            ) {
              laser.active = false;
              obs.hit = true;
              triggerAnswer(obs.isCorrect, obs.text);
              break;
            }
          }
        }
      }
    };

    // --- RENDER ENGINE ---
    const render = () => {
      // Clear & Background
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 2;

      if (gameMode === "runner" || gameMode === "shooter") {
        ctx.setLineDash([20, 20]);
        const laneW = canvas.width / 4;
        for (let i = 1; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(i * laneW, -40 + bgOffset);
          ctx.lineTo(i * laneW, canvas.height);
          ctx.stroke();
        }
      } else {
        ctx.setLineDash([40, 60]);
        for (let i = 0; i < canvas.height; i += 60) {
          ctx.beginPath();
          ctx.moveTo(-100 - bgOffset * 2, i);
          ctx.lineTo(canvas.width, i);
          ctx.stroke();
        }

        if (gameMode === "dash") {
          ctx.setLineDash([]);
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(0, canvas.height - 70, canvas.width, 70);
          ctx.strokeStyle = "#3b82f6";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(0, canvas.height - 70);
          ctx.lineTo(canvas.width, canvas.height - 70);
          ctx.stroke();
        }
      }
      ctx.setLineDash([]);

      // Mode-Specific Drawing
      if (gameMode === "runner") {
        const laneW = canvas.width / 4;
        fallingOptions.forEach((opt, i) => {
          const x = i * laneW + 4;
          const w = laneW - 8;
          ctx.fillStyle = opt.color;

          ctx.beginPath();
          ctx.roundRect(x, currentBlockY, w, currentBlockHeight, 10);
          ctx.fill();

          ctx.strokeStyle = "rgba(255,255,255,0.3)";
          ctx.lineWidth = 2;
          ctx.stroke();

          drawCenteredText(ctx, opt.text, x, currentBlockY, w, currentBlockHeight);
        });

        const px = playerLane * laneW + laneW / 2;
        drawPlayer(px, canvas.height - 80, 24, 0, true);
      } else if (gameMode === "flappy") {
        const laneH = canvas.height / 4;
        const w = 110;

        fallingOptions.forEach((opt, i) => {
          const y = i * laneH;
          ctx.fillStyle = opt.color;

          ctx.beginPath();
          ctx.roundRect(flappyWallX, y + 3, w, laneH - 6, 10);
          ctx.fill();

          ctx.strokeStyle = "rgba(255,255,255,0.25)";
          ctx.lineWidth = 2;
          ctx.stroke();

          drawCenteredText(ctx, opt.text, flappyWallX, y, w, laneH);
        });

        drawPlayer(playerX, playerY, 22, playerAngle);
      } else if (gameMode === "dash") {
        dashObstacles.forEach((obs) => {
          if (obs.hit) return;
          ctx.fillStyle = obs.color;
          ctx.beginPath();
          ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 10);
          ctx.fill();

          ctx.strokeStyle = "rgba(255,255,255,0.3)";
          ctx.lineWidth = 2;
          ctx.stroke();

          drawCenteredText(ctx, obs.text, obs.x, obs.y, obs.w, obs.h);
        });

        drawPlayer(playerX, playerY, 24, playerAngle);
      } else if (gameMode === "shooter") {
        // Starfield
        ctx.fillStyle = "#64748b";
        for (let i = 0; i < 15; i++) {
          let sy = ((bgOffset * ((i % 3) + 1) * 30 + i * 150) % canvas.height);
          let sx = (i * 73) % canvas.width;
          ctx.fillRect(sx, sy, 2, 2);
        }

        shooterObstacles.forEach((obs) => {
          if (obs.y > canvas.height || obs.y + obs.h < -50 || obs.hit) return;

          ctx.fillStyle = obs.color;
          ctx.beginPath();
          ctx.arc(obs.x + obs.w / 2, obs.y + obs.h / 2, obs.w / 2, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "rgba(255,255,255,0.35)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(
            obs.x + obs.w / 2,
            obs.y + obs.h / 2,
            obs.w / 2 - 5,
            0,
            Math.PI * 2
          );
          ctx.stroke();

          drawCenteredText(ctx, obs.text, obs.x, obs.y, obs.w, obs.h, 12);
        });

        if (laser.active) {
          ctx.fillStyle = "#ef4444";
          ctx.shadowBlur = 15;
          ctx.shadowColor = "#ef4444";
          ctx.fillRect(laser.x - laser.w / 2, laser.y, laser.w, laser.h);
          ctx.shadowBlur = 0;
        }

        const laneW = canvas.width / 4;
        const px = playerLane * laneW + laneW / 2;
        drawPlayer(px, canvas.height - 60, 22, 0, true);
      }

      // Flash Color overlay on answer hit
      if (flashColor) {
        ctx.fillStyle = flashColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
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
    };
  }, [gameMode, question, avatarConfig]);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-md aspect-[2/3] max-h-[70vh] my-auto mx-auto border-2 border-slate-800 rounded-2xl overflow-hidden bg-slate-950 shadow-2xl select-none touch-none"
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
