// Learn cc.Class:
//  - https://docs.cocos.com/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html
let Ball = require("./ball");

let STATES = {
    IDLE: "IDLE",
    RUNNING: "RUNNING",
    WIN: "WIN",
    LOSE: "LOSE"
}

cc.Class({
    extends: cc.Component,

    properties: {
        // 绑定对象
        player: cc.Node,
        balls: {
            type: [Ball],
            default: [],
        },
        items: {
            type: [cc.Node],
            default: []
        },
        bricks: {
            type: [cc.Node],
            default: []
        },
        walls: {
            type: [cc.Node],
            default: []
        },
        touchNode: cc.Node,
        // 游戏阶段
        _state: STATES.IDLE,

        // 球无敌持续时间（秒）
        _fireballTime: 0,
        // 球加速时间
        _speedballTime: 0,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        // 标记碰撞类型
        this.walls.forEach(w => {
            if (w.name == "wall_bottom") {
                w._coll_type = "bottomWall";
            } else {
                w._coll_type = "wall";
            }
        });
        this.player._coll_type = "player";
        // 控制杆    
        this.touchNode.on(cc.Node.EventType.TOUCH_START, function (touch, event) {
            // 返回世界坐标
            let touchLoc = touch.getLocation();
            // https://docs.cocos.com/creator/api/zh/classes/Intersection.html 检测辅助类
            cc.log(touchLoc);
            this.player.x = this.player.parent.convertToNodeSpaceAR(touchLoc).x;
        }, this);
        this.touchNode.on(cc.Node.EventType.TOUCH_MOVE, function (touch, event) {
            // 返回世界坐标
            let touchLoc = touch.getLocation();
            this.player.x = this.player.parent.convertToNodeSpaceAR(touchLoc).x;
        }, this);
    },

    start () {
        this._state = STATES.RUNNING;
        this.load(1);
    },
    
    isRunning() {
        return this._state == STATES.RUNNING;
    },

    isWin() {
        return this._state == STATES.WIN;
    },

    isLose() {
        return this._state == STATES.LOSE;
    },

    /**
     * 主循环方法
     */
    step() {
        // 球移动
        if (this.balls) {
            this.balls.forEach(ball => {
                if (ball.isAlive()) {
                    ball.move();
                }
            });
        }
        // 掉落物移动
        if (this.items) {
            this.items.forEach(item => {
                if (item.isAlive()) {
                    item.move();
                }
            });
        }
        // 判断胜负
    },

    update (dt) {
        if (this._fireballTime > 0) {
            this._fireballTime -= dt;
            if (this._fireballTime <= 0) {
                // 无敌结束
                this._fireballTime = 0; // 直接用这个变量判断球是否无敌
            }
        }
        if (this._speedballTime > 0) {
            this._speedballTime -= dt;
            if (this._speedballTime <= 0) {
                this._speedballTime = 0;
                cc.soulbaka.main.toNormalSpeed();    // 恢复原速度
            }
        }
    },

    load(lv) {
        this._state = STATES.IDLE;
        let path = `map/lv${Math.floor(lv)}`;
        cc.resources.load(path, function (err, file) {
            cc.log(file.text);
            let lines = file.text.split('\n');
            lines.forEach((line, lineNum) => {
                line = line.trim();
                let datas = line.split(',');
                datas.forEach((data, index) => {
                    this.generateByData(data, lineNum, index);
                });
            })
            // 开始
            this._state = STATES.RUNNING;
        }.bind(this));
    },

    /**
     * 创建砖块
     * @param {*} data 
     * @param {*} lineNum 
     * @param {*} index 
     */
    generateByData(data, lineNum, index) {
        // cc.log(data, lineNum, index);
        // if (lineNum > 2 || index > 2) {
        //     return;
        // }
        let Width = 48;
        let Height = 36;
        let offset = 6;
        let x = index * (Width + offset) - (Width + offset) * 10 / 2 + offset;
        let y = -lineNum * (Height + offset) - 36 + this.walls[2].y;

        if (data == "0") {
            // 砖块
            let node = new cc.Node();
            node.parent = cc.find("Canvas");
            node.width = Width;
            node.height = Height;
            let collider = node.addComponent(cc.BoxCollider);
            collider.size.width = Width;
            collider.size.height = Height
            node._coll_type = "brick";
            node.name = `brick_${index}_${lineNum}`;
            node.x = x;
            node.y = y;
        }
        if (data == "1") {
            // 奖励砖块
            let node = new cc.Node();
            node.parent = cc.find("Canvas");
            node.width = Width;
            node.height = Height;
            let collider = node.addComponent(cc.BoxCollider);
            collider.size.width = Width;
            collider.size.height = Height
            node._coll_type = "brick";
            node.name = `brick_${index}_${lineNum}`;
            node.x = x;
            node.y = y;
        }
    }
});
