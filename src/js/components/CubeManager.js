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

        if (!['x', 'y', 'z'].includes(rotationConfig.axisName)) {
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
        return layers.some(layer => Math.abs(cube.group.position[axisName] - layer) < 0.001);
    }










    // メソッド: 特定の条件のキューブを取得
    getCubesByCondition(conditionFn) {
        return this.cubes.filter(conditionFn);
    }




}



