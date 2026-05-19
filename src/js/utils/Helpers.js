import { CUBE_TYPES } from '../utils/Constants.js';

export function getCubeType(x, y, z) {
    const offsetSum = Math.abs(x - 1) + Math.abs(y - 1) + Math.abs(z - 1);
    switch (offsetSum) {
        case 3: return CUBE_TYPES.CORNER;
        case 2: return CUBE_TYPES.EDGE;
        case 1: return CUBE_TYPES.CENTER;
        case 0: return CUBE_TYPES.CORE;
        default: return 'unknown';
    }
}

/**
 * 操作面から回転レイヤーの基準値を取得します。
 * @param {string} base - R|L|U|D|F|B
 * @returns {number} R/U/Fなら1、L/D/Bなら-1、それ以外なら0
 */
export function getBaseLayer(base) {
    switch (base) {
        case 'R':
        case 'U':
        case 'F':
            return 1;
        case 'L':
        case 'D':
        case 'B':
            return -1;
        default:
            return 0;
    }
}
