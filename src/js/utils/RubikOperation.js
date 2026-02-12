import { QUA_ANGLE } from "./Constants.js";

export class RubikOperation {
    #pos_corner; #pos_edge; #pos_center;
    #qua_corner; #qua_edge; #qua_center;

    constructor(
        pos_corner, pos_edge, pos_center, 
        qua_corner, qua_edge, qua_center
    ) {
        // 配列をコピーして凍結
        this.#pos_corner = Object.freeze([...(pos_corner || [0, 1, 2, 3, 4, 5, 6, 7])]);
        this.#pos_edge = Object.freeze([...(pos_edge || [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])]);
        this.#pos_center = Object.freeze([...(pos_center || [0, 1, 2, 3, 4, 5])]);
        
        // クォータニオン配列の初期化（デフォルトは単位クォータニオン）        
        this.#qua_corner = (qua_corner || Array(8).fill().map(QUA_ANGLE.identity)).map(q => q.clone());
        this.#qua_edge = (qua_edge || Array(12).fill().map(QUA_ANGLE.identity)).map(q => q.clone());
        this.#qua_center = (qua_center || Array(6).fill().map(QUA_ANGLE.identity)).map(q => q.clone());
        
        this.#validate();
    }

    // 読み取り専用ゲッター
    get pos_corner() { return this.#pos_corner; }
    get pos_edge() { return this.#pos_edge; }
    get pos_center() { return this.#pos_center; }

    get qua_corner() { return this.#qua_corner; }
    get qua_edge() { return this.#qua_edge; }
    get qua_center() { return this.#qua_center; }

    #validate() {
        if (this.#pos_corner.length !== 8 ||
            this.#pos_edge.length !== 12 ||
            this.#pos_center.length !== 6) {
        throw new Error("Invalid array lengths");
        }

        if (this.#qua_corner.length !== 8 ||
            this.#qua_edge.length !== 12 ||
            this.#qua_center.length !== 6) {
        throw new Error("Invalid quaternion array lengths");
        }
    }

    /**
     * 操作を合成する (this ∘ other)
     * @param {RubikOperation} other - 合成する操作
     * @returns {RubikOperation} 新しい操作インスタンス
     */
    compose(other) {
        // 位置の合成
        const new_pos_corner = this.#pos_corner.map((val, i) => this.#pos_corner[other.#pos_corner[i]]);
        const new_pos_edge = this.#pos_edge.map((val, i) => this.#pos_edge[other.#pos_edge[i]]);
        const new_pos_center = this.#pos_center.map((val, i) => this.#pos_center[other.#pos_center[i]]);
        
        // クォータニオンの合成
        const new_qua_corner = this.#qua_corner.map((q, i) => {
            const otherIndex = other.#pos_corner[i];
            return q.clone().multiply(other.#qua_corner[otherIndex]);
        });

        const new_qua_edge = this.#qua_edge.map((q, i) => {
        const otherIndex = other.#pos_edge[i];
        return q.clone().multiply(other.#qua_edge[otherIndex]);
        });
        
        const new_qua_center = this.#qua_center.map((q, i) => {
        const otherIndex = other.#pos_center[i];
        return q.clone().multiply(other.#qua_center[otherIndex]);
        });
        
        return new RubikOperation(
        new_pos_corner, new_pos_edge, new_pos_center,
        new_qua_corner, new_qua_edge, new_qua_center
        );
    }

    inverse() {
        // 位置置換の逆を計算
        const inv_pos_corner = Array(8);
        const inv_pos_edge = Array(12);
        const inv_pos_center = Array(6);
        
        this.#pos_corner.forEach((val, i) => inv_pos_corner[val] = i);
        this.#pos_edge.forEach((val, i) => inv_pos_edge[val] = i);
        this.#pos_center.forEach((val, i) => inv_pos_center[val] = i);
        
        // クォータニオンの逆を計算
        const inv_qua_corner = Array(8);
        const inv_qua_edge = Array(12);
        const inv_qua_center = Array(6);

        this.#pos_corner.forEach((val, i) => {
        inv_qua_corner[val] = this.#qua_corner[i].clone().invert();
        });
        
        this.#pos_edge.forEach((val, i) => {
        inv_qua_edge[val] = this.#qua_edge[i].clone().invert();
        });
        
        this.#pos_center.forEach((val, i) => {
        inv_qua_center[val] = this.#qua_center[i].clone().invert();
        });
        
        return new RubikOperation(
        inv_pos_corner, inv_pos_edge, inv_pos_center,
        inv_qua_corner, inv_qua_edge, inv_qua_center
        );
    }
    
    
    static #createUnitMove(pos_corner, pos_edge, pos_center, rotationQuaternion) {
        // デフォルトは単位クォータニオン（回転なし）
        const defaultQuat = QUA_ANGLE.identity;
        
        // 位置が変化しているピースだけにクォータニオンを設定
        const qua_corner = pos_corner.map((val, i) => val === i ? defaultQuat : rotationQuaternion.clone());
        const qua_edge = pos_edge.map((val, i) => val === i ? defaultQuat : rotationQuaternion.clone());
        const qua_center = pos_center.map((val, i) => val === i ? defaultQuat : rotationQuaternion.clone());
        
        return new RubikOperation(
        pos_corner, pos_edge, pos_center,
        qua_corner, qua_edge, qua_center
        );
    }
    
    /**
     * 恒等操作を返す
     * @returns {RubikOperation} 恒等操作
     */
    static identity() {
        return new RubikOperation();
    }
    /**
     * 基本操作 F を定義するファクトリメソッド
     */
    static F() {
        return this.#createUnitMove(
        [0, 5, 2, 1, 4, 7, 6, 3],        // pos_corner(F)
        [0, 1, 5, 3, 4, 10, 6, 2, 8, 9, 7, 11],  // pos_edge(F)
        [0, 1, 2, 3, 4, 5],              // pos_center(F)
        QUA_ANGLE.Zm90                    // Z軸90度回転
        );
    }

    /**
     * 基本操作 B を定義するファクトリメソッド
     */
    static B() {
        return this.#createUnitMove(
        [2, 1, 6, 3, 0, 5, 4, 7],  // pos_corner(B)
        [0, 6, 2, 3, 1, 5, 9, 7, 8, 4, 10, 11],  // pos_edge(B)
        [0, 1, 2, 3, 4, 5],                        // pos_center(B)
        QUA_ANGLE.Z90
        );
    }

    /**
     * 基本操作 U を定義するファクトリメソッド
     */
    static U() {
        return this.#createUnitMove(
        [0, 1, 3, 7, 4, 5, 2, 6],  // pos_corner(U)
        [0, 1, 2, 7, 4, 5, 3, 11, 8, 9, 10, 6],  // pos_edge(U)
        [0, 1, 2, 3, 4, 5],                        // pos_center(U)
        QUA_ANGLE.Ym90
        );
    }

    /**
     * 基本操作 D を定義するファクトリメソッド
     */
    static D() {
        return this.#createUnitMove(
        [4, 0, 2, 3, 5, 1, 6, 7],  // pos_corner(D)
        [4, 1, 2, 3, 8, 0, 6, 7, 5, 9, 10, 11],  // pos_edge(D)
        [0, 1, 2, 3, 4, 5],                        // pos_center(D)
        QUA_ANGLE.Y90
        );
    }

    /**
     * 基本操作 L を定義するファクトリメソッド
     */
    static L() {
        return this.#createUnitMove(
        [1, 3, 0, 2, 4, 5, 6, 7],  // pos_corner(L)
        [2, 0, 3, 1, 4, 5, 6, 7, 8, 9, 10, 11],  // pos_edge(L)
        [0, 1, 2, 3, 4, 5],                        // pos_center(L)
        QUA_ANGLE.X90
        );
    }

    /**
     * 基本操作 R を定義するファクトリメソッド
     */
    static R() {
        return this.#createUnitMove(
        [0, 1, 2, 3, 6, 4, 7, 5],  // pos_corner(R)
        [0, 1, 2, 3, 4, 5, 6, 7, 9, 11, 8, 10],  // pos_edge(R)
        [0, 1, 2, 3, 4, 5],                        // pos_center(R)
        QUA_ANGLE.Xm90
        );
    }


        /**
     * 基本操作 M を定義するファクトリメソッド
     */
    static M() {
        return this.#createUnitMove(
        [0, 0, 0, 0, 0, 0, 0, 0],  // pos_corner(M) - 未使用（全て0）
        [0, 1, 2, 3, 5, 7, 4, 6, 8, 9, 10, 11],  // pos_edge(M)
        [0, 3, 1, 4, 2, 5],                        // pos_center(M)
        QUA_ANGLE.X90
        );
    }

    /**
     * 基本操作 E を定義するファクトリメソッド
     */
    static E() {
        return this.#createUnitMove(
        [0, 0, 0, 0, 0, 0, 0, 0],  // pos_corner(E) - 未使用（全て0）
        [0, 9, 1, 3, 4, 5, 6, 7, 8, 10, 2, 11],  // pos_edge(E)
        [2, 1, 5, 0, 4, 3],                        // pos_center(E)
        QUA_ANGLE.Y90
        );
    }

    /**
     * 基本操作 S を定義するファクトリメソッド
     */
    static S() {
        return this.#createUnitMove(
        [0, 0, 0, 0, 0, 0, 0, 0],  // pos_corner(S) - 未使用（全て0）
        [8, 1, 2, 0, 4, 5, 6, 7, 11, 9, 10, 3],  // pos_edge(S)
        [1, 5, 2, 3, 0, 4],                        // pos_center(S)
        QUA_ANGLE.Z90
        );
    }
    }