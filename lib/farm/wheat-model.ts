import { Box3, type Object3D, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export interface WheatModel {
  object: Object3D;
  minY: number;
  height: number;
}

export const WHEAT_MODEL_PATHS = ["https://bear-public.tos-cn-shanghai.volces.com/wheet.glb"] as const;

let wheatModelPromise: Promise<WheatModel | null> | null = null;

async function loadFirstAvailableWheatModel() {
  const loader = new GLTFLoader();

  for (const path of WHEAT_MODEL_PATHS) {
    try {
      const gltf = await loader.loadAsync(path);
      const scene = gltf.scene ?? gltf.scenes?.[0];

      if (!scene) {
        continue;
      }

      scene.updateWorldMatrix(true, true);
      const bounds = new Box3().setFromObject(scene);
      const size = new Vector3();
      bounds.getSize(size);

      return {
        object: scene,
        minY: bounds.min.y,
        height: Math.max(size.y, 0.001),
      } satisfies WheatModel;
    } catch {
      continue;
    }
  }

  return null;
}

export function loadWheatModel() {
  if (!wheatModelPromise) {
    wheatModelPromise = loadFirstAvailableWheatModel();
  }

  return wheatModelPromise;
}

export function preloadWheatModel() {
  void loadWheatModel();
}
