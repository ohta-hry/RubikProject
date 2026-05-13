//JSDoc用のファイル

/**
 * ルービックキューブの1操作を表す構造体です
 * @typedef {Object} Operation
 * @property {string} base - F|B|U|D|L|R|M|E|S
 * @property {boolean} wide - ワイドムーブかどうか
 * @property {boolean} prime - 逆回転かどうか
 * @property {number} amount - 回転回数
 */

/**
 * シーク位置から算出される現在区間の情報です
 * @typedef {Object} SequenceContext
 * @property {RubikOperation} from - 区間開始時点のキューブ状態
 * @property {Operation} operation - この区間で実行中の操作
 * @property {number} progress - 操作の進み具合
 */
