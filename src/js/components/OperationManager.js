import * as THREE from 'three';
import { RubikOperation } from '../utils/RubikOperation.js';

export class RotationConfig {
    /**
        * @param {Axis} axis - X|Y|Z
        * @param {number} multi - 倍率
        * @param {boolean[]} rotateRows - 行ごとの回転フラグ
        * @param {RubikOperation} RubikOperation
    */
    constructor(axis, multi, rotateRows, operation) {
        // バリデーション
        if (!['X', 'Y', 'Z'].includes(axis)) {
            throw new Error('axis must be X, Y, or Z');
        }
    
        if (!Number.isInteger(multi) || multi === 0) {
            throw new Error('multi must be a non-negative integer');
        }  
    
        if (!Array.isArray(rotateRows) || rotateRows.length === 0) {
            throw new Error('rotateRows must be a non-empty array');
        }   

        if (!(operation instanceof RubikOperation)) {
            throw new TypeError('operation must be an instance of RubikOperation');
        }

        // プロパティ定義
        Object.defineProperties(this, {
            axis: { value: axis, writable: false, enumerable: true },
            multi: { value: multi, writable: false, enumerable: true },
            rotateRows: { value: [...rotateRows], writable: false, enumerable: true }, // コピーして凍結
            RubikOperation: { value: operation, writable: false, enumerable: true }
        });
    }
}

export class OperationManager {

    


}