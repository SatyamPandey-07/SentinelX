'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  Shield, 
  Activity, 
  Crosshair, 
  Radio, 
  Maximize2, 
  RotateCw, 
  Eye, 
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
  const [telemetry, setTelemetry] = useState({
    camX: 32,
    camY: 28,
    camZ: 38,
    activeSignals: 142,
    lockedResponders: 6,
    threatLevel: 'DEFCON-2',
  });

  const sceneStateRef = useRef<{
    renderer?: THREE.WebGLRenderer;
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    radarGroup?: THREE.Group;
    beaconMesh?: THREE.Mesh;
    beaconRipples?: THREE.Mesh[];
    particles?: { mesh: THREE.Mesh; curve: THREE.CatmullRomCurve3; progress: number; speed: number }[];
    interactiveBuildings: THREE.Mesh[];
    droneMesh?: THREE.Group;
    droneAngle: number;
    targetCamPos: THREE.Vector3;
    isUserInteracting: boolean;
    mouseX: number;
    mouseY: number;
    cleanup?: () => void;
  }>({
    interactiveBuildings: [],
    droneAngle: 0,
    targetCamPos: new THREE.Vector3(32, 28, 38),
    isUserInteracting: false,
    mouseX: 0,
    mouseY: 0,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. SCENE CREATION
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060911, 0.015);
    sceneStateRef.current.scene = scene;

    // 2. CAMERA
    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(32, 28, 38);
    camera.lookAt(0, 2, 0);
    sceneStateRef.current.camera = camera;

    // 3. RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x060911, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    sceneStateRef.current.renderer = renderer;

    // 4. LIGHTING (Cinematic Mission Control Glow)
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x38bdf8, 2.5);
    keyLight.position.set(40, 60, 30);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x818cf8, 1.2);
    rimLight.position.set(-30, 20, -30);
    scene.add(rimLight);

    const beaconLight = new THREE.PointLight(0xef4444, 4, 35);
    beaconLight.position.set(-10, 8, 8);
    scene.add(beaconLight);

    // 5. GROUND GRID & HOLOGRAPHIC DEFENSE RINGS
    const gridHelper = new THREE.GridHelper(80, 40, 0x0284c7, 0x1e293b);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    const radarGroup = new THREE.Group();
    scene.add(radarGroup);
    sceneStateRef.current.radarGroup = radarGroup;

    // Concentric Tactical Defense Rings
    const ringRadii = [12, 22, 34];
    ringRadii.forEach((radius, i) => {
      const ringGeo = new THREE.RingGeometry(radius - 0.08, radius + 0.08, 64);
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

    // Rotating Segmented Outer Perimeter Ring
    const outerDashedRingGeo = new THREE.RingGeometry(37, 37.4, 48);
    const outerDashedRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
      wireframe: true,
    });
    const outerDashedRing = new THREE.Mesh(outerDashedRingGeo, outerDashedRingMat);
    outerDashedRing.rotation.x = Math.PI / 2;
    outerDashedRing.position.y = 0.08;
    radarGroup.add(outerDashedRing);

    // Radar Scanning Fan Blade
    const sweepGeo = new THREE.RingGeometry(0.1, 34, 32, 1, 0, Math.PI / 3);
    const sweepMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.15,
    });
    const sweepMesh = new THREE.Mesh(sweepGeo, sweepMat);
    sweepMesh.rotation.x = Math.PI / 2;
    sweepMesh.position.y = 0.06;
    radarGroup.add(sweepMesh);

    // 6. PROCEDURAL 3D CAMPUS BUILDINGS
    const interactiveBuildings: THREE.Mesh[] = [];

    const buildingData = [
      { name: 'VIGIL HQ Central Command', x: 0, z: 0, w: 7, d: 7, h: 14, color: 0x0284c7, edges: 0x38bdf8 },
      { name: 'Sector A: Engineering Quad', x: 14, z: -10, w: 9, d: 6, h: 8, color: 0x1e293b, edges: 0x64748b },
      { name: 'Sector B: BioMed Complex (CRITICAL)', x: -12, z: 8, w: 8, d: 7, h: 9, color: 0x7f1d1d, edges: 0xef4444, isCritical: true },
      { name: 'Sector C: Data Infrastructure', x: -14, z: -12, w: 6, d: 10, h: 6, color: 0x312e81, edges: 0x818cf8 },
      { name: 'Sector D: Student Commons', x: 12, z: 12, w: 7, d: 7, h: 5, color: 0x0f172a, edges: 0x06b6d4 },
      { name: 'Sector E: Autonomous Hangar', x: -2, z: -16, w: 10, d: 5, h: 4, color: 0x111827, edges: 0x10b981 },
      { name: 'North Perimeter Sentinel Tower', x: 0, z: 22, w: 3, d: 3, h: 11, color: 0x0369a1, edges: 0x38bdf8 },
    ];

    buildingData.forEach((b) => {
      const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
      const mat = new THREE.MeshPhysicalMaterial({
        color: b.color,
        metalness: 0.85,
        roughness: 0.25,
        transparent: true,
        opacity: b.isCritical ? 0.75 : 0.65,
        transmission: 0.2,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(b.x, b.h / 2, b.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { name: b.name, isCritical: b.isCritical, baseColor: b.color, height: b.h };
      scene.add(mesh);
      interactiveBuildings.push(mesh);

      // Glowing Neon Wireframe Edges (Spline Tactical Aesthetic)
      const edgeGeo = new THREE.EdgesGeometry(geo);
      const edgeMat = new THREE.LineBasicMaterial({
        color: b.edges,
        linewidth: 2,
        transparent: true,
        opacity: 0.85,
      });
      const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
      mesh.add(edgeLines);

      // Rooftop telemetry beacon point
      const roofBeaconGeo = new THREE.SphereGeometry(0.3, 16, 16);
      const roofBeaconMat = new THREE.MeshBasicMaterial({
        color: b.isCritical ? 0xef4444 : 0x38bdf8,
      });
      const roofBeacon = new THREE.Mesh(roofBeaconGeo, roofBeaconMat);
      roofBeacon.position.set(0, b.h / 2 + 0.3, 0);
      mesh.add(roofBeacon);
    });

    sceneStateRef.current.interactiveBuildings = interactiveBuildings;

    // 7. CRITICAL INCIDENT BEACON & HOLOGRAPHIC LIGHT BEAM
    // Vertical Light Pillar at Sector B
    const beamGeo = new THREE.CylinderGeometry(0.3, 1.8, 40, 32, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    const beaconBeam = new THREE.Mesh(beamGeo, beamMat);
    beaconBeam.position.set(-12, 20, 8);
    scene.add(beaconBeam);
    sceneStateRef.current.beaconMesh = beaconBeam;

    // Concentric expanding ground ripples
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
      ripMesh.userData = { offset: r * 0.33 };
      scene.add(ripMesh);
      ripples.push(ripMesh);
    }
    sceneStateRef.current.beaconRipples = ripples;

    // 8. 3D SPLINE PACKET STREAMS (Real-time Event Pipeline)
    const splineCurves = [
      // Incident Sector B -> High-altitude Uplink -> Central HQ
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-12, 9, 8),
        new THREE.Vector3(-8, 16, 4),
        new THREE.Vector3(-4, 18, 2),
        new THREE.Vector3(0, 14, 0),
      ]),
      // Central HQ -> Sector C Data Backbone
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 14, 0),
        new THREE.Vector3(-6, 12, -6),
        new THREE.Vector3(-14, 8, -12),
      ]),
      // Central HQ -> Responder Outpost Sector E
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 14, 0),
        new THREE.Vector3(6, 10, -8),
        new THREE.Vector3(-2, 5, -16),
      ]),
    ];

    // Draw spline tubes
    splineCurves.forEach((curve) => {
      const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.08, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: 0.3,
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      scene.add(tubeMesh);
    });

    // Particle Pulses along Splines
    const particles: { mesh: THREE.Mesh; curve: THREE.CatmullRomCurve3; progress: number; speed: number }[] = [];
    const particleColors = [0x38bdf8, 0xa855f7, 0xef4444, 0x10b981];

    for (let p = 0; p < 18; p++) {
      const pGeo = new THREE.SphereGeometry(0.25, 8, 8);
      const pMat = new THREE.MeshBasicMaterial({
        color: particleColors[p % particleColors.length],
      });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      const curve = splineCurves[p % splineCurves.length];
      const progress = Math.random();
      const pt = curve.getPointAt(progress);
      pMesh.position.copy(pt);
      scene.add(pMesh);

      particles.push({
        mesh: pMesh,
        curve,
        progress,
        speed: 0.003 + Math.random() * 0.005,
      });
    }
    sceneStateRef.current.particles = particles;

    // 9. AUTONOMOUS PATROL DRONE
    const droneGroup = new THREE.Group();
    const droneCoreGeo = new THREE.ConeGeometry(0.6, 1.2, 4);
    const droneCoreMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const droneCore = new THREE.Mesh(droneCoreGeo, droneCoreMat);
    droneCore.rotation.x = Math.PI / 2;
    droneGroup.add(droneCore);

    const droneHaloGeo = new THREE.RingGeometry(0.8, 1.0, 16);
    const droneHaloMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide });
    const droneHalo = new THREE.Mesh(droneHaloGeo, droneHaloMat);
    droneGroup.add(droneHalo);

    droneGroup.position.set(22, 12, 0);
    scene.add(droneGroup);
    sceneStateRef.current.droneMesh = droneGroup;

    // 10. MOUSE INTERACTION & RAYCASTING
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
        const hitBuilding = intersects[0].object as THREE.Mesh;
        const name = hitBuilding.userData.name;
        setHoveredObject(name);
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
        const hitBuilding = intersects[0].object as THREE.Mesh;
        const name = hitBuilding.userData.name;
        if (onSelectBuilding) onSelectBuilding(name);
      }
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('click', handleClick);

    // 11. ANIMATION LOOP (GSAP-synchronized 60/120 FPS)
    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsUpdate = performance.now();

    const animate = (time: number) => {
      animationFrameId = requestAnimationFrame(animate);

      // FPS Calculation
      frameCount++;
      if (time - lastFpsUpdate >= 1000) {
        setFps(Math.round((frameCount * 1000) / (time - lastFpsUpdate)));
        frameCount = 0;
        lastFpsUpdate = time;
      }

      // Rotate radar sweeping line
      if (radarGroup) {
        radarGroup.rotation.y += 0.015;
      }

      // Pulse Critical Beacon ripples
      if (ripples) {
        ripples.forEach((rip) => {
          let scale = rip.scale.x + 0.04;
          if (scale > 10) scale = 0.5;
          rip.scale.set(scale, scale, scale);
          const mat = rip.material as THREE.MeshBasicMaterial;
          mat.opacity = Math.max(0, 1 - scale / 10);
        });
      }

      // Spline particles stream
      if (particles) {
        particles.forEach((p) => {
          p.progress = (p.progress + p.speed) % 1;
          const pos = p.curve.getPointAt(p.progress);
          p.mesh.position.copy(pos);
        });
      }

      // Autonomous Drone orbit
      if (droneGroup) {
        sceneStateRef.current.droneAngle += 0.012;
        const angle = sceneStateRef.current.droneAngle;
        const r = 24;
        droneGroup.position.set(Math.cos(angle) * r, 10 + Math.sin(angle * 2) * 2, Math.sin(angle) * r);
        droneGroup.rotation.y = -angle + Math.PI / 2;
      }

      // Camera Mouse Parallax & View Transitions
      const targetPos = sceneStateRef.current.targetCamPos;
      const mouseParallaxX = sceneStateRef.current.mouseX * 4;
      const mouseParallaxY = sceneStateRef.current.mouseY * 3;

      if (autoRotate && activeViewMode === 'radar') {
        const orbitSpeed = 0.002;
        const currentR = Math.hypot(camera.position.x, camera.position.z);
        const curAngle = Math.atan2(camera.position.z, camera.position.x) + orbitSpeed;
        targetPos.x = Math.cos(curAngle) * 44;
        targetPos.z = Math.sin(curAngle) * 44;
        targetPos.y = 30;
      }

      camera.position.x += (targetPos.x + mouseParallaxX - camera.position.x) * 0.04;
      camera.position.y += (targetPos.y + mouseParallaxY - camera.position.y) * 0.04;
      camera.position.z += (targetPos.z - camera.position.z) * 0.04;

      if (activeViewMode === 'incident') {
        camera.lookAt(-12, 6, 8);
      } else {
        camera.lookAt(0, 2, 0);
      }

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    sceneStateRef.current.cleanup = () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('click', handleClick);
      renderer.dispose();
    };

    return () => {
      if (sceneStateRef.current.cleanup) {
        sceneStateRef.current.cleanup();
      }
    };
  }, [autoRotate, activeViewMode, onSelectBuilding]);

  // Handle Camera view mode shifts
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
      
      {/* 3D WebGL Canvas Mounting Node */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top HUD Telemetry Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-white/[0.08] backdrop-blur-md flex items-center gap-2 text-xs font-mono text-cyan-400">
            <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span className="font-bold">3D CAMPUS DEFENSE GRID</span>
            <span className="text-[10px] text-slate-400">LIVE RENDER</span>
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

      {/* Subtle Corner Reticles (Mission Control Feel) */}
      <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-500/40 pointer-events-none"></div>
      <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-500/40 pointer-events-none"></div>
      <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-500/40 pointer-events-none"></div>
      <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-500/40 pointer-events-none"></div>
    </div>
  );
}
