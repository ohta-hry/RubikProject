import * as THREE from 'three';

import { SmallCube } from './SmallCube.js';
import { getCubeType } from '../utils/Helpers.js';

export class CubeManager {
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
            console.log("コーナーキューブの数:", this.categorizedCubes.corners); // 8
            console.log("エッジキューブの数:", this.categorizedCubes.edges);     // 12
            console.log("センターキューブの数:", this.categorizedCubes.centers);   // 6
        }
    
    // 新しいメソッド: 全キューブをシーンに追加
    addAllCubesToScene(scene) {
        this.cubes.forEach(cube => {
            scene.add(cube.group);
        });
    }
    
    // 新しいメソッド: 特定の条件のキューブを取得
    getCubesByCondition(conditionFn) {
        return this.cubes.filter(conditionFn);
    }
}



