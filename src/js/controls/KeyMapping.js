/**
 * キーボードの6キー（U / L / B / F / R / D）が、トグルの状態によって
 * 「何と表示され、何が入力されるか」を決める。表示ラベルと入力文字は常に同じ。
 *
 * トグルは2系統。それぞれ最大1つだけ選べ、系統どうしは同時に選べる。
 *   turn  （回転量）  : ' / 2        → 末尾に付く
 *   layer （層・軸）  : w / xyz / MES → キーの文字そのものを置き換える、または w を付ける
 *
 * 組み立て順は「基本キー → layer → turn」。
 *   例：R + w + '   → Rw'
 *       F + xyz + 2 → y2
 */

/** turn：選択肢 id → 末尾に付ける文字（id は index.html の data-option と対応） */
const TURN_SUFFIXES = {
    prime: "'",
    double: '2'
};

/**
 * layer：選択肢 id → 挙動（id は index.html の data-option と対応）
 *   suffix : 基本キーの後ろに付ける（6キーすべて有効）
 *   map    : 基本キーを別の文字に置き換える。載っていないキーは無効（ラベルなし・押せない）
 */
const LAYER_MODES = {
    wide:  { suffix: 'w' },
    axis:  { map: { U: 'y', F: 'z', R: 'x' } },   // xyz
    slice: { map: { D: 'E', F: 'S', R: 'M' } }    // MES
};

/**
 * @param {string} base  基本キー（U / L / B / F / R / D）
 * @param {{layer: string|null, turn: string|null}} state  各トグルの選択中 id（未選択は null）
 * @returns {{text: string, enabled: boolean}}  text は表示ラベル兼入力文字。無効キーは ''
 */
export function resolveKey(base, { layer = null, turn = null } = {}) {
    const mode = LAYER_MODES[layer];
    let text = base;

    if (mode?.map) {
        text = mode.map[base];
        if (!text) {
            return { text: '', enabled: false };
        }
    } else if (mode?.suffix) {
        text += mode.suffix;
    }

    return { text: text + (TURN_SUFFIXES[turn] ?? ''), enabled: true };
}
