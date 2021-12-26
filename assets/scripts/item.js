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
// buff 种类
let TYPES = {
    NONE: -1,
    FIRE: 0,
    AQUA: 1,
    EARTH: 2,
    WINDY: 3
}
cc.Class({
    extends: cc.Component,

    properties: {
        speed: 300,
        _type: TYPES.NONE,
        _dir: cc.Vec2.RIGHT,

        _state: STATES.ALIVE,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.collider = this.node.getComponent(cc.BoxCollider);
        this.node._type = "item";
        this._dir = cc.Vec2.RIGHT.normalize().rotate(-Math.PI / 2);
    },

    start () {

    },

    isAlive() {
        return this._state == STATES.ALIVE;
    },

    setup(x, y, type) {
        this.node.x = x;
        this.node.y = y;
        this.node.group = "drop";
        this._type = type;
        let collider = this.node.addComponent(cc.BoxCollider);
    },

    move() {
        this.moveDelta = 1.0 / (60 / cc.soulbaka.main._frameRate);
        let dis = this._dir.mul(this.moveDelta * this.speed);
        this.node.x += dis.x;
        this.node.y += dis.y;
    },
    /**
     * 当碰撞产生的时候调用
     * @param  {Collider} other 产生碰撞的另一个碰撞组件
     * @param  {Collider} self  产生碰撞的自身的碰撞组件
     */
    onCollisionEnter: function (other, self) {
        // 被玩家捕获
        if (other.node._coll_type == "player") {
            cc.log(this._type);
            switch(this._type) {
                case TYPES.NONE:
                    break;
                case TYPES.FIRE:
                    // 无敌
                    cc.soulbaka.game.increaseFire();
                    break;
                case TYPES.AQUA:
                    // 分裂
                    cc.soulbaka.game.rainDropBall();
                    break;
                case TYPES.EARTH:
                    // 变长
                    cc.soulbaka.game.growthKey();
                    break;
                case TYPES.WINDY:
                    // 加速
                    cc.soulbaka.game.windyAll();
                    break;
            }
            this.node.active = false;
        }
        if (other.node._coll_type == "bottomWall") {
            this.node.active = false;
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
