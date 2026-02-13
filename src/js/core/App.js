import * as THREE from 'three';
import { SceneManager } from './SceneManager.js';
import { CubeManager } from '../components/CubeManager.js';
import { CameraController } from '../controls/CameraControls.js';
import { RubikOperation } from '../utils/RubikOperation.js';

export class App {
    
    constructor() {
        this.init();
    }
    
    init() {
        this.sceneManager = new SceneManager();
        this.cubeManager = new CubeManager();
        
        // カメラ、レンダラーの設定
        this.setupCamera();
        this.setupRenderer();
        
        // ライト設定
        this.sceneManager.setupLights();
        
        this.cameraController = new CameraController(this.camera, this.renderer.domElement);
        
        // キューブ作成
        this.cubeManager.createCube();
        this.cubeManager.addAllCubesToScene(this.sceneManager.scene);

        //以下仮の文
        this.RO = RubikOperation.F().compose(RubikOperation.S());
        this.cubeManager.applyRubikOperation(this.RO);

        // アニメーション開始
        this.animate();
    }
    
    // App.js内のメソッド
    setupCamera() {
        // カメラ設定（元のinit関数内のカメラ部分）
        this.camera = new THREE.PerspectiveCamera(
            60,                          // 視野角（FOV）
            window.innerWidth / window.innerHeight, // アスペクト比（画面比率に合わせる）
            0.1,                         // 近クリップ面（これより近いものは描画しない）
            1000                         // 遠クリップ面（これより遠いものは描画しない）
        );
        this.camera.position.set(3, 3, 5); // カメラ位置を(3, 3, 5)に設定
        this.camera.lookAt(0, 0, 0);       // 原点(0,0,0)を見る
    }

    setupRenderer() {
        // レンダラー設定（元のinit関数内のレンダラー部分）
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true               // アンチエイリアス有効（ジャギー防止）
        });
        this.renderer.setSize(
            window.innerWidth,            // 幅（画面全体）
            window.innerHeight            // 高さ（画面全体）
        );
        this.renderer.shadowMap.enabled = true; // 影を有効化
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // ソフトシャドウ
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);
    }
    
    // アニメーションループ
    animate = () => {
        requestAnimationFrame(this.animate);
        
        this.cameraController.update();
        this.renderer.render(this.sceneManager.scene, this.camera);
    }
    
}