# Scroll-Controlled Frame Sequence Mechanism

This document describes the exact mechanism used by Ophelya's cinematic home sequence so it can be reproduced on another website.

## Result

The page presents a full-viewport `<canvas>`. Scrolling through a pinned section advances a sequence of 300 WebP images. The browser does not play a video: JavaScript loads the images, maps scroll progress to a fractional frame number, and draws the closest available frame to the canvas.

The system has four layers:

1. **Assets**: numbered images in a public directory.
2. **Canvas renderer**: loads, caches, sizes, and draws images.
3. **Scroll timeline**: GSAP ScrollTrigger converts scroll progress into a frame playhead.
4. **Smooth scrolling**: Lenis supplies a smooth scroll signal and updates ScrollTrigger.

## Dependencies

```bash
npm install gsap lenis
```

React and a client-side rendering environment are required because `window`, `Image`, `ResizeObserver`, `requestAnimationFrame`, and `<canvas>` are used.

## Asset Contract

The current implementation expects:

```text
public/mconverter-sequence/frame_0001.webp
public/mconverter-sequence/frame_0002.webp
...
public/mconverter-sequence/frame_0300.webp
```

The URL visible to the browser is `/mconverter-sequence/frame_0001.webp`; the `public` directory is not part of the URL.

The filename generator is zero-based internally and one-based on disk:

```ts
const FRAME_COUNT = 300;
const FRAME_DIRECTORY = "/mconverter-sequence";
const FRAME_EXTENSION = "webp";

function getFramePath(index: number) {
  const frameNumber = String(index + 1).padStart(4, "0");
  return `${FRAME_DIRECTORY}/frame_${frameNumber}.${FRAME_EXTENSION}`;
}
```

All frames should normally have the same dimensions and aspect ratio. WebP keeps the image payload smaller than PNG/JPEG for this use case, but 300 images can still consume substantial memory.

## End-to-End Data Flow

```text
wheel/touch input
      |
      v
Lenis smooth scroll
      |
      v
GSAP ticker -> lenis.raf(time * 1000)
      |
      v
ScrollTrigger progress: 0..1
      |
      v
GSAP timeline playhead: frame 0..299
      |
      v
sequenceRef.renderFrame(playhead.frame)
      |
      v
requestAnimationFrame interpolation
      |
      v
canvas draw: lower frame + optional adjacent-frame cross-fade
```

There are two smoothing stages, each with a different job:

- Lenis smooths the user's wheel/touch scroll movement.
- The renderer interpolates its displayed frame toward the latest GSAP target using a 30 ms response time.

## Canvas Renderer

`ScrollFrameSequence` is a client component exposed through a ref:

```tsx
type ScrollFrameSequenceHandle = {
  renderFrame: (index: number) => void;
};

<ScrollFrameSequence ref={sequenceRef} onReady={refreshScrollTrigger} />
```

### Frame drawing

The requested frame is clamped to `0..FRAME_COUNT - 1`. The renderer finds the nearest loaded frame at or before the requested frame. If that frame is unavailable, it falls back to the first loaded frame.

The image is drawn using a cover calculation:

```ts
const scale = Math.max(
  canvasCssWidth / image.naturalWidth,
  canvasCssHeight / image.naturalHeight,
);
const drawWidth = image.naturalWidth * scale;
const drawHeight = image.naturalHeight * scale;
const x = (canvasCssWidth - drawWidth) / 2;
const y = (canvasCssHeight - drawHeight) / 2;
context.drawImage(image, x, y, drawWidth, drawHeight);
```

For a fractional target such as `42.35`, frame `42` is drawn first. If frame `43` is loaded, it is drawn on top with `globalAlpha = 0.35`. This hides stepping while preserving the exact relationship between scroll position and the film.

### Playhead interpolation

ScrollTrigger can update the GSAP playhead faster than the display can redraw. The renderer therefore keeps separate values:

```ts
const distance = targetFrame - currentFrame;
const blend = 1 - Math.exp(-elapsedMs / 30);
const nextFrame = currentFrame + distance * blend;
```

A `requestAnimationFrame` loop runs only while `currentFrame` is moving toward `targetFrame`. It stops when the difference is below `0.01`.

This is not a frame-rate-based fixed increment. The exponential formula makes the response consistent across different refresh rates.

### Canvas sizing

The canvas fills its CSS box:

```css
.sequence-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
```

A `ResizeObserver` redraws after layout changes. The backing resolution is capped to reduce the cost of repeatedly blending photographic frames:

- viewport width below 768 px: device pixel ratio capped at `1.25`
- otherwise: device pixel ratio capped at `1.5`

The canvas width and height are set to `getBoundingClientRect() * dpr`, then the 2D context is transformed by `dpr`. Drawing continues in CSS-pixel coordinates.

## Loading Strategy

The loader does not wait for all 300 images before the experience can start.

1. Load the first 8 frames with `fetchPriority = "high"`.
2. Load every sixth frame as an anchor (`0, 6, 12, ...`).
3. Load all remaining frames with `fetchPriority = "low"`.
4. Mark the component ready after the first 8 frames have loaded.
5. Redraw frame `0` immediately, and redraw near the current target as additional frames arrive.

This gives a fast scroll a nearby decoded image before the complete sequence is available. The renderer still falls back to the closest earlier loaded frame if a requested image has not arrived.

For reduced motion, only the middle frame is loaded and drawn. In the current 300-frame sequence that is index `149`, corresponding to `frame_0150.webp`.

Every image has load and error handling. Cleanup cancels pending animation frames, detaches image callbacks, clears image references, and prevents late callbacks from updating an unmounted component.

## ScrollTrigger Timeline

The story component creates one GSAP timeline when reduced motion is disabled:

```ts
const playhead = { frame: 0 };

const timeline = gsap.timeline({
  scrollTrigger: {
    trigger: storyRoot,
    start: "top top",
    end: () => `+=${window.innerWidth < 768 ? 2200 : 3200}`,
    scrub: 0.18,
    pin: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
  },
});

timeline.to(playhead, {
  frame: FRAME_COUNT - 1,
  duration: 5.6,
  ease: "none",
  onUpdate: () => sequenceRef.current?.renderFrame(playhead.frame),
});
```

Important details:

- `pin: true` holds the story at the viewport while the user scrolls through its virtual distance.
- `end` controls how much physical scroll is needed to traverse the sequence. The current values are 2,200 px on mobile and 3,200 px on larger screens.
- `scrub: 0.18` adds a short timeline catch-up period. It is intentionally small because Lenis already smooths scrolling.
- `ease: "none"` makes frame position linear with timeline progress.
- `duration: 5.6` is a timeline coordinate, not seconds of video playback. It gives the frame animation room for the other story tracks.
- `FRAME_COUNT - 1` is used because the internal array is zero-based.

The current story also uses the same timeline for independent text and cover-panel tracks. The frame sequence finishes at timeline position `5.6`; the next panel begins rising there, so the final frame remains still during the transition.

## Lenis Integration

Mount the smooth-scroll wrapper around the application layout, not only around the home section:

```tsx
function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) return;

    const lenis = new Lenis({
      duration: 0.82,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 0.9,
    });

    const updateLenis = (time: number) => lenis.raf(time * 1000);
    const updateScrollTrigger = () => ScrollTrigger.update();

    lenis.on("scroll", updateScrollTrigger);
    gsap.ticker.add(updateLenis);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off("scroll", updateScrollTrigger);
      gsap.ticker.remove(updateLenis);
      lenis.destroy();
    };
  }, []);

  return children;
}
```

`gsap.ticker` supplies time in seconds, while Lenis expects milliseconds, which is why the integration uses `time * 1000`.

After the initial frames load or the layout changes, call:

```ts
ScrollTrigger.refresh();
ScrollTrigger.update();
```

The current code schedules this in the next animation frame to ensure the images and pinned layout have been measured after React commits.

## Reduced Motion

Respect both the media query and the user's preference changes:

```ts
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
```

When reduced motion is active:

- do not initialize Lenis;
- do not create a pinned ScrollTrigger timeline;
- load one representative frame instead of the sequence;
- keep the canvas visible as a static background;
- make content flow normally in the document;
- hide scroll-only progress and cue UI.

The CSS fallback should remove absolute positioning and pin-like behavior for story content, because reduced motion must remain usable without scroll choreography.

## Required CSS Layers

The canvas should be behind the interface, while overlays and text remain above it:

```css
.story-root {
  position: relative;
  height: 100svh;
  overflow: hidden;
  isolation: isolate;
}

.sequence-canvas { z-index: 0; }
.story-overlay { z-index: 1; pointer-events: none; }
.story-content { position: relative; z-index: 2; }
```

The canvas is `pointer-events: none` so it cannot block links, buttons, or scroll interaction. The root needs a stable viewport height; otherwise ScrollTrigger's measurements can change while the sequence is running.

## Porting Checklist

1. Export the source animation into consistently sized, numbered WebP frames.
2. Place the frames in the target site's public/static directory.
3. Update `FRAME_COUNT`, directory, extension, and filename padding.
4. Copy the client canvas renderer and its cleanup logic.
5. Expose `renderFrame` through a ref.
6. Create a pinned GSAP timeline that animates `frame` from `0` to `FRAME_COUNT - 1`.
7. Mount Lenis once at the application layout level and connect it to GSAP's ticker.
8. Call `ScrollTrigger.refresh()` after the initial frame threshold and after relevant layout changes.
9. Add the reduced-motion static-frame path before shipping.
10. Test a fast downward scroll, fast upward scroll, resize/orientation change, route change, slow network, missing frame, and reduced-motion preference.

## Tuning Guide

- Increase `end` when the sequence feels too fast; decrease it when the page feels too long.
- Lower `scrub` or `PLAYHEAD_RESPONSE_MS` when the image trails behind the scroll. Increase them only if stepping is visible.
- Increase the initial frame threshold when the opening is blank on slow networks.
- Increase anchor density from every sixth frame when fast scrolling frequently falls back to distant frames.
- Lower the DPR caps when mobile GPU usage or battery consumption is too high.
- Keep `ease: "none"`; easing the playhead changes the meaning of scroll position.

## Current Project Files

- Canvas loader and renderer: `components/motion/ScrollFrameSequence.tsx`
- Pinned timeline and story composition: `components/sections/FrameSequenceStory.tsx`
- Lenis and ScrollTrigger bridge: `components/motion/SmoothScroll.tsx`
- Canvas, stacking, loader, and reduced-motion styles: `app/globals.css`
- Frame assets: `public/mconverter-sequence/`
