// Learn cc.Class:
//  - https://docs.cocos.com/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

let STATES = {
    ALIVE: "ALIVE",
    DEAD: "DEAD",
}
cc.Class({
    extends: cc.Component,

    properties: {
        speed: 500,
        direction: 0,

        _dir: cc.Vec2.ZERO,
        _state: STATES.ALIVE,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.collider = this.node.getComponent(cc.BoxCollider);
        this.node._type = "ball";
        if (this._dir.equals(cc.Vec2.ZERO)) {
            this._dir = cc.Vec2.RIGHT.rotate(this.direction * Math.PI / 180).normalize();
            // cc.log(this._dir);
        }
        this.moveDelta = 1.0 / 60;
    },

    start () {

    },

    isAlive() {
        return this._state == STATES.ALIVE;
    },

    move() {
        let dis = this._dir.mul(this.moveDelta * this.speed);
        this.node.x += dis.x;
        this.node.y += dis.y;
    },

    /**
     * a在b下方
     * @param {*} a 
     * @param {*} b 
     */
    isBelow(a, b) {
        return a.y + a.height <= b.y;
    },
    /**
     * a在b上方
     * @param {*} a 
     * @param {*} b 
     */
    isAbove(a, b) {
        return a.y >= b.y + b.height;
    },
    /**
     * a在b左方
     * @param {*} a 
     * @param {*} b 
     */
    isLeft(a, b) {
        return a.x + a.width <= b.x;
    },
    /**
     * a在b右方
     * @param {*} a 
     * @param {*} b 
     */
    isRight(a, b) {
        return a.x >= b.x + b.width;
    },
    /**
     * 当碰撞产生的时候调用
     * @param  {Collider} other 产生碰撞的另一个碰撞组件
     * @param  {Collider} self  产生碰撞的自身的碰撞组件
     */
    onCollisionEnter: function (other, self) {
        // 碰撞系统会计算出碰撞组件在世界坐标系下的相关的值，并放到 world 这个属性里面
        let selfWorld = self.world;
        // 碰撞组件的 aabb 碰撞框
        let aabb = selfWorld.aabb;
        // 节点碰撞前上一帧 aabb 碰撞框的位置
        let preAabb = selfWorld.preAabb;
        // 自身运动方向角度
        let angle = cc.Vec2.RIGHT.signAngle(this._dir);
        // cc.log(this._dir.x, this._dir.y);
        // cc.log(angle * 180 / Math.PI);
        // cc.log('on collision enter');
        if (other.node._coll_type == "wall" ||
            other.node._coll_type == "brick" ||
            other.node._coll_type == "player" ||
            other.node._coll_type == "bottomWall") {
            
            if (other.node._coll_type == "brick" && 
                cc.soulbaka.game.isOnFire()) {
                // 火球不反弹
            } else {
                // 反弹
                let a = self.world.preAabb;
                let b = other.world.aabb;
                // 回溯到重叠之前
                // let dis = this._dir.mul(this.moveDelta * this.speed);
                // while (a.intersects(b)) {
                //     cc.log("rollback");
                //     a.x -= dis.x;
                //     a.y -= dis.y;
                // }
                if (this._dir.y > 0 && this.isBelow(a, b)) {
                    // 撞底部
                    // cc.log("below");
                    this._dir = cc.Vec2.RIGHT.rotate(2 * Math.PI - angle);
                } else if (this._dir.y < 0 && this.isAbove(a, b)) {
                    // 撞顶部
                    // cc.log("above");
                    this._dir = cc.Vec2.RIGHT.rotate(2 * Math.PI - angle);
                } else if (this._dir.x > 0 && this.isLeft(a, b)) {
                    // 撞左边
                    // cc.log("left");
                    this._dir = cc.Vec2.RIGHT.rotate(1 * Math.PI - angle);
                } else if (this._dir.x < 0 && this.isRight(a, b)) {
                    // 撞右边
                    // cc.log("right");
                    this._dir = cc.Vec2.RIGHT.rotate(3 * Math.PI - angle);
                }
                // 修正与偏移
                if (other.node._coll_type == "player") {
                    let rAngle = cc.Vec2.RIGHT.signAngle(this._dir) * 180 / Math.PI;
                    if (rAngle < 18 && rAngle > 0) {
                        // 低斜率修正
                        this._dir.rotateSelf(15 * Math.PI / 180);
                        // console.log("0~18");
                    } else if (rAngle < 180 && rAngle > 180 - 18) {
                        // 低斜率修正
                        this._dir.rotateSelf(-15 * Math.PI / 180);
                        // console.log("-18~0");
                    } else {
                        // 正常情况随机偏移
                        this._dir = this._dir.rotate(
                            (Math.random() > 0.5 ? 1 : -1) * Math.random() * 25 * Math.PI / 180);
                    }
                }
            }
        }
        if (other.node._coll_type == "bottomWall") {
            // 死亡 
            this._state = STATES.DEAD;
            cc.soulbaka.game.checkWinLose();
            this.node.active = false;
        }
        // 生成奖励
        if (other.node._coll_type == "brick" &&
            (other.node._data == "1" || (Math.random() < 0.1 && other.node._data == "0"))) {
            
            cc.soulbaka.game.generateItem(other.node.x, other.node.y);
        }
        // 隐藏砖块
        if (other.node._coll_type == "brick") {
            cc.soulbaka.game.increaseScore();
            cc.soulbaka.game.showDrop(other.node.parent.convertToWorldSpaceAR(other.node.position));
            other.node.active = false;
            cc.soulbaka.game.checkWinLose();
        }
    },
    /**
     * 当碰撞产生后，碰撞结束前的情况下，每次计算碰撞结果后调用
     * @param  {Collider} other 产生碰撞的另一个碰撞组件
     * @param  {Collider} self  产生碰撞的自身的碰撞组件
     */
    onCollisionStay: function (other, self) {
        // cc.log('on collision stay');
    },
    /**
     * 当碰撞结束后调用
     * @param  {Collider} other 产生碰撞的另一个碰撞组件
     * @param  {Collider} self  产生碰撞的自身的碰撞组件
     */
    onCollisionExit: function (other, self) {
        // cc.log('on collision exit');
    }
    // update (dt) {},
});
