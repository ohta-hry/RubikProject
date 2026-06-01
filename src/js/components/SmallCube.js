import * as THREE from 'three';
import { CUBE_COLORS, BASE_CUBE_COLOR, CUBE_SPACING, 
    PANEL_SIZE, PANEL_POSITIONS, PANEL_ROTATIONS, PANEL_EMISSIVE_INTENSITY } from '../utils/Constants.js';

const GRID_CENTER = 1;
const GRID_MIN = 0;
const GRID_MAX = 2;
const BASE_CUBE_SIZE = 1;
const FACE_COUNT = 6;
const FACE_INDEX = {
    RIGHT: 0,
    LEFT: 1,
    TOP: 2,
    BOTTOM: 3,
    FRONT: 4,
    BACK: 5
};


export class SmallCube {
    #group;
    #gridPosition;
    #pieceType;
    #pieceIndex = -1;
    
    constructor(x, y, z, type) {
        this.#group = new THREE.Group();
        this.#gridPosition = { x, y, z };
        
        this.#group.position.set(
            (x - GRID_CENTER) * CUBE_SPACING,
            (y - GRID_CENTER) * CUBE_SPACING,
            (z - GRID_CENTER) * CUBE_SPACING
        );
        
        this.#pieceType = type;

        this.#createVisuals();
    }
    
    #createVisuals() {
        const geometry = new THREE.BoxGeometry(BASE_CUBE_SIZE, BASE_CUBE_SIZE, BASE_CUBE_SIZE);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: BASE_CUBE_COLOR });
        const baseCube = new THREE.Mesh(geometry, baseMaterial);
        baseCube.castShadow = true;
        baseCube.receiveShadow = true;
        this.#group.add(baseCube);
        
        for (let faceIndex = 0; faceIndex < FACE_COUNT; faceIndex++) {
            const color = this.#getFaceColor(faceIndex);
            if (color !== null) {
                const panel = this._createColorPanel(
                    color,
                    PANEL_POSITIONS[faceIndex],
                    PANEL_ROTATIONS[faceIndex]
                );
                this.#group.add(panel);
            }
        }
    }
    
    #getFaceColor(faceIndex) {
        const { x, y, z } = this.#gridPosition;
        
        const isRightFace = (x === GRID_MAX && faceIndex === FACE_INDEX.RIGHT);
        const isLeftFace = (x === GRID_MIN && faceIndex === FACE_INDEX.LEFT);
        const isTopFace = (y === GRID_MAX && faceIndex === FACE_INDEX.TOP);
        const isBottomFace = (y === GRID_MIN && faceIndex === FACE_INDEX.BOTTOM);
        const isFrontFace = (z === GRID_MAX && faceIndex === FACE_INDEX.FRONT);
        const isBackFace = (z === GRID_MIN && faceIndex === FACE_INDEX.BACK);
        
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
