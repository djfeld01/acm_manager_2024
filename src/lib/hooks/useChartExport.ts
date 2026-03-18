"use client";

import { useRef, useCallback } from "react";

export function useChartExport(filename: string) {
  const containerRef = useRef<HTMLDivElement>(null);

  const exportPng = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const svg = container.querySelector("svg");
    if (!svg) return;

    const { width, height } = svg.getBoundingClientRect();
    const scale = 2; // retina

    // Inline computed styles so CSS-class-based properties (stroke, fill, etc.)
    // survive SVG serialization — CSS variables and classes are lost otherwise.
    const svgClone = svg.cloneNode(true) as SVGElement;
    const liveEls = [svg, ...Array.from(svg.querySelectorAll("*"))];
    const cloneEls = [svgClone, ...Array.from(svgClone.querySelectorAll("*"))];
    const PROPS = [
      "stroke", "stroke-width", "stroke-dasharray", "stroke-opacity",
      "fill", "fill-opacity", "opacity", "font-size", "font-family",
    ];
    liveEls.forEach((live, i) => {
      const clone = cloneEls[i] as SVGElement;
      const computed = window.getComputedStyle(live);
      PROPS.forEach((prop) => {
        const val = computed.getPropertyValue(prop);
        if (val) clone.style.setProperty(prop, val);
      });
    });

    svgClone.setAttribute("width", String(width));
    svgClone.setAttribute("height", String(height));

    const svgData = new XMLSerializer().serializeToString(svgClone);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(scale, scale);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const link = document.createElement("a");
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = url;
  }, [filename]);

  return { containerRef, exportPng };
}
