"use client";

import React, { useEffect, useRef, useState } from "react";
import type { GlobeInstance } from "globe.gl";
import { MeshPhongMaterial } from "three";
import boldTypeface from "three/examples/fonts/helvetiker_bold.typeface.json";
import { feature } from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";
import type { Topology } from "topojson-specification";
import worldAtlas from "world-atlas/countries-110m.json";
import { cn } from "@/lib/utils";

export interface GlobeMarker {
  location: [number, number];
  size?: number;
  name?: string;
}

export interface GlobeProps {
  className?: string;
  markers?: GlobeMarker[];
  baseColor?: string;
  markerColor?: string;
  glowColor?: string;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  enableZoom?: boolean;
  minScale?: number;
  maxScale?: number;
}

type GlobePoint = GlobeMarker & { lat: number; lng: number };
type GlobeArc = { startLat: number; startLng: number; endLat: number; endLng: number };
type CountryFeatureCollection = FeatureCollection<Geometry>;

const Globe: React.FC<GlobeProps> = ({
  className,
  markers = [],
  baseColor = "#4a4a4a",
  markerColor = "#ff8c00",
  glowColor = "#ff8c00",
  autoRotate = true,
  autoRotateSpeed = 0.35,
  enableZoom = true,
  minScale = 0.7,
  maxScale = 2.2,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeInstance | null>(null);
  const [activeMarker, setActiveMarker] = useState<GlobePoint | null>(null);

  useEffect(() => {
    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;
    const points: GlobePoint[] = markers.map((marker) => ({
      ...marker,
      lat: marker.location[0],
      lng: marker.location[1],
    }));
    const arcs: GlobeArc[] = points.slice(1).map((point, index) => ({
      startLat: points[index].lat,
      startLng: points[index].lng,
      endLat: point.lat,
      endLng: point.lng,
    }));
    const countries = feature(
      worldAtlas as unknown as Topology,
      (worldAtlas as unknown as Topology).objects.countries,
    ) as CountryFeatureCollection;

    const setupGlobe = async () => {
      const container = containerRef.current;
      if (!container) return;

      const { default: GlobeFactory } = await import("globe.gl");
      if (disposed) return;

      const globe = new GlobeFactory(container)
        .backgroundColor("rgba(0, 0, 0, 0)")
        .showAtmosphere(true)
        .atmosphereColor(glowColor)
        .atmosphereAltitude(0.18)
        .globeMaterial(new MeshPhongMaterial({
          color: baseColor,
          shininess: 8,
          transparent: true,
          opacity: 0.16,
          depthWrite: false,
        }))
        .polygonsData(countries.features)
        .polygonAltitude(0.006)
        .polygonCapColor(() => "rgba(255, 140, 0, 0.035)")
        .polygonSideColor(() => "rgba(255, 140, 0, 0.02)")
        .polygonStrokeColor(() => "rgba(255, 176, 72, 0.58)")
        .polygonLabel((country) => `<strong>${String((country as { properties?: { name?: string } }).properties?.name ?? "Country")}</strong>`)
        .labelsData(points)
        .labelLat("lat")
        .labelLng("lng")
        .labelText((point) => (point as GlobePoint).name ?? "Field test")
        .labelColor(() => "#ffffff")
        .labelAltitude(0.035)
        .labelSize(1.55)
        .labelTypeFace(boldTypeface)
        .labelResolution(3)
        .labelIncludeDot(true)
        .labelDotRadius(0.55)
        .pointsData(points)
        .pointLat("lat")
        .pointLng("lng")
        .pointColor(() => markerColor)
        .pointAltitude((point) => Math.max(0.025, (point as GlobePoint).size ?? 0.05))
        .pointRadius((point) => Math.max(0.18, ((point as GlobePoint).size ?? 0.05) * 3.2))
        .pointResolution(12)
        .pointLabel((point) => {
          const marker = point as GlobePoint;
          return `<strong>${marker.name ?? "Triger field test"}</strong><br/>${marker.lat.toFixed(2)}°, ${marker.lng.toFixed(2)}°`;
        })
        .arcsData(arcs)
        .arcColor(() => [markerColor, "rgba(255, 140, 0, 0)"])
        .arcStroke(0.35)
        .arcDashLength(0.45)
        .arcDashGap(1.6)
        .arcDashAnimateTime(2600)
        .onPointHover((point) => setActiveMarker((point as GlobePoint | null) ?? null));

      const controls = globe.controls();
      controls.autoRotate = autoRotate;
      controls.autoRotateSpeed = autoRotateSpeed;
      controls.enableZoom = enableZoom;
      controls.minDistance = 110 / maxScale;
      controls.maxDistance = 320 / minScale;
      controls.enablePan = false;
      controls.rotateSpeed = 0.55;
      controls.zoomSpeed = 0.7;
      globeRef.current = globe;

      resizeObserver = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) globe.width(width).height(height);
      });
      resizeObserver.observe(container);
    };

    void setupGlobe();

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      globeRef.current?._destructor();
      globeRef.current = null;
    };
  }, [autoRotate, autoRotateSpeed, baseColor, enableZoom, glowColor, markerColor, markers, minScale, maxScale]);

  return (
    <div className={cn("triger-globe", className)}>
      <div ref={containerRef} className="triger-globe-canvas" aria-hidden="true" />
      <div className="triger-globe-ui" aria-live="polite">
        <span className="triger-globe-live-dot" />
        {activeMarker ? activeMarker.name ?? "Field test location" : "Drag to explore"}
      </div>
      <p className="triger-globe-hint">Scroll to zoom / hover a marker</p>
    </div>
  );
};

export default Globe;