'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  Shield, 
  Activity, 
  Crosshair, 
  Radio, 
  RotateCw, 
  AlertTriangle,
  Zap,
  MapPin
} from 'lucide-react';

interface Campus3DVisualizerProps {
  onSelectBuilding?: (name: string) => void;
  highlightIncident?: boolean;
}

export function Campus3DVisualizer({ onSelectBuilding, highlightIncident = true }: Campus3DVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeViewMode, setActiveViewMode] = useState<'radar' | 'incident' | 'topology'>('radar');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);
  const [fps, setFps] = useState<number>(60);
  const [renderEngine, setRenderEngine] = useState<'webgl' | 'isometric'>('webgl');

  const sceneStateRef = useRef<{
    targetCamPos: THREE.Vector3;
    isUserInteracting: boolean;
    mouseX: number;
    mouseY: number;
    cleanup?: () => void;
  }>({
    targetCamPos: new THREE.Vector3(32, 28, 38),
    isUserInteracting: false,
    mouseX: 0,
    mouseY: 0,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL context support safely
    const isWebGLSupported = () => {
      try {
        const canvas = document.createElement('canvas');
        return !!(
          window.WebGLRenderingContext &&
          (canvas.getContext('webgl2') ||
            canvas.getContext('webgl') ||
            canvas.getContext('experimental-webgl'))
        );
      } catch {
        return false;
      }
    };

    let renderer: THREE.WebGLRenderer | null = null;
    let width = container.clientWidth || 800;
    let height = container.clientHeight || 540;

    if (isWebGLSupported()) {
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: 'default',
        });
      } catch (e) {
        console.warn('Three.js WebGL context creation failed, using isometric fallback:', e);
        renderer = null;
      }
    }

    // =========================================================================
    // 1. THREE.JS WEBGL PIPELINE (when WebGL is enabled)
    // =========================================================================
    if (renderer) {
      setRenderEngine('webgl');
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x060911, 0.015);

      const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
      camera.position.set(32, 28, 38);
      camera.lookAt(0, 2, 0);

      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x060911, 0);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      // Lighting
      const ambientLight = new THREE.AmbientLight(0x0f172a, 1.8);
      scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0x38bdf8, 2.5);
      keyLight.position.set(40, 60, 30);
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0x818cf8, 1.2);
      rimLight.position.set(-30, 20, -30);
      scene.add(rimLight);

      // Ground Tactical Grid
      const gridHelper = new THREE.GridHelper(80, 40, 0x0284c7, 0x1e293b);
      scene.add(gridHelper);

      // Rotating Radar Ring Group
      const radarGroup = new THREE.Group();
      scene.add(radarGroup);

      const ringRadii = [12, 22, 34];
      ringRadii.forEach((radius, i) => {
        const ringGeo = new THREE.RingGeometry(radius - 0.1, radius + 0.1, 64);
        const ringMat = new THREE.MeshBasicMaterial({
          color: i === 1 ? 0x06b6d4 : 0x1e3a5f,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.6,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        ringMesh.position.y = 0.05;
        radarGroup.add(ringMesh);
      });

      // Radar Sweep Fan
      const sweepGeo = new THREE.RingGeometry(0.1, 34, 32, 1, 0, Math.PI / 3);
      const sweepMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.18,
      });
      const sweepMesh = new THREE.Mesh(sweepGeo, sweepMat);
      sweepMesh.rotation.x = Math.PI / 2;
      sweepMesh.position.y = 0.06;
      radarGroup.add(sweepMesh);

      // Campus Buildings
      const interactiveBuildings: THREE.Mesh[] = [];
      const buildingData = [
        { name: 'VIGIL HQ Central Command', x: 0, z: 0, w: 7, d: 7, h: 14, color: 0x0284c7, edges: 0x38bdf8 },
        { name: 'Sector A: Engineering Quad', x: 14, z: -10, w: 9, d: 6, h: 8, color: 0x1e293b, edges: 0x64748b },
        { name: 'Sector B: BioMed Complex (CRITICAL)', x: -12, z: 8, w: 8, d: 7, h: 9, color: 0x7f1d1d, edges: 0xef4444, isCritical: true },
        { name: 'Sector C: Data Infrastructure', x: -14, z: -12, w: 6, d: 10, h: 6, color: 0x312e81, edges: 0x818cf8 },
        { name: 'Sector D: Student Commons', x: 12, z: 12, w: 7, d: 7, h: 5, color: 0x0f172a, edges: 0x06b6d4 },
        { name: 'Sector E: Autonomous Hangar', x: -2, z: -16, w: 10, d: 5, h: 4, color: 0x111827, edges: 0x10b981 },
      ];

      buildingData.forEach((b) => {
        const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
        const mat = new THREE.MeshPhysicalMaterial({
          color: b.color,
          metalness: 0.8,
          roughness: 0.2,
          transparent: true,
          opacity: b.isCritical ? 0.8 : 0.65,
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(b.x, b.h / 2, b.z);
        mesh.userData = { name: b.name, isCritical: b.isCritical };
        scene.add(mesh);
        interactiveBuildings.push(mesh);

        const edgeGeo = new THREE.EdgesGeometry(geo);
        const edgeMat = new THREE.LineBasicMaterial({ color: b.edges, transparent: true, opacity: 0.85 });
        const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
        mesh.add(edgeLines);
      });

      // Critical Incident Beacon Light Column
      const beamGeo = new THREE.CylinderGeometry(0.3, 1.8, 38, 32, 1, true);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xef4444,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      });
      const beaconBeam = new THREE.Mesh(beamGeo, beamMat);
      beaconBeam.position.set(-12, 19, 8);
      scene.add(beaconBeam);

      // Expanding Shockwave Ripples
      const ripples: THREE.Mesh[] = [];
      for (let r = 0; r < 3; r++) {
        const ripGeo = new THREE.RingGeometry(0.5, 0.7, 32);
        const ripMat = new THREE.MeshBasicMaterial({
          color: 0xef4444,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8,
        });
        const ripMesh = new THREE.Mesh(ripGeo, ripMat);
        ripMesh.rotation.x = Math.PI / 2;
        ripMesh.position.set(-12, 0.15, 8);
        scene.add(ripMesh);
        ripples.push(ripMesh);
      }

      // Spline Event Streams
      const splineCurves = [
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-12, 9, 8),
          new THREE.Vector3(-6, 16, 4),
          new THREE.Vector3(0, 14, 0),
        ]),
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 14, 0),
          new THREE.Vector3(-6, 10, -6),
          new THREE.Vector3(-14, 6, -12),
        ]),
      ];

      splineCurves.forEach((curve) => {
        const tubeGeo = new THREE.TubeGeometry(curve, 48, 0.08, 8, false);
        const tubeMat = new THREE.MeshBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.35 });
        scene.add(new THREE.Mesh(tubeGeo, tubeMat));
      });

      const particles: { mesh: THREE.Mesh; curve: THREE.CatmullRomCurve3; progress: number; speed: number }[] = [];
      for (let p = 0; p < 14; p++) {
        const pGeo = new THREE.SphereGeometry(0.24, 8, 8);
        const pMat = new THREE.MeshBasicMaterial({ color: p % 2 === 0 ? 0x38bdf8 : 0xa855f7 });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        const curve = splineCurves[p % splineCurves.length];
        const progress = Math.random();
        pMesh.position.copy(curve.getPointAt(progress));
        scene.add(pMesh);
        particles.push({ mesh: pMesh, curve, progress, speed: 0.003 + Math.random() * 0.004 });
      }

      // Mouse & Raycasting
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const handleMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        sceneStateRef.current.mouseX = mouse.x;
        sceneStateRef.current.mouseY = mouse.y;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(interactiveBuildings);
        if (intersects.length > 0) {
          const hit = intersects[0].object as THREE.Mesh;
          setHoveredObject(hit.userData.name);
          container.style.cursor = 'pointer';
        } else {
          setHoveredObject(null);
          container.style.cursor = 'grab';
        }
      };

      const handleClick = () => {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(interactiveBuildings);
        if (intersects.length > 0) {
          const hit = intersects[0].object as THREE.Mesh;
          if (onSelectBuilding) onSelectBuilding(hit.userData.name);
        }
      };

      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('click', handleClick);

      // WebGL Animation loop
      let animId: number;
      let frameCount = 0;
      let lastFpsTime = performance.now();

      const animate = (time: number) => {
        animId = requestAnimationFrame(animate);

        frameCount++;
        if (time - lastFpsTime >= 1000) {
          setFps(Math.round((frameCount * 1000) / (time - lastFpsTime)));
          frameCount = 0;
          lastFpsTime = time;
        }

        radarGroup.rotation.y += 0.015;

        ripples.forEach((rip) => {
          let s = rip.scale.x + 0.04;
          if (s > 9) s = 0.5;
          rip.scale.set(s, s, s);
          (rip.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - s / 9);
        });

        particles.forEach((p) => {
          p.progress = (p.progress + p.speed) % 1;
          p.mesh.position.copy(p.curve.getPointAt(p.progress));
        });

        const targetPos = sceneStateRef.current.targetCamPos;
        const pX = sceneStateRef.current.mouseX * 4;
        const pY = sceneStateRef.current.mouseY * 3;

        if (autoRotate && activeViewMode === 'radar') {
          const r = 44;
          const curA = Math.atan2(camera.position.z, camera.position.x) + 0.002;
          targetPos.x = Math.cos(curA) * r;
          targetPos.z = Math.sin(curA) * r;
          targetPos.y = 30;
        }

        camera.position.x += (targetPos.x + pX - camera.position.x) * 0.04;
        camera.position.y += (targetPos.y + pY - camera.position.y) * 0.04;
        camera.position.z += (targetPos.z - camera.position.z) * 0.04;

        if (activeViewMode === 'incident') {
          camera.lookAt(-12, 6, 8);
        } else {
          camera.lookAt(0, 2, 0);
        }

        renderer!.render(scene, camera);
      };

      animId = requestAnimationFrame(animate);

      const handleResize = () => {
        if (!container) return;
        width = container.clientWidth;
        height = container.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer?.setSize(width, height);
      };
      window.addEventListener('resize', handleResize);

      sceneStateRef.current.cleanup = () => {
        cancelAnimationFrame(animId);
        window.removeEventListener('resize', handleResize);
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('click', handleClick);
        renderer?.dispose();
      };
      return () => sceneStateRef.current.cleanup?.();
    }

    // =========================================================================
    // 2. ISOMETRIC 2D TACTICAL CANVAS FALLBACK (Zero-Failure Guarantee)
    // =========================================================================
    setRenderEngine('isometric');
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.innerHTML = '';
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let radarAngle = 0;
    let rippleRadius = 0;
    let mousePos = { x: width / 2, y: height / 2 };

    const buildings = [
      { name: 'VIGIL HQ Central Command', x: 0, y: 0, w: 70, h: 100, color: '#0284c7', glow: '#38bdf8' },
      { name: 'Sector A: Engineering Quad', x: 140, y: -60, w: 80, h: 60, color: '#1e293b', glow: '#64748b' },
      { name: 'Sector B: BioMed Complex (CRITICAL)', x: -130, y: 50, w: 75, h: 70, color: '#7f1d1d', glow: '#ef4444', isCritical: true },
      { name: 'Sector C: Data Infrastructure', x: -140, y: -90, w: 60, h: 50, color: '#312e81', glow: '#818cf8' },
      { name: 'Sector D: Student Commons', x: 120, y: 90, w: 70, h: 45, color: '#0f172a', glow: '#06b6d4' },
    ];

    const toIso = (x: number, y: number, z: number = 0) => {
      const centerX = width / 2;
      const centerY = height / 2 + 20;
      const isoX = (x - y) * Math.cos(Math.PI / 6);
      const isoY = (x + y) * Math.sin(Math.PI / 6) - z;
      return { x: centerX + isoX, y: centerY + isoY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mousePos = { x: e.clientX - rect.left, y: e.clientY - rect.top };

      let found: string | null = null;
      buildings.forEach((b) => {
        const pt = toIso(b.x, b.y, b.h / 2);
        const dist = Math.hypot(mousePos.x - pt.x, mousePos.y - pt.y);
        if (dist < 45) found = b.name;
      });
      setHoveredObject(found);
      canvas.style.cursor = found ? 'pointer' : 'crosshair';
    };

    const handleClick = () => {
      buildings.forEach((b) => {
        const pt = toIso(b.x, b.y, b.h / 2);
        const dist = Math.hypot(mousePos.x - pt.x, mousePos.y - pt.y);
        if (dist < 45 && onSelectBuilding) onSelectBuilding(b.name);
      });
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    const drawIso = () => {
      animId = requestAnimationFrame(drawIso);
      ctx.clearRect(0, 0, width, height);

      // Radar Range Rings
      const center = toIso(0, 0, 0);
      radarAngle += 0.02;

      ctx.save();
      [90, 180, 270].forEach((r, i) => {
        ctx.beginPath();
        ctx.ellipse(center.x, center.y, r * 1.6, r * 0.8, 0, 0, Math.PI * 2);
        ctx.strokeStyle = i === 1 ? 'rgba(6, 182, 212, 0.4)' : 'rgba(30, 58, 95, 0.3)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });

      // Rotating Radar Beam
      ctx.beginPath();
      ctx.moveTo(center.x, center.y);
      const sweepEnd = {
        x: center.x + Math.cos(radarAngle) * 360,
        y: center.y + Math.sin(radarAngle) * 180,
      };
      ctx.lineTo(sweepEnd.x, sweepEnd.y);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Sweep gradient fan
      ctx.beginPath();
      ctx.moveTo(center.x, center.y);
      ctx.lineTo(sweepEnd.x, sweepEnd.y);
      ctx.lineTo(
        center.x + Math.cos(radarAngle - 0.4) * 360,
        center.y + Math.sin(radarAngle - 0.4) * 180
      );
      ctx.closePath();
      ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.fill();
      ctx.restore();

      // Buildings
      buildings.forEach((b) => {
        const pt = toIso(b.x, b.y, 0);
        const topPt = toIso(b.x, b.y, b.h);

        // Building base shadow
        ctx.fillStyle = b.isCritical ? 'rgba(239, 68, 68, 0.3)' : 'rgba(15, 23, 42, 0.8)';
        ctx.beginPath();
        ctx.ellipse(pt.x, pt.y, b.w * 0.6, b.w * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Isometric Box
        ctx.strokeStyle = b.glow;
        ctx.lineWidth = b.isCritical ? 2.5 : 1.5;
        ctx.fillStyle = b.color;

        // Front Face
        ctx.beginPath();
        ctx.moveTo(pt.x - 25, pt.y);
        ctx.lineTo(pt.x + 25, pt.y);
        ctx.lineTo(topPt.x + 25, topPt.y);
        ctx.lineTo(topPt.x - 25, topPt.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Rooftop Beacon
        ctx.fillStyle = b.isCritical ? '#ef4444' : '#38bdf8';
        ctx.beginPath();
        ctx.arc(topPt.x, topPt.y, b.isCritical ? 5 : 3, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.fillStyle = 'rgba(203, 213, 225, 0.8)';
        ctx.font = '10px monospace';
        ctx.fillText(b.name.split(':')[0], topPt.x - 20, topPt.y - 10);
      });

      // Pulsing Critical Beacon Ripples
      const beaconPt = toIso(-130, 50, 0);
      rippleRadius = (rippleRadius + 0.8) % 60;
      ctx.beginPath();
      ctx.ellipse(beaconPt.x, beaconPt.y, rippleRadius * 1.5, rippleRadius * 0.8, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(239, 68, 68, ${Math.max(0, 1 - rippleRadius / 60)})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Vertical Light Beam
      ctx.beginPath();
      ctx.moveTo(beaconPt.x, beaconPt.y);
      ctx.lineTo(beaconPt.x, beaconPt.y - 120);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
      ctx.lineWidth = 3;
      ctx.stroke();
    };

    animId = requestAnimationFrame(drawIso);

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    sceneStateRef.current.cleanup = () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };

    return () => sceneStateRef.current.cleanup?.();
  }, [autoRotate, activeViewMode, onSelectBuilding]);

  const handleViewModeChange = (mode: 'radar' | 'incident' | 'topology') => {
    setActiveViewMode(mode);
    if (mode === 'incident') {
      setAutoRotate(false);
      sceneStateRef.current.targetCamPos.set(-2, 14, 18);
    } else if (mode === 'topology') {
      setAutoRotate(false);
      sceneStateRef.current.targetCamPos.set(0, 52, 2);
    } else {
      setAutoRotate(true);
      sceneStateRef.current.targetCamPos.set(32, 28, 38);
    }
  };

  return (
    <div className="relative w-full h-[540px] md:h-[620px] rounded-2xl border border-white/[0.08] bg-[#060911]/90 overflow-hidden shadow-2xl shadow-cyan-950/30">
      
      {/* 3D WebGL / Isometric Canvas Mounting Node */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top HUD Telemetry Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-white/[0.08] backdrop-blur-md flex items-center gap-2 text-xs font-mono text-cyan-400">
            <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span className="font-bold">3D CAMPUS DEFENSE GRID</span>
            <span className="text-[10px] text-slate-400 uppercase">[{renderEngine.toUpperCase()} CORE]</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-white/[0.08] backdrop-blur-md text-[11px] font-mono text-slate-300">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span>FPS: <strong className="text-emerald-400">{fps}</strong></span>
          </div>
        </div>

        {/* View Controls (Interactive) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => handleViewModeChange('radar')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all border ${
              activeViewMode === 'radar'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/30'
                : 'bg-slate-900/80 text-slate-400 border-white/[0.08] hover:text-white'
            }`}
          >
            TACTICAL RADAR
          </button>
          <button
            onClick={() => handleViewModeChange('incident')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all border ${
              activeViewMode === 'incident'
                ? 'bg-red-500/20 text-red-300 border-red-500/40 shadow-sm shadow-red-500/30'
                : 'bg-slate-900/80 text-slate-400 border-white/[0.08] hover:text-white'
            }`}
          >
            ACTIVE BEACON
          </button>
          <button
            onClick={() => handleViewModeChange('topology')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all border ${
              activeViewMode === 'topology'
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm shadow-purple-500/30'
                : 'bg-slate-900/80 text-slate-400 border-white/[0.08] hover:text-white'
            }`}
          >
            TOPOLOGY
          </button>
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            title="Toggle Auto Orbit"
            className={`p-1.5 rounded border transition-colors ${
              autoRotate 
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' 
                : 'bg-slate-900/80 text-slate-400 border-white/[0.08]'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
          </button>
        </div>
      </div>

      {/* Floating Tactical Hover Annotation Card */}
      {hoveredObject && (
        <div className="absolute top-16 left-4 z-20 px-3.5 py-2.5 rounded-xl bg-slate-950/90 border border-cyan-500/40 backdrop-blur-md shadow-xl text-xs font-mono animate-fadeIn pointer-events-none">
          <div className="flex items-center gap-2 text-cyan-300 font-bold mb-1">
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <span>{hoveredObject}</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-slate-400">
            <span>COORDS: [LAT: 37.7749, LNG: -122.4194]</span>
            <span className="text-emerald-400">SENSORS: 48 ACTIVE</span>
          </div>
        </div>
      )}

      {/* Bottom HUD Coordinates & Mission Telemetry */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-white/[0.08] backdrop-blur-md text-[11px] font-mono text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>CAMPUS MESH: <strong className="text-cyan-400">6 SECTORS ARMED</strong></span>
          <span className="text-slate-500">|</span>
          <span>POSTGIS RADIUS: <strong className="text-purple-400">500M GEOFENCE</strong></span>
        </div>

        {/* Live Threat Bar */}
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-white/[0.08] backdrop-blur-md text-[11px] font-mono">
          <span className="text-slate-400">INCIDENT SIGNAL:</span>
          <span className="text-red-400 font-bold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-red-400 animate-pulse" />
            SECTOR B (INC-00921)
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-emerald-400 font-semibold">UNIT #R-104 DISPATCHED</span>
        </div>
      </div>

      {/* Reticles */}
      <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-500/40 pointer-events-none"></div>
      <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-500/40 pointer-events-none"></div>
      <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-500/40 pointer-events-none"></div>
      <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-500/40 pointer-events-none"></div>
    </div>
  );
}
