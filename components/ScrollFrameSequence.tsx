"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { FRAME_COUNT, getFramePath } from "@/lib/frameSequence";

export type ScrollFrameSequenceHandle = {
  renderFrame: (index: number) => void;
};

type ScrollFrameSequenceProps = {
  onReady?: () => void;
  className?: string;
};

const PLAYHEAD_RESPONSE_MS = 30;
const MAX_DPR = 1.5;
const MOBILE_DPR_CAP = 1.25;

const ScrollFrameSequence = forwardRef<
  ScrollFrameSequenceHandle,
  ScrollFrameSequenceProps
>(({ onReady, className = "" }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameCacheRef = useRef<Record<number, HTMLImageElement>>({});
  const rafRef = useRef<number | null>(null);
  const currentFrameRef = useRef(0);
  const targetFrameRef = useRef(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const readyRef = useRef(false);
  const mountedRef = useRef(true);

  const renderFrame = (index: number) => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === "undefined") return;

    const clamped = Math.max(0, Math.min(FRAME_COUNT - 1, index));
    targetFrameRef.current = clamped;

    const nearestFrame = Object.keys(frameCacheRef.current)
      .map(Number)
      .filter((frame) => frame <= clamped)
      .sort((a, b) => b - a)[0];

    const image = nearestFrame !== undefined ? frameCacheRef.current[nearestFrame] : undefined;
    if (!image) {
      const firstImage = Object.values(frameCacheRef.current)[0];
      if (!firstImage) return;
      drawImageToCanvas(firstImage, clamped);
      return;
    }

    drawImageToCanvas(image, clamped);
  };

  const drawImageToCanvas = (image: HTMLImageElement, fractionalIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(
      window.devicePixelRatio || 1,
      window.innerWidth < 768 ? MOBILE_DPR_CAP : MAX_DPR,
    );

    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);

    const nextIndex = Math.floor(fractionalIndex);
    const fraction = fractionalIndex - nextIndex;
    const lowerFrame = frameCacheRef.current[nextIndex] ?? image;
    const higherFrame = frameCacheRef.current[nextIndex + 1];

    const draw = (source: HTMLImageElement, alpha: number) => {
      const naturalWidth = source.naturalWidth || source.width || rect.width;
      const naturalHeight = source.naturalHeight || source.height || rect.height;
      const scale = Math.max(rect.width / naturalWidth, rect.height / naturalHeight);
      const drawWidth = naturalWidth * scale;
      const drawHeight = naturalHeight * scale;
      const x = (rect.width - drawWidth) / 2;
      const y = (rect.height - drawHeight) / 2;

      context.globalAlpha = alpha;
      context.drawImage(source, x, y, drawWidth, drawHeight);
    };

    draw(lowerFrame, 1);

    if (higherFrame && fraction > 0) {
      draw(higherFrame, fraction);
    }

    context.globalAlpha = 1;
    currentFrameRef.current = fractionalIndex;
  };

  const loadImage = (index: number) => {
    if (frameCacheRef.current[index]) {
      return;
    }

    const image = new window.Image();
    const src = getFramePath(index);

    image.decoding = "async";
    image.loading = "eager";
    image.fetchPriority = index < 8 ? "high" : index % 6 === 0 ? "auto" : "low";

    image.onload = () => {
      if (!mountedRef.current) return;
      frameCacheRef.current[index] = image;

      if (!readyRef.current && index < 8) {
        const loadedCount = Object.keys(frameCacheRef.current).length;
        if (loadedCount >= 8) {
          readyRef.current = true;
          onReady?.();
        }
      }

      renderFrame(targetFrameRef.current);
    };

    image.onerror = () => {
      if (!mountedRef.current) return;
      if (!readyRef.current && index < 8) {
        const loadedCount = Object.keys(frameCacheRef.current).length;
        if (loadedCount >= 8) {
          readyRef.current = true;
          onReady?.();
        }
      }
    };

    image.src = src;
    return image;
  };

  useImperativeHandle(ref, () => ({
    renderFrame: (index: number) => {
      const clamped = Math.max(0, Math.min(FRAME_COUNT - 1, index));
      const distance = clamped - currentFrameRef.current;

      if (Math.abs(distance) < 0.01) {
        currentFrameRef.current = clamped;
        targetFrameRef.current = clamped;
        renderFrame(clamped);
        return;
      }

      const begin = performance.now();
      const tick = () => {
        if (!mountedRef.current) return;
        const elapsed = performance.now() - begin;
        const blend = 1 - Math.exp(-elapsed / PLAYHEAD_RESPONSE_MS);
        const next = currentFrameRef.current + distance * blend;
        renderFrame(next);

        if (Math.abs(clamped - next) > 0.01) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          currentFrameRef.current = clamped;
          targetFrameRef.current = clamped;
          renderFrame(clamped);
        }
      };

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(tick);
    },
  }));

  useEffect(() => {
    mountedRef.current = true;

    for (let i = 0; i < Math.min(8, FRAME_COUNT); i += 1) {
      loadImage(i);
    }

    for (let i = 6; i < FRAME_COUNT; i += 6) {
      loadImage(i);
    }

    for (let i = 0; i < FRAME_COUNT; i += 1) {
      if (i < 8 || i % 6 === 0) continue;
      loadImage(i);
    }

    renderFrame(0);

    const resizeObserver = new ResizeObserver(() => {
      const frame = targetFrameRef.current;
      renderFrame(frame);
    });

    if (rootRef.current) {
      resizeObserver.observe(rootRef.current);
    }

    return () => {
      mountedRef.current = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      resizeObserver.disconnect();
      frameCacheRef.current = {};
    };
  }, []);

  return (
    <div ref={rootRef} className={`relative h-full w-full ${className}`}>
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
    </div>
  );
});

ScrollFrameSequence.displayName = "ScrollFrameSequence";

export { ScrollFrameSequence };
