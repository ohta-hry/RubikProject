import * as THREE from 'three';

export const CUBE_COLORS = {
    front: 0xFFFFFF,   // 白（前面）
    back:  0xFFDD00,   // 明るい黄（後面）
    right: 0xFF9900,   // 明るいオレンジ（左面）
    left:  0xFF3333,   // 明るい赤（右面）
    top:   0x00DD00,   // 明るい緑（上面）
    bottom:0x0088FF,   // 明るい青（下面）
    inner: 0x333333    // 内側の面（濃いグレー）
};

export const BASE_CUBE_COLOR = 0x222222; // 黒い立方体のベース色

export const CUBE_SPACING = 1.0;
export const PANEL_SIZE = 0.85;          // パネルのサイズ(0.9~0.85)

export const PANEL_POSITIONS = [
    new THREE.Vector3(0.501, 0, 0),    // 右面パネル位置
    new THREE.Vector3(-0.501, 0, 0),   // 左面パネル位置
    new THREE.Vector3(0, 0.501, 0),    // 上面パネル位置
    new THREE.Vector3(0, -0.501, 0),   // 下面パネル位置
    new THREE.Vector3(0, 0, 0.501),    // 前面パネル位置
    new THREE.Vector3(0, 0, -0.501)    // 後面パネル位置
];

export const PANEL_ROTATIONS = [
    new THREE.Euler(0, Math.PI/2, 0),     // 右面パネル回転
    new THREE.Euler(0, -Math.PI/2, 0),    // 左面パネル回転
    new THREE.Euler(-Math.PI/2, 0, 0),    // 上面パネル回転
    new THREE.Euler(Math.PI/2, 0, 0),     // 下面パネル回転
    new THREE.Euler(0, 0, 0),             // 前面パネル回転
    new THREE.Euler(0, Math.PI, 0)        // 後面パネル回転
];

export const PANEL_EMISSIVE_INTENSITY = 0.1;

export const CUBE_TYPES = {
    CORNER: 'corner',
    EDGE: 'edge',
    CENTER: 'center',
    CORE: 'core'
};


// 90度単位のクォータニオン定数を定義
export const QUA_ANGLE = {
    // 単軸回転
    X90: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2),
    Xm90: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2),
    Y90: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2),
    Ym90: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2),
    Z90: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 2),
    Zm90: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2),
    
    // 単位クォータニオン（何も回転しない）
    identity: new THREE.Quaternion()
};
