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