import * as THREE from 'three';
import { SceneManager } from './SceneManager.js';
import { CubeManager } from '../components/CubeManager.js';
import { ClassDataMediator } from '../components/ClassDataMediator.js';
import { CameraController } from '../controls/CameraControls.js';
import { SeekBarController } from '../controls/SeekBarController.js';
import { RubikNotationAnalyzer } from '../utils/RubikNotationAnalyzer.js';

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

        this.operationSequence = [];
        this.seekPos = 0;
        this.seekBar = new SeekBarController(5);
        this.setupControls();
        this.loadMoves(this.movesInput.value);

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

    setupControls() {
        this.movesInput = document.getElementById('moves-input');
        this.analyzeButton = document.getElementById('analyze-button');
        this.playButton = document.getElementById('play-button');
        this.seekBarInput = document.getElementById('seek-bar');
        this.seekLabel = document.getElementById('seek-label');
        this.statusMessage = document.getElementById('status-message');

        this.analyzeButton.addEventListener('click', () => {
            this.loadMoves(this.movesInput.value);
        });

        this.movesInput.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                this.loadMoves(this.movesInput.value);
            }
        });

        this.playButton.addEventListener('click', () => {
            this.seekBar.togglePlay();
            this.updatePlayButton();
        });

        this.seekBarInput.addEventListener('input', event => {
            this.seekBar.progress = Number(event.target.value) / Number(event.target.max);
            this.onSeek(this.seekBar.progress);
        });

        this.seekBarInput.addEventListener('pointerdown', () => {
            this.seekBar.setDragging(true);
            this.updatePlayButton();
        });

        window.addEventListener('pointerup', () => {
            this.seekBar.setDragging(false);
        });
    }

    loadMoves(text) {
        try {
            this.operationSequence = RubikNotationAnalyzer.analyze(text);
            const totalDuration = Math.max(this.operationSequence.length, 1);
            this.seekBar = new SeekBarController(totalDuration);
            this.onSeek(0);
            this.setStatus(`${this.operationSequence.length}手を読み込みました`);
            this.updatePlayButton();
        } catch (error) {
            this.setStatus(error.message);
        }
    }

    onSeek(position) {
        this.seekPos = Math.min(Math.max(position, 0), 1);
        this.seekBar.progress = this.seekPos;

        const context = ClassDataMediator.getSegment(this.seekPos, this.operationSequence);
        this.cubeManager.rotateFromState(context.from, context.operation, context.progress);
        this.updateSeekUi();
    }

    updateSeekUi() {
        const max = Number(this.seekBarInput.max);
        this.seekBarInput.value = Math.round(this.seekPos * max);
        this.seekLabel.textContent = `${Math.round(this.seekPos * 100)}%`;
    }

    updatePlayButton() {
        this.playButton.textContent = this.seekBar.isPlaying ? '停止' : '再生';
    }

    setStatus(message) {
        this.statusMessage.textContent = message;
    }
    
    // アニメーションループ
    animate = () => {
        requestAnimationFrame(this.animate);
        
        this.cameraController.update();

        const nextSeekPos = this.seekBar.update();
        if (nextSeekPos !== this.seekPos) {
            this.onSeek(nextSeekPos);
        }

        this.updatePlayButton();
        this.renderer.render(this.sceneManager.scene, this.camera);
    }
    
}
