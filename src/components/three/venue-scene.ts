import * as THREE from "three";
import type { TVenueLayout } from "@/lib/venue-layouts";

/**
 * The 3D venue behind "View in 3D": a layout drawn from simple shapes, with
 * each ticket's area coloured and labelled. Drag to turn, scroll or pinch to
 * zoom, tap an area. Plain three.js, loaded only when a buyer asks for it.
 */

export type TSceneZone = {
  zone: string;
  title: string;
  subtitle: string;
  color: string;
  soldOut: boolean;
};

type TBuiltZone = { meshes: THREE.Object3D[]; eye: THREE.Vector3; label: THREE.Vector3 };

const STAGE_LOOK = new THREE.Vector3(0, 2.4, -8);

const material = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.05, ...extra });

/** A flat block an area stands on. */
const pad = (w: number, d: number, x: number, y: number, z: number, h = 0.25) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material("#888888", { transparent: true, opacity: 0.92 }));
  mesh.position.set(x, y + h / 2, z);
  return mesh;
};

/** Rows of seats as low blocks, for seated areas. */
const seatRows = (rows: number, width: number, x: number, z: number, y = 0, gap = 1.1) =>
  Array.from({ length: rows }, (_, row) => pad(width, 0.7, x, y + row * 0.18, z + row * gap, 0.45));

const stageSet = (scene: THREE.Scene, width = 12, screens = 1) => {
  const stage = new THREE.Mesh(new THREE.BoxGeometry(width, 1.2, 4), material("#1f2a37"));
  stage.position.set(0, 0.6, -8);
  scene.add(stage);
  const glow = { emissive: new THREE.Color("#00b2ff"), emissiveIntensity: 0.35 };
  if (screens === 1) {
    const screen = new THREE.Mesh(new THREE.BoxGeometry(width - 2, 4.5, 0.2), material("#0b1d2a", glow));
    screen.position.set(0, 3.6, -9.8);
    scene.add(screen);
  } else {
    [-width / 3, width / 3].forEach((x) => {
      const screen = new THREE.Mesh(new THREE.BoxGeometry(width / 3, 3, 0.2), material("#0b1d2a", glow));
      screen.position.set(x, 3.4, -9.8);
      scene.add(screen);
    });
  }
  [-0.38, -0.13, 0.13, 0.38].forEach((share) => {
    const light = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.4, 12),
      material("#f5f5f5", { emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0.6 }),
    );
    light.position.set(share * width, 6.1, -9.4);
    scene.add(light);
  });
};

const booths = (x: number, zs: number[]) =>
  zs.flatMap((z) => {
    const table = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.9, 16), material("#fde68a"));
    table.position.set(x, 0.8, z);
    return [pad(3, 2.6, x, 0, z, 0.35), table];
  });

/** Each layout: the fixed set pieces, and every area's shapes, eye point and label spot. */
const LAYOUTS: Record<TVenueLayout, (scene: THREE.Scene) => Record<string, TBuiltZone>> = {
  concert: (scene) => {
    stageSet(scene);
    return {
      front_pit: { meshes: [pad(11, 4, 0, 0, -3.6)], eye: new THREE.Vector3(0, 1.7, -2.6), label: new THREE.Vector3(0, 2.1, -3.6) },
      main_floor: { meshes: [pad(15, 7, 0, 0, 2.6)], eye: new THREE.Vector3(0, 1.7, 3.6), label: new THREE.Vector3(0, 2.1, 2.6) },
      side_booths: { meshes: [...booths(-9.5, [-4, 0, 4]), ...booths(9.5, [-4, 0, 4])], eye: new THREE.Vector3(9.5, 1.5, 0.5), label: new THREE.Vector3(9.5, 2.6, -6.4) },
      balcony: {
        meshes: [0, 1, 2].map((i) => pad(18, 2, 0, 1.2 + i * 0.9, 8.6 + i * 1.8, 0.4)),
        eye: new THREE.Vector3(0, 4.6, 11.5),
        label: new THREE.Vector3(0, 5.6, 10.4),
      },
    };
  },
  club: (scene) => {
    const booth = new THREE.Mesh(new THREE.BoxGeometry(6, 1.1, 2.5), material("#1f2a37"));
    booth.position.set(0, 0.55, -8);
    scene.add(booth);
    const decks = new THREE.Mesh(new THREE.BoxGeometry(3, 0.3, 1), material("#0b1d2a", { emissive: new THREE.Color("#a855f7"), emissiveIntensity: 0.5 }));
    decks.position.set(0, 1.25, -8);
    scene.add(decks);
    const counter = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 10), material("#3f2d1f"));
    counter.position.set(-11, 0.55, 0);
    scene.add(counter);
    return {
      dance_floor: { meshes: [pad(10, 9, 0, 0, -1.5)], eye: new THREE.Vector3(0, 1.7, -0.5), label: new THREE.Vector3(0, 2.1, -1.5) },
      bar: { meshes: [pad(3.5, 10, -8.6, 0, 0)], eye: new THREE.Vector3(-8.6, 1.7, 3), label: new THREE.Vector3(-8.6, 2.4, -4.5) },
      vip_booths: { meshes: booths(9, [-5, -1, 3]), eye: new THREE.Vector3(9, 1.5, 4.5), label: new THREE.Vector3(9, 2.6, -6.6) },
      mezzanine: { meshes: [pad(20, 4, 0, 2.6, 8.5, 0.4)], eye: new THREE.Vector3(0, 4.7, 9.5), label: new THREE.Vector3(0, 4.4, 8.5) },
    };
  },
  festival: (scene) => {
    stageSet(scene, 16);
    const tower = new THREE.Mesh(new THREE.BoxGeometry(1.2, 7, 1.2), material("#374151"));
    [-9, 9].forEach((x) => {
      const t = tower.clone();
      t.position.set(x, 3.5, -8);
      scene.add(t);
    });
    return {
      front_stage: { meshes: [pad(14, 5, 0, 0, -3)], eye: new THREE.Vector3(0, 1.7, -1.8), label: new THREE.Vector3(0, 2.1, -3) },
      general_field: { meshes: [pad(22, 8, 0, 0, 4.5)], eye: new THREE.Vector3(0, 1.7, 5.5), label: new THREE.Vector3(0, 2.1, 4.5) },
      vip_deck: { meshes: [pad(5, 6, -12, 1.2, -3, 0.4)], eye: new THREE.Vector3(-12, 3.2, -1.5), label: new THREE.Vector3(-12, 3.4, -3) },
      back_lawn: { meshes: [pad(22, 4, 0, 0, 11)], eye: new THREE.Vector3(0, 1.6, 12), label: new THREE.Vector3(0, 2.1, 11) },
    };
  },
  theatre: (scene) => {
    stageSet(scene, 14);
    const curtain = new THREE.Mesh(new THREE.BoxGeometry(16, 6, 0.3), material("#7f1d1d"));
    curtain.position.set(0, 3.5, -10.2);
    scene.add(curtain);
    return {
      front_stalls: { meshes: seatRows(4, 13, 0, -4), eye: new THREE.Vector3(0, 1.4, -2.6), label: new THREE.Vector3(0, 2.2, -3) },
      back_stalls: { meshes: seatRows(4, 15, 0, 1.2), eye: new THREE.Vector3(0, 1.8, 3.6), label: new THREE.Vector3(0, 2.6, 2.6) },
      circle: { meshes: seatRows(3, 18, 0, 8, 2.6, 1.3), eye: new THREE.Vector3(0, 4.6, 10.2), label: new THREE.Vector3(0, 4.9, 9) },
      boxes: {
        meshes: [-11, 11].flatMap((x) => [-3, 1].map((z) => pad(2.2, 2.6, x, 2.4, z, 0.4))),
        eye: new THREE.Vector3(11, 4, 1),
        label: new THREE.Vector3(11, 4.2, -5.5),
      },
    };
  },
  conference: (scene) => {
    stageSet(scene, 12, 2);
    const lectern = new THREE.Mesh(new THREE.BoxGeometry(1, 1.3, 0.7), material("#334155"));
    lectern.position.set(3.5, 1.85, -7.2);
    scene.add(lectern);
    return {
      front_rows: { meshes: seatRows(3, 12, 0, -3.5), eye: new THREE.Vector3(0, 1.4, -2.4), label: new THREE.Vector3(0, 2.1, -2.6) },
      main_seating: { meshes: seatRows(4, 14, 0, 0.8), eye: new THREE.Vector3(0, 1.4, 3), label: new THREE.Vector3(0, 2.3, 2.2) },
      back_rows: { meshes: seatRows(3, 16, 0, 6), eye: new THREE.Vector3(0, 1.6, 8.6), label: new THREE.Vector3(0, 2.4, 7.2) },
      expo_area: {
        meshes: [-11.5, 11.5].flatMap((x) => [-2, 2, 6].map((z) => pad(2.4, 2.4, x, 0, z, 1.2))),
        eye: new THREE.Vector3(11.5, 1.7, 9),
        label: new THREE.Vector3(11.5, 2.8, -4.4),
      },
    };
  },
};

/** A floating name tag, drawn on a canvas so it needs no font files. */
const labelSprite = (title: string, subtitle: string, color: string) => {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 160;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "rgba(11,29,42,.88)";
  g.beginPath();
  g.roundRect(8, 8, 496, 144, 36);
  g.fill();
  g.fillStyle = color;
  g.beginPath();
  g.arc(56, 80, 16, 0, Math.PI * 2);
  g.fill();
  const fit = (text: string, max: number) => {
    let out = text;
    while (g.measureText(out).width > max && out.length > 3) out = `${out.slice(0, -2)}…`;
    return out;
  };
  g.fillStyle = "#ffffff";
  g.font = "700 46px 'Plus Jakarta Sans', sans-serif";
  g.fillText(fit(title, 390), 90, 72);
  g.fillStyle = "#b9d7ea";
  g.font = "600 34px 'Plus Jakarta Sans', sans-serif";
  g.fillText(fit(subtitle, 390), 90, 122);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), depthTest: false }));
  sprite.scale.set(4.2, 1.3, 1);
  sprite.renderOrder = 10;
  return sprite;
};

export type TVenueScene = {
  select: (zone: string | null) => void;
  viewFrom: (zone: string | null) => void;
  setDark: (dark: boolean) => void;
  dispose: () => void;
};

export const createVenueScene = (
  canvas: HTMLCanvasElement,
  options: {
    layout: TVenueLayout;
    zones: TSceneZone[];
    dark: boolean;
    reduceMotion: boolean;
    onTap: (zone: string | null) => void;
  },
): TVenueScene => {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 16 / 10, 0.1, 200);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 0.9));
  const sun = new THREE.DirectionalLight(0xffffff, 0.7);
  sun.position.set(6, 14, 10);
  scene.add(sun);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(30, 0.2, 26), material(options.dark ? "#1b2635" : "#dfe7f0"));
  floor.position.y = -0.1;
  scene.add(floor);

  // Areas: coloured by their ticket; areas without a ticket stay out.
  const built = LAYOUTS[options.layout](scene);
  const areas = new Map<string, { meshes: THREE.Mesh[]; eye: THREE.Vector3; color: string }>();
  const labels: THREE.Sprite[] = [];
  for (const zone of options.zones) {
    const shape = built[zone.zone];
    if (!shape) continue;
    const color = zone.soldOut ? "#8a949e" : zone.color;
    const meshes: THREE.Mesh[] = [];
    shape.meshes.forEach((object) => {
      if (object instanceof THREE.Mesh) {
        (object.material as THREE.MeshStandardMaterial).color.set(color);
        object.userData.zone = zone.zone;
        meshes.push(object);
      }
      scene.add(object);
    });
    const label = labelSprite(zone.title, zone.subtitle, color);
    label.position.copy(shape.label);
    scene.add(label);
    labels.push(label);
    areas.set(zone.zone, { meshes, eye: shape.eye, color });
  }
  // Areas no ticket uses, as faint outlines so the room still reads.
  for (const [key, shape] of Object.entries(built)) {
    if (areas.has(key)) continue;
    shape.meshes.forEach((object) => {
      if (object instanceof THREE.Mesh) {
        const mat = object.material as THREE.MeshStandardMaterial;
        mat.color.set(options.dark ? "#334155" : "#cbd5e1");
        mat.opacity = 0.5;
      }
      scene.add(object);
    });
  }

  // Camera: orbit the room; "view from here" moves to an area facing the stage.
  const target = new THREE.Vector3(0, 1, 0);
  let theta = 0.55;
  let phi = 1.0;
  let radius = 30;
  let inside = false;
  let selected: string | null = null;
  const currentLook = target.clone();
  let flight: { from: THREE.Vector3; to: THREE.Vector3; lookFrom: THREE.Vector3; lookTo: THREE.Vector3; t: number } | null = null;
  const overview = () =>
    new THREE.Vector3(radius * Math.sin(phi) * Math.sin(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.cos(theta));
  const flyTo = (position: THREE.Vector3, look: THREE.Vector3) => {
    if (options.reduceMotion) {
      camera.position.copy(position);
      currentLook.copy(look);
      camera.lookAt(look);
      return;
    }
    flight = { from: camera.position.clone(), to: position.clone(), lookFrom: currentLook.clone(), lookTo: look.clone(), t: 0 };
  };
  camera.position.copy(overview());
  camera.lookAt(target);

  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  // Drag to turn, wheel or pinch to zoom, tap to pick.
  const pointers = new Map<number, PointerEvent>();
  let drag: { x: number; y: number } | null = null;
  let moved = false;
  let pinch: number | null = null;
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const tapAt = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    ndc.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects([...areas.values()].flatMap((area) => area.meshes))[0];
    options.onTap((hit?.object.userData.zone as string | undefined) ?? null);
  };
  const onDown = (event: PointerEvent) => {
    canvas.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, event);
    drag = { x: event.clientX, y: event.clientY };
    moved = false;
  };
  const onMove = (event: PointerEvent) => {
    if (!drag) return;
    pointers.set(event.pointerId, event);
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      if (pinch) radius = Math.min(44, Math.max(14, (radius * pinch) / distance));
      pinch = distance;
      moved = true;
      return;
    }
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
    if (inside) return;
    theta -= dx * 0.008;
    phi = Math.min(1.35, Math.max(0.35, phi - dy * 0.006));
    drag = { x: event.clientX, y: event.clientY };
  };
  const onUp = (event: PointerEvent) => {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinch = null;
    if (!pointers.size) {
      if (!moved) tapAt(event);
      drag = null;
    }
  };
  const onWheel = (event: WheelEvent) => {
    if (inside) return;
    event.preventDefault();
    radius = Math.min(44, Math.max(14, radius + event.deltaY * 0.02));
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });

  let frame = 0;
  const tick = () => {
    if (flight) {
      flight.t = Math.min(1, flight.t + 0.025);
      const k = 1 - Math.pow(1 - flight.t, 3);
      camera.position.lerpVectors(flight.from, flight.to, k);
      currentLook.lerpVectors(flight.lookFrom, flight.lookTo, k);
      camera.lookAt(currentLook);
      if (flight.t === 1) flight = null;
    } else if (!inside) {
      if (!drag && !options.reduceMotion && !selected) theta += 0.0012;
      camera.position.copy(overview());
      currentLook.copy(target);
      camera.lookAt(target);
    }
    renderer.render(scene, camera);
    frame = requestAnimationFrame(tick);
  };
  resize();
  tick();

  return {
    select: (zone) => {
      selected = zone;
      areas.forEach((area, key) =>
        area.meshes.forEach((mesh) => {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          const on = key === zone;
          mat.emissive.set(on ? area.color : "#000000");
          mat.emissiveIntensity = on ? 0.45 : 0;
          mat.opacity = !zone || on ? 0.92 : 0.45;
        }),
      );
    },
    viewFrom: (zone) => {
      const area = zone ? areas.get(zone) : null;
      // Name tags would float in front of you once you're standing in the room.
      labels.forEach((label) => (label.visible = !area));
      if (area) {
        inside = true;
        flyTo(area.eye, STAGE_LOOK);
      } else {
        inside = false;
        flyTo(overview(), target);
      }
    },
    setDark: (dark) => (floor.material as THREE.MeshStandardMaterial).color.set(dark ? "#1b2635" : "#dfe7f0"),
    dispose: () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("wheel", onWheel);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Sprite) {
          object.geometry?.dispose();
          const mats = Array.isArray(object.material) ? object.material : [object.material];
          mats.forEach((mat) => {
            (mat as THREE.SpriteMaterial).map?.dispose();
            mat.dispose();
          });
        }
      });
      renderer.dispose();
    },
  };
};
