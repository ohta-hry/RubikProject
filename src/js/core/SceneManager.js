import * as THREE from 'three';

const SCENE_BACKGROUND_COLOR = 0xf0f0f0;
const LIGHT_COLOR = 0xffffff;
const AMBIENT_LIGHT_INTENSITY = 3;
const DIRECTIONAL_LIGHT_INTENSITY = 0.5;
const DIRECTIONAL_LIGHT_POSITION = { x: 5, y: 8, z: 5 };
const SHADOW_MAP_SIZE = 1024;
const SHADOW_CAMERA_NEAR = 0.5;
const SHADOW_CAMERA_FAR = 1000;
const SHADOW_BIAS = -0.0001;

export class SceneManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(SCENE_BACKGROUND_COLOR);
    }
    
    setupLights() {
        const ambientLight = new THREE.AmbientLight(LIGHT_COLOR, AMBIENT_LIGHT_INTENSITY);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(LIGHT_COLOR, DIRECTIONAL_LIGHT_INTENSITY);
        directionalLight.position.set(
            DIRECTIONAL_LIGHT_POSITION.x,
            DIRECTIONAL_LIGHT_POSITION.y,
            DIRECTIONAL_LIGHT_POSITION.z
        );
        directionalLight.castShadow = true;

        directionalLight.shadow.mapSize.width = SHADOW_MAP_SIZE;
        directionalLight.shadow.mapSize.height = SHADOW_MAP_SIZE;
        directionalLight.shadow.camera.near = SHADOW_CAMERA_NEAR;
        directionalLight.shadow.camera.far = SHADOW_CAMERA_FAR;
        directionalLight.shadow.bias = SHADOW_BIAS;

        this.scene.add(directionalLight);
    }
    
    addObject(object) {
        this.scene.add(object);
    }

    removeObject(object) {
        this.scene.remove(object);
    }
}
