import { CUBE_COLORS } from '../utils/Constants.js';

// SmallCubeクラス
export class SmallCube {
    constructor(x, y, z) {
        this.group = new THREE.Group();
        this.gridPosition = { x, y, z };
        
        const spacing = 1.0;
        this.group.position.set(
            (x - 1) * spacing,
            (y - 1) * spacing,
            (z - 1) * spacing
        );
        
        this._createVisuals();
    }
    
    _createVisuals() {
        // 黒い立方体のベース
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
        const baseCube = new THREE.Mesh(geometry, baseMaterial);
        baseCube.castShadow = true;
        baseCube.receiveShadow = true;
        this.group.add(baseCube);
        
        // 各面に色付きパネルを追加
        const facePositions = [
            new THREE.Vector3(0.501, 0, 0),    // 右面
            new THREE.Vector3(-0.501, 0, 0),   // 左面
            new THREE.Vector3(0, 0.501, 0),    // 上面
            new THREE.Vector3(0, -0.501, 0),   // 下面
            new THREE.Vector3(0, 0, 0.501),    // 前面
            new THREE.Vector3(0, 0, -0.501)    // 後面
        ];
        
        const faceRotations = [
            new THREE.Euler(0, Math.PI/2, 0),     // 右面
            new THREE.Euler(0, -Math.PI/2, 0),    // 左面
            new THREE.Euler(-Math.PI/2, 0, 0),    // 上面
            new THREE.Euler(Math.PI/2, 0, 0),     // 下面
            new THREE.Euler(0, 0, 0),             // 前面
            new THREE.Euler(0, Math.PI, 0)        // 後面
        ];
        
        for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
            const color = this._getFaceColor(faceIndex);
            if (color !== null) {
                const panel = this._createColorPanel(
                    color,
                    facePositions[faceIndex],
                    faceRotations[faceIndex]
                );
                this.group.add(panel);
            }
        }
    }
    
    _getFaceColor(faceIndex) {
        const { x, y, z } = this.gridPosition;
        
        const isRightFace = (x === 2 && faceIndex === 0);
        const isLeftFace = (x === 0 && faceIndex === 1);
        const isTopFace = (y === 2 && faceIndex === 2);
        const isBottomFace = (y === 0 && faceIndex === 3);
        const isFrontFace = (z === 2 && faceIndex === 4);
        const isBackFace = (z === 0 && faceIndex === 5);
        
        if (isRightFace) return CUBE_COLORS.right;
        if (isLeftFace) return CUBE_COLORS.left;
        if (isTopFace) return CUBE_COLORS.top;
        if (isBottomFace) return CUBE_COLORS.bottom;
        if (isFrontFace) return CUBE_COLORS.front;
        if (isBackFace) return CUBE_COLORS.back;
        
        return null;
    }
    
    _createColorPanel(color, position, rotation) {
        const panelGeometry = new THREE.PlaneGeometry(0.85, 0.85);
        const panelMaterial = new THREE.MeshLambertMaterial({
            color: color,
            emissive: new THREE.Color(color).multiplyScalar(0.1)
        });
        
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panel.position.copy(position);
        panel.rotation.copy(rotation);
        
        return panel;
    }
}