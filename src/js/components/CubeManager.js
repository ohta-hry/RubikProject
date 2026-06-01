import * as THREE from 'three';

import { SmallCube } from './SmallCube.js';
import { getCubeType } from '../utils/Helpers.js';
import { RubikOperation } from '../utils/RubikOperation.js';

const CUBE_DIMENSION = 3;
const CUBE_CENTER_INDEX = 1;
const LAYER_EPSILON = 0.001;
const VALID_AXIS_NAMES = ['x', 'y', 'z'];
const PIECE_TYPES = {
    CORNER: 'corner',
    EDGE: 'edge',
    CENTER: 'center'
};

export class CubeManager {
    /** @type {RubikOperation} */
    #currentOperation;
    
    constructor() {
        this.cubes = [];
        this.categorizedCubes = {
            corners: [],
            edges: [],
            centers: []
        };
    }
    
    createCube() {
        for (let x = 0; x < CUBE_DIMENSION; x++) {
            for (let y = 0; y < CUBE_DIMENSION; y++) {
                for (let z = 0; z < CUBE_DIMENSION; z++) {
                    if (x === CUBE_CENTER_INDEX && y === CUBE_CENTER_INDEX && z === CUBE_CENTER_INDEX) {
                        continue;
                    }

                    const type = getCubeType(x, y, z);
                    const cube = new SmallCube(x, y, z, type);

                    switch (type) {
                        case PIECE_TYPES.CORNER:
                            cube.index = this.categorizedCubes.corners.length;
                            this.categorizedCubes.corners.push(cube);
                            break;
                        case PIECE_TYPES.EDGE:
                            cube.index = this.categorizedCubes.edges.length;
                            this.categorizedCubes.edges.push(cube);
                            break;
                        case PIECE_TYPES.CENTER:
                            cube.index = this.categorizedCubes.centers.length;
                            this.categorizedCubes.centers.push(cube);
                            break;
                    }

                    this.cubes.push(cube);
                }
            }
        }
    }
    
    addAllCubesToScene(scene) {
        this.cubes.forEach(cube => {
            scene.add(cube.group);
        });
    }
    
    /** @type {RubikOperation} */
    applyRubikOperation(ro) {
        if (!(ro instanceof RubikOperation)) {
            throw new TypeError("Invalid operation");
        }
        
        this.#currentOperation = ro;

        this.#setCubesFromRubikOperation(this.#currentOperation);
    }

    /**
     * 区間開始状態を基準に、指定操作の途中状態を表示します。
     * @param {RubikOperation} from - 区間開始時点の状態
     * @param {RotationConfig|null} rotationConfig - 補間回転の設定
     * @param {number} progress - 0.0から1.0までの進捗
     */
    rotateFromState(from, rotationConfig, progress) {
        if (!(from instanceof RubikOperation)) {
            throw new TypeError("Invalid from operation");
        }

        if (!Number.isFinite(progress)) {
            throw new TypeError("progress must be a finite number");
        }

        this.#currentOperation = from;
        this.#setCubesFromRubikOperation(from);

        if (rotationConfig === null) {
            return;
        }

        this.#validateRotationConfig(rotationConfig);
        const clampedProgress = Math.min(Math.max(progress, 0), 1);
        const angle = rotationConfig.totalAngle * clampedProgress;

        if (angle === 0) {
            return;
        }

        const axisVector = this.#createAxisVector(rotationConfig.axisName);
        const rotationQuaternion = new THREE.Quaternion().setFromAxisAngle(axisVector, angle);

        this.cubes.forEach(cube => {
            if (!this.#isCubeInLayers(cube, rotationConfig.axisName, rotationConfig.layers)) {
                return;
            }

            cube.group.position.applyAxisAngle(axisVector, angle);
            cube.group.quaternion.premultiply(rotationQuaternion);
        });
    }

    #setCubesFromRubikOperation(ro) {
        this.categorizedCubes.corners.forEach((cube, i) => {
            cube._setPosition(ro.pos_corner[i], ro.qua_corner[i]);
        });

        this.categorizedCubes.edges.forEach((cube, i) => {
            cube._setPosition(ro.pos_edge[i], ro.qua_edge[i]);
        });

        this.categorizedCubes.centers.forEach((cube, i) => {
            cube._setPosition(ro.pos_center[i], ro.qua_center[i]);
        });
    }

    #validateRotationConfig(rotationConfig) {
        if (!rotationConfig || typeof rotationConfig !== 'object') {
            throw new TypeError("rotationConfig must be an object");
        }

        if (!VALID_AXIS_NAMES.includes(rotationConfig.axisName)) {
            throw new Error("rotationConfig.axisName must be x, y, or z");
        }

        if (!Array.isArray(rotationConfig.layers)) {
            throw new Error("rotationConfig.layers must be an array");
        }

        if (!Number.isFinite(rotationConfig.totalAngle)) {
            throw new Error("rotationConfig.totalAngle must be a finite number");
        }
    }

    #createAxisVector(axisName) {
        return new THREE.Vector3(
            axisName === 'x' ? 1 : 0,
            axisName === 'y' ? 1 : 0,
            axisName === 'z' ? 1 : 0
        );
    }

    #isCubeInLayers(cube, axisName, layers) {
        return layers.some(layer => Math.abs(cube.group.position[axisName] - layer) < LAYER_EPSILON);
    }

    getCubesByCondition(conditionFn) {
        return this.cubes.filter(conditionFn);
    }
}



