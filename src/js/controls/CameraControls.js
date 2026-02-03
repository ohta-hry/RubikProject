import * as THREE from 'three';
import { OrbitControls } from 'OrbitControls';
import { CAMERA_CONFIG } from '../utils/Constants.js';

export class CameraController {
    constructor(camera, rendererDomElement, options = {}) {
        this.camera = camera;
        this.domElement = rendererDomElement;
        
        // デフォルト設定とオプションをマージ
        this.settings = {
            ...CAMERA_CONFIG.DEFAULT,
            ...options
        };
        
        this.controls = null;
        this.init();
    }
    
    init() {
        // Vector3に変換
        const initialPosition = new THREE.Vector3(
            this.settings.INITIAL_POSITION.x,
            this.settings.INITIAL_POSITION.y,
            this.settings.INITIAL_POSITION.z
        );
        
        const target = new THREE.Vector3(
            this.settings.TARGET.x,
            this.settings.TARGET.y,
            this.settings.TARGET.z
        );
        
        this.camera.position.copy(initialPosition);
        this.camera.lookAt(target);
        
        this.controls = new OrbitControls(this.camera, this.domElement);
        
        // 設定を適用
        this.controls.enableDamping = this.settings.ENABLE_DAMPING;
        this.controls.dampingFactor = this.settings.DAMPING_FACTOR;
        this.controls.rotateSpeed = this.settings.ROTATE_SPEED;
        this.controls.zoomSpeed = this.settings.ZOOM_SPEED;
        this.controls.panSpeed = this.settings.PAN_SPEED;
        this.controls.minDistance = this.settings.MIN_DISTANCE;
        this.controls.maxDistance = this.settings.MAX_DISTANCE;
        this.controls.target.copy(target);
    }
    
    update() {
        if (this.controls) {
            this.controls.update();
        }
    }
}