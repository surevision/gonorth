// Learn cc.Class:
//  - https://docs.cocos.com/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

let Game = require("./game");
cc.Class({
    extends: cc.Component,

    properties: {
        _frameCnt: 0,
        _frameRate: 2,
        game: {
            type: Game,
            default: null
        }
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        // 全局变量初始化
        cc.soulbaka = cc.soulbaka || {};
        cc.soulbaka.main = this;
        // 碰撞记录{objname_ballname: false}
        cc.soulbaka.collision = {};
        // 球命名累加计数
        cc.soulbaka.ballIncrement = 0;
        // 帧计数
        this._frameCnt = 0;
        // 球速度比例
        this._frameRate = 2;
        // 碰撞检测初始化
        let manager = cc.director.getCollisionManager();
        manager.enabled = true;
        manager.enabledDebugDraw = true;
    },

    start () {
        cc.soulbaka.game = this.game;
    },

    update (dt) {
        this._frameCnt += 1;
        if (this._frameCnt % this._frameRate == 0) {
            if (this.game && this.game.isRunning()) {
                this.game.step();
            }
        }
    },

    toNormalSpeed() {
        this._frameRate = 2;
    },
    toSpeed(speed) {
        this._frameRate = Math.floor(speed) || 1;
    }
});
