import * as THREE from 'three';

import { SmallCube } from './SmallCube.js';
import { getCubeType } from '../utils/Helpers.js';
import { RubikOperation } from '../utils/RubikOperation.js';

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
            
            // 3x3x3のループでキューブを生成・分類
            for (let x = 0; x < 3; x++) {
                for (let y = 0; y < 3; y++) {
                    for (let z = 0; z < 3; z++) {
                        // 中心にあって見えないコアキューブはスキップ
                        if (x === 1 && y === 1 && z === 1) {
                            continue;
                        }
                        
                        // 現在の配列の長さ＝添字
                        const type = getCubeType(x, y, z);
                        const cube = new SmallCube(x, y, z, type);
                        
                        // 判定された種類に応じて、適切な配列に格納
                        switch (type) {
                            case 'corner': 
                                cube.index = this.categorizedCubes.corners.length;
                                this.categorizedCubes.corners.push(cube);
                                break;
                            case 'edge'  : 
                                cube.index = this.categorizedCubes.edges.length;
                                this.categorizedCubes.edges.push(cube); 
                                break;
                            case 'center': 
                                cube.index = this.categorizedCubes.centers.length;
                                this.categorizedCubes.centers.push(cube); 
                                break;
                        }
                        
                        this.cubes.push(cube); 
                    }
                }
            }
            
            // デバッグ情報をコンソールに出力
            //console.log("コーナーキューブの数:", this.categorizedCubes.corners); // 8
            //console.log("エッジキューブの数:", this.categorizedCubes.edges);     // 12
            //console.log("センターキューブの数:", this.categorizedCubes.centers);   // 6
        }
    
    // メソッド: 全キューブをシーンに追加
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

        console.log(this.#currentOperation);
        console.log(`[${this.#currentOperation.pos_corner.join(', ')}]`);
        console.log(`[${this.#currentOperation.pos_edge.join(', ')}]`);
        console.log(`[${this.#currentOperation.pos_center.join(', ')}]`);
        console.log(this.#currentOperation.qua_corner);
        console.log(this.#currentOperation.qua_edge);
        console.log(this.#currentOperation.qua_center);
        console.log("===============================================");
        console.log(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2));

        this.#setCubesFromRubikOperation(this.#currentOperation);
    }

    /**
     * 区間開始状態を基準に、指定操作の途中状態を表示します。
     * @param {RubikOperation} from - 区間開始時点の状態
     * @param {Operation|null} operation - 補間する操作
     * @param {number} progress - 0.0から1.0までの進捗
     */
    rotateFromState(from, operation, progress) {
        if (!(from instanceof RubikOperation)) {
            throw new TypeError("Invalid from operation");
        }

        if (!Number.isFinite(progress)) {
            throw new TypeError("progress must be a finite number");
        }

        this.#currentOperation = from;
        this.#setCubesFromRubikOperation(from);

        if (operation === null) {
            return;
        }

        const rotationConfig = this.#getRotationConfig(operation);
        const clampedProgress = Math.min(Math.max(progress, 0), 1);
        const amount = operation.amount ?? 1;

        if (!Number.isInteger(amount) || amount < 0) {
            throw new Error("operation.amount must be a non-negative integer");
        }

        const angle = rotationConfig.anglePerTurn * amount * clampedProgress;

        if (angle === 0) {
            return;
        }

        const rotationQuaternion = new THREE.Quaternion().setFromAxisAngle(rotationConfig.axisVector, angle);

        this.cubes.forEach(cube => {
            if (!this.#isCubeInLayer(cube, rotationConfig.axisName, rotationConfig.layer)) {
                return;
            }

            cube.group.position.applyAxisAngle(rotationConfig.axisVector, angle);
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

    #getRotationConfig(operation) {
        if (!operation || typeof operation.base !== 'string') {
            throw new TypeError("operation.base is required");
        }

        if (operation.wide) {
            throw new Error("wide moves are not supported yet");
        }

        const angleDirection = operation.prime ? -1 : 1;

        switch (operation.base) {
            case 'R':
                return this.#createRotationConfig('x', 1, -angleDirection);
            case 'L':
                return this.#createRotationConfig('x', -1, angleDirection);
            case 'M':
                return this.#createRotationConfig('x', 0, angleDirection);
            case 'U':
                return this.#createRotationConfig('y', 1, -angleDirection);
            case 'D':
                return this.#createRotationConfig('y', -1, angleDirection);
            case 'E':
                return this.#createRotationConfig('y', 0, angleDirection);
            case 'F':
                return this.#createRotationConfig('z', 1, -angleDirection);
            case 'B':
                return this.#createRotationConfig('z', -1, angleDirection);
            case 'S':
                return this.#createRotationConfig('z', 0, -angleDirection);
            default:
                throw new Error(`Unsupported operation base: ${operation.base}`);
        }
    }

    #createRotationConfig(axisName, layer, direction) {
        return {
            axisName,
            layer,
            axisVector: new THREE.Vector3(
                axisName === 'x' ? 1 : 0,
                axisName === 'y' ? 1 : 0,
                axisName === 'z' ? 1 : 0
            ),
            anglePerTurn: direction * Math.PI / 2
        };
    }

    #isCubeInLayer(cube, axisName, layer) {
        return Math.abs(cube.group.position[axisName] - layer) < 0.001;
    }










    // メソッド: 特定の条件のキューブを取得
    getCubesByCondition(conditionFn) {
        return this.cubes.filter(conditionFn);
    }




}



