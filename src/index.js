import './style.css';
import {
  AmbientLight,
  AxesHelper,
  DirectionalLight,
  GridHelper,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  Box3,
  Vector3,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Get the IFC container element
const ifcContainer = document.querySelector('.ifc-container');

// Object to store the size of the viewport
const size = {
  width: ifcContainer.clientWidth,
  height: ifcContainer.clientHeight,
};

// Creates the camera (point of view of the user)
const aspect = size.width / size.height;
const camera = new PerspectiveCamera(75, aspect);
camera.position.z = 15;
camera.position.y = 13;
camera.position.x = 8;

// Creates the Three.js scene
const scene = new Scene();

// Creates the lights of the scene
const lightColor = 0xffffff;

const ambientLight = new AmbientLight(lightColor, 0.5);
scene.add(ambientLight);

const directionalLight = new DirectionalLight(lightColor, 1);
directionalLight.position.set(0, 10, 0);
directionalLight.target.position.set(-5, 0, 0);
scene.add(directionalLight);
scene.add(directionalLight.target);

// Sets up the renderer, fetching the canvas of the HTML
const threeCanvas = document.getElementById("three-canvas");
const renderer = new WebGLRenderer({
  canvas: threeCanvas,
  alpha: true,
});

renderer.setSize(size.width, size.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Creates grids and axes in the scene
const grid = new GridHelper(50, 30);
scene.add(grid);

const axes = new AxesHelper();
axes.material.depthTest = false;
axes.renderOrder = 1;
scene.add(axes);

// Creates the orbit controls (to navigate the scene)
const controls = new OrbitControls(camera, threeCanvas);
controls.enableDamping = true;
controls.target.set(-2, 0, 0);

// Animation loop
const animate = () => {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};

animate();

// Adjust the viewport to the size of the browser
window.addEventListener("resize", () => {
  size.width = ifcContainer.clientWidth;
  size.height = ifcContainer.clientHeight;
  camera.aspect = size.width / size.height;
  camera.updateProjectionMatrix();
  renderer.setSize(size.width, size.height);
});

import { IFCLoader } from "web-ifc-three/IFCLoader";

// ... (continuing from the previous index.js content)

function fitCameraToObject(object, camera, controls, offset = 1.5) {
  const boundingBox = new Box3().setFromObject(object);
  const center = boundingBox.getCenter(new Vector3());
  const size = boundingBox.getSize(new Vector3());

  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  let cameraZ = Math.abs(maxDim / 4 * Math.tan(fov * 2));

  cameraZ *= offset;
  const minZ = boundingBox.min.z;
  const cameraToFarEdge = (minZ < 0) ? -minZ + cameraZ : cameraZ - minZ;

  camera.far = cameraToFarEdge * 3;
  camera.updateProjectionMatrix();

  const direction = controls.target.clone().sub(camera.position).normalize().multiplyScalar(cameraZ);

  controls.maxDistance = cameraToFarEdge * 2;
  controls.target.copy(center);

  camera.near = cameraZ / 10;
  camera.far = cameraZ * 10;
  camera.updateProjectionMatrix();

  camera.position.copy(controls.target).sub(direction);

  // Set the target of OrbitControls to the center of the IFC model
  controls.target.set(center.x, center.y, center.z);
  controls.update();
}


// Sets up the IFC loading
const ifcLoader = new IFCLoader();
ifcLoader.ifcManager.setWasmPath("../wasm/");
const input = document.getElementById("file-input");

input.addEventListener(
  "change",
  (changed) => {
    const files = changed.target.files;

    // Iterate through the selected files and load them
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ifcURL = URL.createObjectURL(file);
      ifcLoader.load(
        ifcURL,
        (ifcModel) => {
          scene.add(ifcModel);
          console.log(ifcModel);

          // Fit the camera to the loaded IFC model
          fitCameraToObject(ifcModel, camera, controls);
        }
      );
    }
  },
  false
);
