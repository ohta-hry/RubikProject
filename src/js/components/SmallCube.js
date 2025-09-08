import * as THREE from 'three';
import { CUBE_COLORS, BASE_CUBE_COLOR, CUBE_SPACING, 
    PANEL_SIZE, PANEL_POSITIONS, PANEL_ROTATIONS, PANEL_EMISSIVE_INTENSITY } from '../utils/Constants.js';

// SmallCubeクラス
export class SmallCube {
    group;
    gridPosition;
    
    constructor(x, y, z) {
        this.group = new THREE.Group();
        this.gridPosition = { x, y, z };
        
        this.group.position.set(
            (x - 1) * CUBE_SPACING,
            (y - 1) * CUBE_SPACING,
            (z - 1) * CUBE_SPACING
        );
        
        this.#createVisuals();
    }
    
    #createVisuals() {
        // 黒い立方体のベース
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: BASE_CUBE_COLOR });
        const baseCube = new THREE.Mesh(geometry, baseMaterial);
        baseCube.castShadow = true;
        baseCube.receiveShadow = true;
        this.group.add(baseCube);
        
        
        for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
            const color = this.#getFaceColor(faceIndex);
            if (color !== null) {
                const panel = this._createColorPanel(
                    color,
                    PANEL_POSITIONS[faceIndex],
                    PANEL_ROTATIONS[faceIndex]
                );
                this.group.add(panel);
            }
        }
    }
    
    #getFaceColor(faceIndex) {
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
        const panelGeometry = new THREE.PlaneGeometry(PANEL_SIZE, PANEL_SIZE);
        const panelMaterial = new THREE.MeshLambertMaterial({
            color: color,
            emissive: new THREE.Color(color).multiplyScalar(PANEL_EMISSIVE_INTENSITY)
        });
        
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panel.castShadow = true;    // 影を投射
        panel.receiveShadow = true; // 影を受け取る
        panel.position.copy(position);
        panel.rotation.copy(rotation);
        
        return panel;
    }

    _setPosition(x, y, z, q) {
        this.gridPosition = { x, y, z };
        this.group.position.set(
            (x - 1) * CUBE_SPACING,
            (y - 1) * CUBE_SPACING,
            (z - 1) * CUBE_SPACING
        );
        this.group.quaternion.copy(q);

    }
}