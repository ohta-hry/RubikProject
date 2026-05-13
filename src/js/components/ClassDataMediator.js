import { RubikOperation } from '../utils/RubikOperation.js';

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

        if (operation.wide) {
            throw new Error('wide moves are not supported yet');
        }

        const factory = this.#getFactory(operation.base);
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
                operation: null,
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
            operation: operations[operationIndex],
            progress
        };
    }

    static #getFactory(base) {
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
            default:
                throw new Error(`Unsupported operation base: ${base}`);
        }
    }

}
