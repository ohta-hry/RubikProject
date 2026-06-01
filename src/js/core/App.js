import * as THREE from 'three';
import { SceneManager } from './SceneManager.js';
import { CubeManager } from '../components/CubeManager.js';
import { ClassDataMediator } from '../components/ClassDataMediator.js';
import { CameraController } from '../controls/CameraControls.js';
import { SeekBarController } from '../controls/SeekBarController.js';
import { RubikNotationAnalyzer } from '../utils/RubikNotationAnalyzer.js';

const DEFAULT_PLAYBACK_SECONDS = 5;
const CAMERA_FOV = 60;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 1000;
const CAMERA_INITIAL_POSITION = { x: 3, y: 3, z: 5 };
const SCENE_ORIGIN = { x: 0, y: 0, z: 0 };
const SEEK_PERCENT_SCALE = 100;

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
        this.seekPos = 0;
        this.seekBar = new SeekBarController(DEFAULT_PLAYBACK_SECONDS);
        this.setupControls();
        this.loadMoves(this.movesInput.value);

        this.animate();
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            CAMERA_FOV,
            window.innerWidth / window.innerHeight,
            CAMERA_NEAR,
            CAMERA_FAR
        );
        this.camera.position.set(CAMERA_INITIAL_POSITION.x, CAMERA_INITIAL_POSITION.y, CAMERA_INITIAL_POSITION.z);
        this.camera.lookAt(SCENE_ORIGIN.x, SCENE_ORIGIN.y, SCENE_ORIGIN.z);
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
        this.cubeManager.rotateFromState(context.from, context.rotationConfig, context.progress);
        this.updateSeekUi();
    }

    updateSeekUi() {
        const max = Number(this.seekBarInput.max);
        this.seekBarInput.value = Math.round(this.seekPos * max);
        this.seekLabel.textContent = `${Math.round(this.seekPos * SEEK_PERCENT_SCALE)}%`;
    }

    updatePlayButton() {
        this.playButton.textContent = this.seekBar.isPlaying ? '停止' : '再生';
    }

    setStatus(message) {
        this.statusMessage.textContent = message;
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
