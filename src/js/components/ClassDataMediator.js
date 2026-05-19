import { RubikOperation } from '../utils/RubikOperation.js';
import { getBaseLayer } from '../utils/Helpers.js';

export class ClassDataMediator {
    /**
     * 記法解析結果の1操作をRubikOperationに変換します。
     * @param {Operation} operation
     * @returns {RubikOperation}
     */
    static toRubikOperation(operation) {
        if (!operation || typeof operation.base !== 'string') {
            throw new TypeError('operation.base is required');
        }

        const factory = this.#getFactory(operation.base, operation.wide || false);
        const amount = operation.amount ?? 1;

        if (!Number.isInteger(amount) || amount < 0) {
            throw new Error('operation.amount must be a non-negative integer');
        }

        const unitOperation = operation.prime ? factory().inverse() : factory();
        let result = RubikOperation.identity();

        for (let i = 0; i < amount; i++) {
            result = result.compose(unitOperation);
        }

        return result;
    }

    /**
     * 記法解析結果の1操作を補間回転用の設定に変換します。
     * @param {Operation} operation
     * @returns {RotationConfig}
     */
    static toRotationConfig(operation) {
        if (!operation || typeof operation.base !== 'string') {
            throw new TypeError('operation.base is required');
        }

        const amount = operation.amount ?? 1;

        if (!Number.isInteger(amount) || amount < 0) {
            throw new Error('operation.amount must be a non-negative integer');
        }

        const angleDirection = operation.prime ? -1 : 1;

        if (operation.wide && !['R', 'L', 'U', 'D', 'F', 'B'].includes(operation.base)) {
            throw new Error(`Wide move not supported: ${operation.base}w`);
        }

        const baseLayer = getBaseLayer(operation.base);
        const layers = operation.wide ? [baseLayer, 0] : [baseLayer];

        switch (operation.base) {
            case 'R':
                return this.#createRotationConfig('x', layers, -angleDirection, amount);
            case 'L':
                return this.#createRotationConfig('x', layers, angleDirection, amount);
            case 'M':
                return this.#createRotationConfig('x', [0], angleDirection, amount);
            case 'U':
                return this.#createRotationConfig('y', layers, -angleDirection, amount);
            case 'D':
                return this.#createRotationConfig('y', layers, angleDirection, amount);
            case 'E':
                return this.#createRotationConfig('y', [0], angleDirection, amount);
            case 'F':
                return this.#createRotationConfig('z', layers, -angleDirection, amount);
            case 'B':
                return this.#createRotationConfig('z', layers, angleDirection, amount);
            case 'S':
                return this.#createRotationConfig('z', [0], -angleDirection, amount);
            case 'x':
            case 'y':
            case 'z':
                throw new Error(`${operation.base} rotations are not supported yet`);
            default:
                throw new Error(`Unsupported operation base: ${operation.base}`);
        }
    }

    /**
     * 操作配列から各区間開始時点の状態配列を生成します。
     * @param {Operation[]} operations
     * @returns {RubikOperation[]}
     */
    static computeSequence(operations) {
        if (!Array.isArray(operations)) {
            throw new TypeError('operations must be an array');
        }

        const states = [RubikOperation.identity()];

        operations.forEach(operation => {
            const current = states[states.length - 1];
            states.push(current.compose(this.toRubikOperation(operation)));
        });

        return states;
    }

    /**
     * シーク位置から現在の操作区間を取得します。
     * @param {number} seekPos - 0.0から1.0までのシーク位置
     * @param {Operation[]} operations
     * @returns {SequenceContext}
     */
    static getSegment(seekPos, operations) {
        if (!Number.isFinite(seekPos)) {
            throw new TypeError('seekPos must be a finite number');
        }

        if (!Array.isArray(operations)) {
            throw new TypeError('operations must be an array');
        }

        const states = this.computeSequence(operations);

        if (operations.length === 0) {
            return {
                from: states[0],
                rotationConfig: null,
                progress: 0
            };
        }

        const clampedSeekPos = Math.min(Math.max(seekPos, 0), 1);
        const scaledSeekPos = clampedSeekPos * operations.length;
        const operationIndex = Math.min(Math.floor(scaledSeekPos), operations.length - 1);
        const progress = operationIndex === operations.length - 1 && clampedSeekPos === 1
            ? 1
            : scaledSeekPos - operationIndex;

        return {
            from: states[operationIndex],
            rotationConfig: this.toRotationConfig(operations[operationIndex]),
            progress
        };
    }

    static #createRotationConfig(axisName, layers, direction, amount) {
        return {
            axisName,
            layers,
            totalAngle: direction * amount * Math.PI / 2
        };
    }

    static #getFactory(base, wide = false) {
        if (wide) {
            switch (base) {
                case 'R': return () => RubikOperation.Rw();
                case 'L': return () => RubikOperation.Lw();
                case 'U': return () => RubikOperation.Uw();
                case 'D': return () => RubikOperation.Dw();
                case 'F': return () => RubikOperation.Fw();
                case 'B': return () => RubikOperation.Bw();
                default:
                    throw new Error(`Wide move not supported: ${base}w`);
            }
        }

        switch (base) {
            case 'F': return () => RubikOperation.F();
            case 'B': return () => RubikOperation.B();
            case 'U': return () => RubikOperation.U();
            case 'D': return () => RubikOperation.D();
            case 'L': return () => RubikOperation.L();
            case 'R': return () => RubikOperation.R();
            case 'M': return () => RubikOperation.M();
            case 'E': return () => RubikOperation.E();
            case 'S': return () => RubikOperation.S();
            case 'x':
            case 'y':
            case 'z':
                throw new Error(`${base} rotations are not supported yet`);
            default:
                throw new Error(`Unsupported operation base: ${base}`);
        }
    }

}
