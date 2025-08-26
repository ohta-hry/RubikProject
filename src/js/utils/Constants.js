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
