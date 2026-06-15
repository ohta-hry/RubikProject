import * as THREE from 'three';
import { SceneManager } from './SceneManager.js';
import { CubeManager } from '../components/CubeManager.js';
import { ClassDataMediator } from '../components/ClassDataMediator.js';
import { CameraController } from '../controls/CameraControls.js';
import { SeekBarController } from '../controls/SeekBarController.js';
import { AppControls, PLAYBACK_MODES } from '../controls/AppControls.js';
import { RubikNotationAnalyzer } from '../utils/RubikNotationAnalyzer.js';
import { CAMERA_CONFIG } from '../utils/Constants.js';

const DEFAULT_PLAYBACK_SECONDS = 5;

export class App {
    
    constructor() {
        this.init();
    }
    
    init() {
        this.sceneManager = new SceneManager();
        this.cubeManager = new CubeManager();

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
        this.controls = new AppControls({
            onAnalyze: request => this.loadMoves(request),
            onModeChange: request => this.loadMoves(request),
            onPlayToggle: () => this.togglePlay(),
            onSeek: progress => this.onSeek(progress),
            onSeekDragStart: () => this.startSeekDrag(),
            onSeekDragEnd: () => this.endSeekDrag()
        });
        this.loadMoves(this.controls.getRequest());
        window.addEventListener('resize', () => this.handleResize());  
        this.animate();
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            CAMERA_CONFIG.PERSPECTIVE.FOV,
            window.innerWidth / window.innerHeight,
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
        this.renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);
    }

    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.renderer.setSize(width, height);
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
            this.onSeek(0);
            this.controls.setStatus(this.createStatusMessage(presetSequence.length, this.operationSequence.length, mode));
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

    createStatusMessage(presetCount, operationCount, mode) {
        const modeLabel = mode === PLAYBACK_MODES.SOLVE ? 'ソルブ' : 'スクランブル';
        const presetLabel = presetCount > 0 ? ` / プリセット${presetCount}手` : '';
        return `${modeLabel}: ${operationCount}手を読み込みました${presetLabel}`;
    }

    togglePlay() {
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
