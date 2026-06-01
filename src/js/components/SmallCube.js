import * as THREE from 'three';
import { RUBIK_CUBE_CONFIG, SMALL_CUBE_CONFIG } from '../utils/Constants.js';

const { GRID, BASE, FACES, PANEL } = SMALL_CUBE_CONFIG;


export class SmallCube {
    #group;
    #gridPosition;
    #pieceType;
    #pieceIndex = -1;
    
    constructor(x, y, z, type) {
        this.#group = new THREE.Group();
        this.#gridPosition = { x, y, z };
        
        this.#group.position.set(
            (x - GRID.CENTER) * RUBIK_CUBE_CONFIG.SPACING,
            (y - GRID.CENTER) * RUBIK_CUBE_CONFIG.SPACING,
            (z - GRID.CENTER) * RUBIK_CUBE_CONFIG.SPACING
        );
        
        this.#pieceType = type;

        this.#createVisuals();
    }
    
    #createVisuals() {
        const geometry = new THREE.BoxGeometry(BASE.SIZE, BASE.SIZE, BASE.SIZE);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: BASE.COLOR });
        const baseCube = new THREE.Mesh(geometry, baseMaterial);
        baseCube.castShadow = true;
        baseCube.receiveShadow = true;
        this.#group.add(baseCube);
        
        for (let faceIndex = 0; faceIndex < FACES.COUNT; faceIndex++) {
            const color = this.#getFaceColor(faceIndex);
            if (color !== null) {
                const panel = this._createColorPanel(
                    color,
                    PANEL.POSITIONS[faceIndex],
                    PANEL.ROTATIONS[faceIndex]
                );
                this.#group.add(panel);
            }
        }
    }
    
    #getFaceColor(faceIndex) {
        const { x, y, z } = this.#gridPosition;
        
        const isRightFace = (x === GRID.MAX && faceIndex === FACES.INDEX.RIGHT);
        const isLeftFace = (x === GRID.MIN && faceIndex === FACES.INDEX.LEFT);
        const isTopFace = (y === GRID.MAX && faceIndex === FACES.INDEX.TOP);
        const isBottomFace = (y === GRID.MIN && faceIndex === FACES.INDEX.BOTTOM);
        const isFrontFace = (z === GRID.MAX && faceIndex === FACES.INDEX.FRONT);
        const isBackFace = (z === GRID.MIN && faceIndex === FACES.INDEX.BACK);
        
        if (isRightFace) return FACES.COLORS.right;
        if (isLeftFace) return FACES.COLORS.left;
        if (isTopFace) return FACES.COLORS.top;
        if (isBottomFace) return FACES.COLORS.bottom;
        if (isFrontFace) return FACES.COLORS.front;
        if (isBackFace) return FACES.COLORS.back;
        
        return null;
    }
    
    _createColorPanel(color, position, rotation) {
        const panelGeometry = new THREE.PlaneGeometry(PANEL.SIZE, PANEL.SIZE);
        const panelMaterial = new THREE.MeshLambertMaterial({
            color: color,
            emissive: new THREE.Color(color).multiplyScalar(PANEL.EMISSIVE_INTENSITY)
        });
        
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panel.castShadow = true;
        panel.receiveShadow = true;
        panel.position.copy(position);
        panel.rotation.copy(rotation);
        
        return panel;
    }



    _addToParent(parentGroup) {
        parentGroup.add(this.#group);
        return this;
    }


    get group() {return this.#group;}

    get type()  {return this.#pieceType;}   
    
    set index(index) {
        if (this.#pieceIndex == -1) {this.#pieceIndex = index;}
    }
    get index() {return this.#pieceIndex;}



    static EDGE_POSITIONS = [
        { x: -1, y: -1, z: 0 },
        { x: -1, y: 0, z: -1 },
        { x: -1, y: 0, z: 1 },
        { x: -1, y: 1, z: 0 },
        { x: 0, y: -1, z: -1 },
        { x: 0, y: -1, z: 1 },
        { x: 0, y: 1, z: -1 },
        { x: 0, y: 1, z: 1 },
        { x: 1, y: -1, z: 0 },
        { x: 1, y: 0, z: -1 },
        { x: 1, y: 0, z: 1 },
        { x: 1, y: 1, z: 0 },
    ];
    static CENTER_AXES = ['x', 'y', 'z', 'z', 'y', 'x'];
    static CENTER_SIGNS = [-1, -1, -1, 1, 1, 1];

    _setPosition(index, quaternion){
        
        switch (this.#pieceType) {
            case 'corner': 
                this.#group.position.set(
                    (index & 4) ? 1 : -1,
                    (index & 2) ? 1 : -1,
                    (index & 1) ? 1 : -1
                );
                break;

            case 'edge': 
                this.#group.position.set(this.constructor.EDGE_POSITIONS[index].x, this.constructor.EDGE_POSITIONS[index].y, this.constructor.EDGE_POSITIONS[index].z);
                break;

            case 'center':  
                const axis = this.constructor.CENTER_AXES[index];
                const sign = this.constructor.CENTER_SIGNS[index];
                this.#group.position.set(0,0,0);
                this.#group.position[axis] = sign;   
                break;
        }

        this.#group.quaternion.copy(quaternion);
    }
}
