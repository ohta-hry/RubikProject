//JSDoc用のファイル

/**
 * ルービックキューブの1操作を表す構造体です
 * @typedef {Object} Operation
 * @property {string} base - F|B|U|D|L|R|M|E|S|x|y|z
 * @property {boolean} wide - ワイドムーブかどうか
 * @property {boolean} prime - 逆回転かどうか
 * @property {number} amount - 回転回数
 */

/**
 * 補間回転に必要な描画用設定です
 * @typedef {Object} RotationConfig
 * @property {'x'|'y'|'z'} axisName - 回転軸
 * @property {number[]} layers - 回転対象レイヤー
 * @property {number} totalAngle - progress=1.0時点の総回転角度
 */

/**
 * シーク位置から算出される現在区間の情報です
 * @typedef {Object} SequenceContext
 * @property {RubikOperation} from - 区間開始時点のキューブ状態
 * @property {RotationConfig|null} rotationConfig - この区間で実行中の補間回転設定
 * @property {number} progress - 操作の進み具合
 */
