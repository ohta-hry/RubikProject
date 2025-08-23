import * as THREE from 'three';

import { SmallCube } from './SmallCube.js';
import { getCubeType } from '../utils/Helpers.js';

export class CubeManager {
    constructor() {
        this.cubeGroup = new THREE.Group();
        this.categorizedCubes = {
            corners: [],
            edges: [],
            centers: []
        };
    }
    
    createCube() {
            // グループを作成（全体のルービックキューブ）
            this.cubeGroup = new THREE.Group();
            
            // 3x3x3のループでキューブを生成・分類
            for (let x = 0; x < 3; x++) {
                for (let y = 0; y < 3; y++) {
                    for (let z = 0; z < 3; z++) {
                        // 中心にあって見えないコアキューブはスキップ
                        if (x === 1 && y === 1 && z === 1) {
                            continue;
                        }
                        
                        const cube = new SmallCube(x, y, z);
                        const type = getCubeType(x, y, z);
                        
                        // 判定された種類に応じて、適切な配列に格納
                        switch (type) {
                            case 'corner':
                                this.categorizedCubes.corners.push(cube);
                                break;
                            case 'edge':
                                this.categorizedCubes.edges.push(cube);
                                break;
                            case 'center':
                                this.categorizedCubes.centers.push(cube);
                                break;
                        }
                        
                        // 見た目はcubeGroupにまとめて追加
                        this.cubeGroup.add(cube.group);
                    }
                }
            }
            
            // グループをシーンに追加
            scene.add(this.cubeGroup);
            
            // デバッグ情報をコンソールに出力
            console.log("コーナーキューブの数:", this.categorizedCubes.corners.length); // 8
            console.log("エッジキューブの数:", this.categorizedCubes.edges.length);     // 12
            console.log("センターキューブの数:", this.categorizedCubes.centers.length);   // 6
        }
}