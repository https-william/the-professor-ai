"use client";

import React, { useEffect, useRef } from "react";

export default function ScholarShaderCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isLowEnd = 
      (typeof navigator !== "undefined" && 
        (((navigator as any).deviceMemory && (navigator as any).deviceMemory <= 1) || 
         (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2))) ||
      (typeof document !== "undefined" && 
        document.documentElement.classList.contains("low-perf"));

    if (isLowEnd) {
      console.info("Low-end specs or low performance detected. WebGL shader disabled.");
      if (canvas) canvas.style.display = "none";
      return;
    }

    const gl = canvas.getContext("webgl");
    if (!gl) {
      console.warn("WebGL not supported in this browser.");
      return;
    }

    // Vertex Shader: billboard plane
    const vsSource = `
      attribute vec2 position;
      varying vec2 vUv;
      void main() {
        vUv = position * 0.5 + 0.5;
        // Flip Y for standard coordinates
        vUv.y = 1.0 - vUv.y;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Fragment Shader: fluid wave simulation + dynamic theme color morphing + grain
    const fsSource = `
      precision mediump float;
      varying vec2 vUv;
      uniform float u_time;
      uniform vec2 u_mouse;
      uniform vec2 u_resolution;
      uniform float u_is_dark; // 1.0 = dark mode, 0.0 = light mode

      void main() {
        vec2 uv = vUv;
        vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
        vec2 p = uv * aspect;
        vec2 m = u_mouse * aspect;

        // Distort coordinate space slightly with a very low frequency sine wave
        // to make the blobs morph organically instead of being perfect circles.
        float time = u_time * 0.15; // Slow time
        p.x += sin(p.y * 2.0 + time) * 0.08;
        p.y += cos(p.x * 2.0 + time * 1.2) * 0.08;

        // Mouse displacement: pull/push coords slightly near the mouse
        float distToMouse = length(p - m);
        float mouseInfluence = smoothstep(0.6, 0.0, distToMouse);
        p += (p - m) * mouseInfluence * 0.08;

        // Blob 1: Blue (orbits in the top-left/center area)
        vec2 b1 = vec2(0.3, 0.4) * aspect + vec2(cos(time * 0.8) * 0.15, sin(time * 0.6) * 0.12);
        float d1 = length(p - b1);
        float val1 = smoothstep(0.7, 0.0, d1); // Smooth radius

        // Blob 2: Violet (orbits in the bottom-right area)
        vec2 b2 = vec2(0.7, 0.6) * aspect + vec2(sin(time * 0.7) * 0.18, cos(time * 0.9) * 0.15);
        float d2 = length(p - b2);
        float val2 = smoothstep(0.8, 0.0, d2);

        // Blob 3: Amber (orbits in the top-right/center area)
        vec2 b3 = vec2(0.6, 0.3) * aspect + vec2(cos(time * 0.5 + 2.0) * 0.20, sin(time * 0.8 + 1.0) * 0.15);
        float d3 = length(p - b3);
        float val3 = smoothstep(0.65, 0.0, d3);

        // Colors
        vec3 dark_bg = vec3(0.008, 0.008, 0.012);       // Deepest near-black (#020203)
        vec3 dark_blue = vec3(0.015, 0.05, 0.18);       // Subdued prestigious blue
        vec3 dark_violet = vec3(0.05, 0.02, 0.15);      // Subdued prestigious violet
        vec3 dark_amber = vec3(0.08, 0.04, 0.005);     // Subdued prestigious amber

        vec3 light_bg = vec3(0.965, 0.965, 0.975);      // Soft cool white (#f6f6f9)
        vec3 light_blue = vec3(0.38, 0.60, 0.96);        // Vivid sky blue (#6199f4)
        vec3 light_violet = vec3(0.62, 0.48, 0.92);      // Rich lavender (#9e7aeb)
        vec3 light_amber = vec3(0.97, 0.71, 0.30);       // Warm amber (#f8b54d)

        // Interpolate colors based on active theme
        vec3 c_bg = mix(light_bg, dark_bg, u_is_dark);
        vec3 c_blue = mix(light_blue, dark_blue, u_is_dark);
        vec3 c_violet = mix(light_violet, dark_violet, u_is_dark);
        vec3 c_amber = mix(light_amber, dark_amber, u_is_dark);

        // Mix the blobs into the background
        vec3 color = c_bg;
        
        // Blend blue blob — more saturated in light mode
        float blueStr = mix(0.75, 0.65, u_is_dark);
        color = mix(color, c_blue, val1 * blueStr);
        
        // Blend violet blob
        float violetStr = mix(0.65, 0.55, u_is_dark);
        color = mix(color, c_violet, val2 * violetStr);
        
        // Blend amber blob
        float amberStr = mix(0.60, 0.50, u_is_dark);
        color = mix(color, c_amber, val3 * amberStr);

        // Very subtle vignette
        float vignette = uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y);
        vignette = clamp(pow(16.0 * vignette, 0.2), 0.0, 1.0);
        color *= mix(u_is_dark * 0.2 + 0.8, 1.0, vignette);

        // Extra dynamic mouse-proximity glow (additive)
        float mouseGlow = smoothstep(0.4, 0.0, distToMouse);
        color += c_blue * mouseGlow * 0.06;

        // Cinematic fine-grain overlay (adapts to light/dark mode)
        float grain = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
        float grainAmt = mix(0.005, 0.012, u_is_dark);
        color += (grain - 0.5) * grainAmt;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    // Compile shader helper
    const compileShader = (source: string, type: number): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compilation error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(vsSource, gl.VERTEX_SHADER);
    const fs = compileShader(fsSource, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    // Link Program
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Quad geometry (two triangles covering the canvas)
    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const timeLoc = gl.getUniformLocation(program, "u_time");
    const mouseLoc = gl.getUniformLocation(program, "u_mouse");
    const resolutionLoc = gl.getUniformLocation(program, "u_resolution");
    const isDarkLoc = gl.getUniformLocation(program, "u_is_dark");

    let animationFrameId: number;
    let startTime = Date.now();
    let mountTime = performance.now();
    let currentMouse = { x: 0.5, y: 0.5 };
    let targetMouse = { x: 0.5, y: 0.5 };

    // Theme detection logic (observing HTML element classes)
    let targetIsDark = !document.documentElement.classList.contains("light");
    let currentIsDark = targetIsDark ? 1.0 : 0.0;

    const observer = new MutationObserver(() => {
      targetIsDark = !document.documentElement.classList.contains("light");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    // Mouse movement listener
    const handleMouseMove = (e: MouseEvent) => {
      targetMouse.x = e.clientX / window.innerWidth;
      targetMouse.y = 1.0 - (e.clientY / window.innerHeight); // Flip WebGL coords
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        targetMouse.x = e.touches[0].clientX / window.innerWidth;
        targetMouse.y = 1.0 - (e.touches[0].clientY / window.innerHeight);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    // Resize handler
    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    let lastFrameTime = performance.now();
    let fpsWarningCount = 0;

    // Render loop
    const render = () => {
      const nowTime = performance.now();
      const delta = nowTime - lastFrameTime;
      lastFrameTime = nowTime;

      // Performance Fallback: Only check performance after 6 seconds of mount time to allow initialization and hydration to settle.
      if (nowTime - mountTime > 6000) {
        if (delta > 60) {
          fpsWarningCount++;
          if (fpsWarningCount > 40) { // Require 40 consecutive slow frames (~2.5s of lag at 15 FPS)
            console.warn("Consistent low rendering performance detected. Disabling WebGL background.");
            if (typeof document !== "undefined") {
              document.documentElement.classList.add("low-perf");
            }
            cancelAnimationFrame(animationFrameId);
            canvas.style.display = "none";
            return;
          }
        } else {
          fpsWarningCount = 0; // Reset on fast frames
        }
      }

      const time = (Date.now() - startTime) * 0.001;
      
      // Interpolate mouse coordinates for fluid lag/inertia
      currentMouse.x += (targetMouse.x - currentMouse.x) * 0.06;
      currentMouse.y += (targetMouse.y - currentMouse.y) * 0.06;

      // Smoothly morph between light and dark modes (accelerated for responsiveness)
      const targetVal = targetIsDark ? 1.0 : 0.0;
      // Snap immediately on first frame so there's no "loading in from wrong theme" flash
      const isFirstFrame = time < 0.05;
      currentIsDark = isFirstFrame
        ? targetVal
        : currentIsDark + (targetVal - currentIsDark) * 0.25;

      gl.useProgram(program);
      gl.uniform1f(timeLoc, time);
      gl.uniform2f(mouseLoc, currentMouse.x, currentMouse.y);
      gl.uniform2f(resolutionLoc, canvas.width, canvas.height);
      gl.uniform1f(isDarkLoc, currentIsDark);

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("resize", resizeCanvas);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="scholar-shader-canvas"
      className="fixed inset-0 w-full h-full -z-10 bg-transparent pointer-events-none transition-opacity duration-1000"
      style={{ opacity: 0.60 }}
    />
  );
}
