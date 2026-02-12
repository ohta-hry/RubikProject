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

        this.categorizedCubes.corners.forEach((cube, i) => {
            cube._setPosition(this.#currentOperation.pos_corner[i],this.#currentOperation.qua_corner[i]);
        });

        this.categorizedCubes.edges.forEach((cube, i) => {
            cube._setPosition(this.#currentOperation.pos_edge[i],this.#currentOperation.qua_edge[i]);
        });

        this.categorizedCubes.centers.forEach((cube, i) => {
            cube._setPosition(this.#currentOperation.pos_center[i],this.#currentOperation.qua_center[i]);
        });
    }










    // メソッド: 特定の条件のキューブを取得
    getCubesByCondition(conditionFn) {
        return this.cubes.filter(conditionFn);
    }




}



