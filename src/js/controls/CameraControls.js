import * as THREE from 'three';
import { OrbitControls } from 'OrbitControls';

export class CameraController {
    constructor(camera, rendererDomElement, options = {}) {
        this.camera = camera;
        this.domElement = rendererDomElement;
        
        this.settings = {
            enableDamping: true,
            dampingFactor: 0.05,
            rotateSpeed: 1.0,
            minDistance: 3,
            maxDistance: 15,
            initialPosition: new THREE.Vector3(5, 5, 5),
            target: new THREE.Vector3(0, 0, 0),
            ...options
        };
        
        this.controls = null;
        this.init();
    }
    
    init() {
        this.camera.position.copy(this.settings.initialPosition);
        this.camera.lookAt(this.settings.target);
        
        this.controls = new OrbitControls(this.camera, this.domElement);
        this.controls.enableDamping = this.settings.enableDamping;
        this.controls.dampingFactor = this.settings.dampingFactor;
        this.controls.rotateSpeed = this.settings.rotateSpeed;
        this.controls.minDistance = this.settings.minDistance;
        this.controls.maxDistance = this.settings.maxDistance;
        this.controls.target.copy(this.settings.target);
    }
    
    update() {
        if (this.controls) {
            this.controls.update();
        }
    }
}