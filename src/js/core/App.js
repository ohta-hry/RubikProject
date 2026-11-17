import * as THREE from 'three';
import { SceneManager } from './SceneManager.js';
import { CubeManager } from '../components/CubeManager.js';
import { ClassDataMediator } from '../components/ClassDataMediator.js';
import { CameraController } from '../controls/CameraControls.js';
import { SeekBarController } from '../controls/SeekBarController.js';
import { TabController } from '../controls/TabController.js';
import { AppControls, PLAYBACK_MODES } from '../controls/AppControls.js';
import { RubikNotationAnalyzer } from '../utils/RubikNotationAnalyzer.js';
import { CAMERA_CONFIG } from '../utils/Constants.js';
import { fadeOutIn } from '../utils/Fade.js';

const REPLAY_FADE_MS = 500;   // 最後から再生するときのフェードアウト／フェードイン各時間

const DEFAULT_PLAYBACK_SECONDS = 5;

export class App {
    
    constructor() {
        this.init();
    }
    
    init() {
        this.sceneManager = new SceneManager();
        this.cubeManager = new CubeManager();

        this.container = document.getElementById('canvas-container');
        this.setupCamera();
        this.setupRenderer();
        this.sceneManager.setupLights();
        
        this.cameraController = new CameraController(this.camera, this.renderer.domElement);

        this.cubeManager.createCube();
        this.cubeManager.addAllCubesToScene(this.sceneManager.scene);

        this.operationSequence = [];
        this.sequenceStates = [ClassDataMediator.createIdentityState()];
        this.seekPos = 0;
        this.seekBar = new SeekBarController(DEFAULT_PLAYBACK_SECONDS);
        this.tabs = new TabController(document.getElementById('dock-tabs'));
        this.controls = new AppControls({
            onAnalyze: request => this.loadMoves(request),
            onModeChange: request => this.loadMoves(request),
            onPlayToggle: () => this.togglePlay(),
            onSeek: progress => this.onSeek(progress),
            onSeekDragStart: () => this.startSeekDrag(),
            onSeekDragEnd: () => this.endSeekDrag()
        });
        this.loadMoves(this.controls.getRequest());
        this.controls.markApplied();
        new ResizeObserver(() => this.handleResize()).observe(this.container);
        this.handleResize();
        this.animate();
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            CAMERA_CONFIG.PERSPECTIVE.FOV,
            1,
            CAMERA_CONFIG.PERSPECTIVE.NEAR,
            CAMERA_CONFIG.PERSPECTIVE.FAR
        );
        this.camera.position.set(
            CAMERA_CONFIG.CONTROLS.INITIAL_POSITION.x,
            CAMERA_CONFIG.CONTROLS.INITIAL_POSITION.y,
            CAMERA_CONFIG.CONTROLS.INITIAL_POSITION.z
        );
        this.camera.lookAt(
            CAMERA_CONFIG.CONTROLS.TARGET.x,
            CAMERA_CONFIG.CONTROLS.TARGET.y,
            CAMERA_CONFIG.CONTROLS.TARGET.z
        );
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);
    }

    handleResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        if (width === 0 || height === 0) {
            return;
        }

        // 表示サイズはCSS（親コンテナ比率）に任せる
        this.renderer.setSize(width, height, false);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }
    
    loadMoves({ presetText, movesText, mode }) {
        try {
            const presetSequence = RubikNotationAnalyzer.analyze(presetText);
            this.operationSequence = RubikNotationAnalyzer.analyze(movesText);
            const initialState = this.createInitialState(presetSequence, this.operationSequence, mode);
            this.sequenceStates = ClassDataMediator.computeSequence(this.operationSequence, initialState);
            const totalDuration = Math.max(this.operationSequence.length, 1);
            this.seekBar = new SeekBarController(totalDuration);
            this.onSeek(1);            // 読み込み後は再生位置を最後に置く
            this.controls.setStatus('');
            this.updatePlayButton();
        } catch (error) {
            this.controls.setStatus(error.message);
        }
    }

    createInitialState(presetSequence, operationSequence, mode) {
        const presetState = ClassDataMediator.getFinalState(presetSequence);

        if (mode === PLAYBACK_MODES.SOLVE) {
            const operationState = ClassDataMediator.getFinalState(operationSequence);
            return presetState.compose(operationState.inverse());
        }

        return presetState;
    }

    togglePlay() {
        if (this.isFading) {
            return;
        }

        // 最後まで再生済みの状態で再生 → フェードアウト／フェードインしながら最初へ戻ってから再生
        if (!this.seekBar.isPlaying && this.seekPos >= 1) {
            this.playFromStartWithFade();
            return;
        }

        this.seekBar.togglePlay();
        this.updatePlayButton();
    }

    async playFromStartWithFade() {
        this.isFading = true;
        try {
            await fadeOutIn(this.container, REPLAY_FADE_MS, () => this.onSeek(0));
        } finally {
            this.isFading = false;
        }
        this.seekBar.togglePlay();
        this.updatePlayButton();
    }

    startSeekDrag() {
        this.seekBar.setDragging(true);
        this.updatePlayButton();
    }

    endSeekDrag() {
        this.seekBar.setDragging(false);
    }

    onSeek(position) {
        this.seekPos = Math.min(Math.max(position, 0), 1);
        this.seekBar.progress = this.seekPos;

        const context = ClassDataMediator.getSegment(this.seekPos, this.operationSequence, this.sequenceStates);
        this.cubeManager.rotateFromState(context.from, context.rotationConfig, context.progress);
        this.updateSeekUi();
    }

    updateSeekUi() {
        this.controls.updateSeek(this.seekPos);
    }

    updatePlayButton() {
        this.controls.updatePlayButton(this.seekBar.isPlaying);
    }
    
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
