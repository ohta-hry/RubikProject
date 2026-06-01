import * as THREE from 'three';

export const CAMERA_CONFIG = {
    PERSPECTIVE: {
        FOV: 60,
        NEAR: 0.1,
        FAR: 1000
    },
    CONTROLS: {
        ENABLE_DAMPING: true,
        DAMPING_FACTOR: 0.05,
        ROTATE_SPEED: 1.0,
        ZOOM_SPEED: 1.0,
        PAN_SPEED: 1.0,
        MIN_DISTANCE: 3,
        MAX_DISTANCE: 15,
        INITIAL_POSITION: { x: 5, y: 5, z: 5 },
        TARGET: { x: 0, y: 0, z: 0 }
    }
};

export const RUBIK_CUBE_CONFIG = {
    DIMENSION: 3,
    CENTER_INDEX: 1,
    SPACING: 1.0,
    LAYER_EPSILON: 0.001,
    AXIS_NAMES: ['x', 'y', 'z'],
    PIECE_TYPES: {
        CORNER: 'corner',
        EDGE: 'edge',
        CENTER: 'center',
        CORE: 'core'
    }
};

export const SMALL_CUBE_CONFIG = {
    GRID: {
        MIN: 0,
        CENTER: 1,
        MAX: 2
    },
    BASE: {
        SIZE: 1,
        COLOR: 0x222222
    },
    FACES: {
        COUNT: 6,
        INDEX: {
            RIGHT: 0,
            LEFT: 1,
            TOP: 2,
            BOTTOM: 3,
            FRONT: 4,
            BACK: 5
        },
        COLORS: {
            front: 0xFFFFFF,   // 白（前面）
            back:  0xFFDD00,   // 明るい黄（後面）
            right: 0xFF9900,   // 明るいオレンジ（左面）
            left:  0xFF3333,   // 明るい赤（右面）
            top:   0x00DD00,   // 明るい緑（上面）
            bottom:0x0088FF,   // 明るい青（下面）
            inner: 0x333333    // 内側の面（濃いグレー）
        }
    },
    PANEL: {
        SIZE: 0.85,
        EMISSIVE_INTENSITY: 0.1,
        POSITIONS: [
            new THREE.Vector3(0.501, 0, 0),    // 右面パネル位置
            new THREE.Vector3(-0.501, 0, 0),   // 左面パネル位置
            new THREE.Vector3(0, 0.501, 0),    // 上面パネル位置
            new THREE.Vector3(0, -0.501, 0),   // 下面パネル位置
            new THREE.Vector3(0, 0, 0.501),    // 前面パネル位置
            new THREE.Vector3(0, 0, -0.501)    // 後面パネル位置
        ],
        ROTATIONS: [
            new THREE.Euler(0, Math.PI/2, 0),     // 右面パネル回転
            new THREE.Euler(0, -Math.PI/2, 0),    // 左面パネル回転
            new THREE.Euler(-Math.PI/2, 0, 0),    // 上面パネル回転
            new THREE.Euler(Math.PI/2, 0, 0),     // 下面パネル回転
            new THREE.Euler(0, 0, 0),             // 前面パネル回転
            new THREE.Euler(0, Math.PI, 0)        // 後面パネル回転
        ]
    }
};

export const ROTATION_QUATERNIONS = {
    X90: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2),
    Xm90: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2),
    Y90: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2),
    Ym90: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2),
    Z90: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 2),
    Zm90: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2),
    IDENTITY: new THREE.Quaternion()
};
