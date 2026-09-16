'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Full-viewport, fixed WebGL background: a slowly rotating node/edge graph
// standing in for SentinelX's actual distributed topology (services as
// nodes, event/lock traffic as edges). Reacts continuously to scroll
// position (camera pulls back + rotates, accent color shifts per section)
// and to pointer position (subtle parallax) -- the same "scroll scrubs the
// 3D scene" move used across awwwards-tier sites, built on the WebGL
// context this project already ships (three.js, also used by
// Campus3DVisualizer) rather than an externally hosted scene.
const SECTION_COLORS = [
  new THREE.Color('#22d3ee'), // hero -- cyan
  new THREE.Color('#a855f7'), // pipeline -- purple (AI triage)
  new THREE.Color('#f43f5e'), // architecture -- rose
  new THREE.Color('#34d399'), // consensus/footer -- emerald
];

export function LandingScene3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let supportsWebGL = false;
    try {
      const canvas = document.createElement('canvas');
      supportsWebGL = !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch {
      supportsWebGL = false;
    }
    if (!supportsWebGL) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 0, 34);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // ---- Node graph: nodes scattered on a sphere shell, edges to nearby neighbors ----
    const NODE_COUNT = window.innerWidth < 768 ? 90 : 170;
    const RADIUS = 16;
    const nodePositions: THREE.Vector3[] = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      const phi = Math.acos(-1 + (2 * i) / NODE_COUNT);
      const theta = Math.sqrt(NODE_COUNT * Math.PI) * phi;
      const r = RADIUS * (0.75 + Math.random() * 0.35);
      nodePositions.push(new THREE.Vector3(
        r * Math.cos(theta) * Math.sin(phi),
        r * Math.sin(theta) * Math.sin(phi),
        r * Math.cos(phi)
      ));
    }

    const pointsGeometry = new THREE.BufferGeometry().setFromPoints(nodePositions);
    const pointsMaterial = new THREE.PointsMaterial({
      color: SECTION_COLORS[0],
      size: 0.34,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const points = new THREE.Points(pointsGeometry, pointsMaterial);

    const edgeVertices: number[] = [];
    const EDGE_DISTANCE = RADIUS * 0.62;
    for (let i = 0; i < nodePositions.length; i++) {
      for (let j = i + 1; j < nodePositions.length; j++) {
        if (nodePositions[i].distanceTo(nodePositions[j]) < EDGE_DISTANCE) {
          edgeVertices.push(nodePositions[i].x, nodePositions[i].y, nodePositions[i].z);
          edgeVertices.push(nodePositions[j].x, nodePositions[j].y, nodePositions[j].z);
        }
      }
    }
    const edgeGeometry = new THREE.BufferGeometry();
    edgeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(edgeVertices, 3));
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: SECTION_COLORS[0],
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);

    const group = new THREE.Group();
    group.add(points, edges);
    scene.add(group);

    // Faint distant starfield for depth
    const starCount = window.innerWidth < 768 ? 200 : 500;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 160;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 160;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 160 - 40;
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({
      color: '#ffffff', size: 0.12, transparent: true, opacity: 0.35, depthWrite: false,
    }));
    scene.add(stars);

    // ---- Scroll + pointer reactive state ----
    const state = { scrollFrac: 0, pointerX: 0, pointerY: 0 };
    const targetColor = new THREE.Color().copy(SECTION_COLORS[0]);
    const currentColor = new THREE.Color().copy(SECTION_COLORS[0]);

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      state.scrollFrac = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    };
    const onPointerMove = (e: PointerEvent) => {
      state.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      state.pointerY = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('resize', onResize);
    onScroll();

    let rafId = 0;
    let running = true;
    const clock = new THREE.Clock();

    const animate = () => {
      if (!running) return;
      rafId = requestAnimationFrame(animate);
      const dt = clock.getDelta();

      const segment = state.scrollFrac * (SECTION_COLORS.length - 1);
      const idx = Math.min(SECTION_COLORS.length - 2, Math.floor(segment));
      const localT = segment - idx;
      targetColor.copy(SECTION_COLORS[idx]).lerp(SECTION_COLORS[idx + 1], localT);
      currentColor.lerp(targetColor, 0.04);
      pointsMaterial.color.copy(currentColor);
      edgeMaterial.color.copy(currentColor);

      if (!reducedMotion) {
        group.rotation.y += dt * 0.06;
        group.rotation.x = Math.sin(clock.elapsedTime * 0.08) * 0.08;
      }
      group.rotation.y += (state.scrollFrac * Math.PI * 0.6 - group.rotation.y * 0) * 0.0006;
      stars.rotation.y += dt * 0.01;

      const targetCamZ = 34 - state.scrollFrac * 10;
      camera.position.z += (targetCamZ - camera.position.z) * 0.04;
      const targetCamX = state.pointerX * 2.2;
      const targetCamY = -state.pointerY * 1.4;
      camera.position.x += (targetCamX - camera.position.x) * 0.03;
      camera.position.y += (targetCamY - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    const onVisibility = () => {
      running = document.visibilityState === 'visible';
      if (running) animate();
      else cancelAnimationFrame(rafId);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      pointsGeometry.dispose();
      pointsMaterial.dispose();
      edgeGeometry.dispose();
      edgeMaterial.dispose();
      starGeometry.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ background: 'radial-gradient(circle at 50% 30%, #0c1220 0%, #060911 65%, #030509 100%)' }}
    />
  );
}
