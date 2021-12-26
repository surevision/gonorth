// Learn cc.Class:
//  - https://docs.cocos.com/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html
let Ball = require("./ball");
let Item = require("./item");
let STATES = {
    IDLE: "IDLE",
    PAUSE: "PAUSE",
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
        drops: {
            type: [cc.Node],
            default: []
        },
        touchNode: cc.Node,
        uiNode: cc.Node,

        _score: 0,
        _showScore: 0,
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
            if (this.isRunning()) {
                this.player.x = this.player.parent.convertToNodeSpaceAR(touchLoc).x;
            }
            if (this._state == STATES.IDLE) {
                this._state = STATES.RUNNING;
            }
        }, this);
        this.touchNode.on(cc.Node.EventType.TOUCH_MOVE, function (touch, event) {
            // 返回世界坐标
            let touchLoc = touch.getLocation();
            if (this.isRunning()) {
                this.player.x = this.player.parent.convertToNodeSpaceAR(touchLoc).x;
            }
        }, this);
    },

    start () {
        this._state = STATES.RUNNING;
        this.load(2);
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
            this.items.forEach(itemNode => {
                let item = itemNode.getComponent(Item);
                if (item.isAlive()) {
                    item.move();
                }
            });
        }
        // 判断胜负
    },

    isOnFire() {
        return this._fireballTime > 0;
    },
    /**
     * 火球时间延长
     */
    increaseFire() {
        let lastTime = this._fireballTime;
        this._fireballTime += 10;
        cc.find("buffs/fire/img", this.uiNode).stopAllActions();
        cc.find("buffs/fire/img", this.uiNode).runAction(cc.sequence(
            cc.scaleTo(0.3, 2, 2),
            cc.scaleTo(0.3, 1, 1)
        ));
        if (lastTime <= 0) {
            // 补充火焰特效
            cc.find("buffs/fire", this.uiNode).active = true;
        }
    },

    /**
     * 球分裂
     */
    rainDropBall() {
        let balls = [];
        let totalNum = 2;   // 偶数
        this.balls.forEach(ball => {
            // 存活的球分裂
            if (ball.isAlive()) {
                let index = 0;
                let num = totalNum;
                // -30°~30°
                let fromDir = ball._dir.rotate(Math.PI / 6);
                let toDir = ball._dir.rotate(-Math.PI / 6);
                for (let i = 0; i < this.balls.length; i += 1) {
                    // 复用一个球
                    if (!this.balls[i].isAlive() && balls.indexOf(this.balls[i]) == -1) {
                        let b = this.balls[i];
                        balls.push(b);
                        b.node.x = ball.node.x;
                        b.node.y = ball.node.y;
                        let angleDir = fromDir.lerp(toDir,
                            ((index < Math.floor(totalNum) / 2) ? index : index + 1) / totalNum);
                        b._dir = angleDir;
                        // b._dir = cc.Vec2.RIGHT.rotate(Math.PI * Math.random());
                        num -= 1;
                        index += 1;
                    }
                }
                // 复用不够，生成新的球
                for (let i = 0; i < num; i += 1) {
                    let b = cc.instantiate(this.balls[0].node).getComponent(Ball);
                    b.node.parent = ball.node.parent;
                    b.node.__isNewBall = true;
                    balls.push(b);
                    b.node.x = ball.node.x;
                    b.node.y = ball.node.y;
                    let angleDir = fromDir.lerp(toDir,
                        ((index < Math.floor(totalNum) / 2) ? index : index + 1) / totalNum);
                    b._dir = angleDir;
                    // let angleDir = cc.Vec2.lerp(toDir, fromDir,
                    //     ((index < (totalNum + 1) / 2) ? index : index + 1) / totalNum);
                    // b._dir = cc.Vec2.RIGHT.rotate(Math.PI * Math.random());
                    index += 1;
                }
            }
        });
        // console.log(balls);
        balls.forEach(ball => {
            if (ball.node.__isNewBall) {
                ball.node.__isNewBall = null;
                this.balls.push(ball);
            }
            ball._state = "ALIVE"; // fixme 需要解耦
            ball.node.active = true;
        });
    },

    /**
     * 玩家区域变长
     */
    growthKey() {
        this.player.width += 30;
        this.player.getComponent(cc.BoxCollider).size.width += 30;
    },

    /**
     * 加速
     */
    windyAll() {
        let lastTime = this._speedballTime;
        this._speedballTime += 10;
        cc.find("buffs/windy/img", this.uiNode).stopAllActions();
        cc.find("buffs/windy/img", this.uiNode).runAction(cc.sequence(
            cc.scaleTo(0.3, 2, 2),
            cc.scaleTo(0.3, 1, 1)
        ))
        if (lastTime <= 0) {
            // 补充疾速特效
            cc.find("buffs/windy", this.uiNode).active = true;
            // 标记加速
            cc.soulbaka.main.toSpeed(1);
        }
    },

    update (dt) {
        if (this._state == STATES.PAUSE) {
            // 暂停
            return;
        }
        if (this._showScore < this._score) {
            this._showScore += 17;
            if (this._showScore > this._score) {
                this._showScore = this._score;
            }
            cc.find("score/coin/data", this.uiNode).getComponent(cc.Label).string = this._showScore;
        }
        // buff 效果刷新时间
        if (this._fireballTime > 0 && this._state == STATES.RUNNING) {
            this._fireballTime -= dt;
            cc.find("buffs/fire/sec", this.uiNode).getComponent(cc.Label).string = Math.round(this._fireballTime);
            if (this._fireballTime <= 0) {
                // 无敌结束
                this._fireballTime = 0; // 直接用这个变量判断球是否无敌
                // 去掉动画
                cc.find("buffs/fire", this.uiNode).active = false;
            }
        }
        if (this._speedballTime > 0 && this._state == STATES.RUNNING) {
            this._speedballTime -= dt;
            cc.find("buffs/windy/sec", this.uiNode).getComponent(cc.Label).string = Math.round(this._speedballTime);
            if (this._speedballTime <= 0) {
                this._speedballTime = 0;
                cc.soulbaka.main.toNormalSpeed();    // 恢复原速度
                // 去掉动画
                cc.find("buffs/windy", this.uiNode).active = false;
            }
        }
    },

    checkWinLose() {
        if (this.balls.every(b=>!b.isAlive())) {
            this._state = STATES.LOSE;
            return;
        }
        if (this.bricks.every(b=>!b.active)) {
            this._state = STATES.WIN;
            return;
        }
    },

    increaseScore() {
        this._score += 100;
    },
    /**
     * 碰撞宝箱得到物品
     * @param {*} wx 世界坐标
     * @param {*} wy 世界坐标
     * @param {*} type 
     */
    showDrop(wx, wy, type) {
        type = type || 
            (Math.floor(cc.soulbaka.main.dropSprites.length * Math.random()));
        
        let dropNode = cc.instantiate(cc.soulbaka.main.dropSprites[type].node);
        this.drops.push(dropNode);
        dropNode.parent = this.uiNode;
        let pos = dropNode.parent.convertToNodeSpaceAR(cc.Vec2(wx, wy));
        dropNode.x = pos.x;
        dropNode.y = pos.y;
        dropNode.opacity = 0;
        dropNode.stopAllActions();
        dropNode.runAction(cc.sequence(
            cc.fadeTo(0.1, 255),
            cc.jumpTo(0.5, pos, 24, 1),
            cc.bezierTo(0.7, [cc.v2(40,40),cc.v2(60,60), cc.find("score", this.uiNode).position, ]),
            cc.fadeTo(0.05, 0),
            cc.callFunc(function() {
                dropNode.destroy();
            }.bind(this))
        ))
    },

    /**
     * 奖励掉落
     * @param {*} x 
     * @param {*} y 
     * @param {*} type 
     */
    generateItem(x, y, type) {
        type = type || (Math.floor(4 * Math.random()));
        // let itemNode = new cc.Node();
        let itemNode = cc.instantiate(cc.soulbaka.main.itemSprites[type].node);
        this.items.push(itemNode);
        itemNode.parent = cc.find("Canvas");
        let item = itemNode.addComponent(Item);
        item.setup(x, y, type);
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
            });
            this._score = 0;
            this._showScore = 0;
            // 开始
            // this._state = STATES.RUNNING;
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
        let offset = 4;
        let x = index * (Width + offset) - (Width + offset) * 10 / 2 + Width / 2;
        let y = -lineNum * (Height + offset) - 36 + this.walls[2].y;

        if (data == "0") {
            // 砖块
            // let node = new cc.Node();
            let node = cc.instantiate(cc.soulbaka.main.boxSprites[0].node);
            node.parent = cc.find("Canvas");
            node.width = Width;
            node.height = Height;
            let collider = node.addComponent(cc.BoxCollider);
            collider.size.width = Width;
            collider.size.height = Height;
            node.group = "brick";
            node._coll_type = "brick";
            node._data = data;
            node.name = `brick_${index}_${lineNum}`;
            node.x = x;
            node.y = y;
            this.bricks.push(node);
        }
        if (data == "1") {
            // 奖励砖块
            // let node = new cc.Node();
            let node = cc.instantiate(cc.soulbaka.main.boxSprites[0].node);
            node.parent = cc.find("Canvas");
            node.width = Width;
            node.height = Height;
            let collider = node.addComponent(cc.BoxCollider);
            collider.size.width = Width;
            collider.size.height = Height
            node.group = "brick";
            node._coll_type = "brick";
            node._data = data;
            node.name = `brick_${index}_${lineNum}`;
            node.x = x;
            node.y = y;
            this.bricks.push(node);
        }
    }
});
