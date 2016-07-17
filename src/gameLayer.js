var TILE_SIZE = 32;
var MAP_SIZE = 10;
var FINGER_GUIDE_SIZE = 32;
var START_Y = 0;
var STATUS_HEIGHT = 30;

var g_GameStatus = new GameStatus();

var GameLayer = cc.Layer.extend({
    _draw: null,
    _fingerstreak: null,
    _thunderman: null,
    _moveList: [],
    _sprites: [],
    _lineIdx: 0,
    _thundermanRunning: false,
    _spot: null,
    _gameEndTS: null,
    _status: null,
    _gameOver: false,

    isWaitGameEnd: function() {
        if (this._gameEndTS == null)
            return false;

        return true;
    },

    SetWaitGameEnd: function(afterSec) {
        this._gameEndTS = new Date();
        this._gameEndTS.setSeconds(this._gameEndTS.getSeconds() + afterSec);
    },

    NextStage: function() {
        this.SetWaitGameEnd(1);
    },

    GameOver: function() {
        this._gameOver = true;
        this.SetWaitGameEnd(3);
    },

    Init: function() {
        this.removeAllChildren();
        this._draw = null;
        this._fingerstreak = null;
        this._thunderman = null;
        this._moveList = [];
        this._sprites = [];
        this._lineIdx = 0;
        this._thundermanRunning = false;
        this._spot = null;
        this._gameEndTS = null;

        var emptyList = new EmptyMapList();

        /////////////////////////////
        // 2. add a menu item with "X" image, which is clicked to quit the program
        //    you may modify it.
        // ask the window size
        var size = cc.winSize;
        var winSize = cc.director.getWinSize();
        this._draw = new cc.DrawNode();
        this.addChild(this._draw, 100);
        this._draw.setVisible(false);

        this._spot = new cc.Sprite(res.spot);
        var ccp = emptyList.DrawOutLine();
        ccp.x = ccp.x * TILE_SIZE + TILE_SIZE / 2;
        ccp.y = ccp.y * TILE_SIZE + TILE_SIZE / 2;

        this.AddObject("spot", ccp.x, ccp.y, res.spot, 5);

        this._thunderman = new cc.Sprite(res.thunderman);
        this.addChild(this._thunderman, 5, 4);
        var ccp = emptyList.DrawOutLine();
        this._thunderman.x = TILE_SIZE * ccp.x + TILE_SIZE / 2;
        this._thunderman.y = TILE_SIZE * ccp.y + TILE_SIZE / 2;
        this._thunderman.setScale(4);
        this._thunderman.texture.setAliasTexParameters();
        emptyList.Remove(ccp.x, ccp.y);

        for (var i = 0; i < MAP_SIZE; ++i)
            for (var j = 0; j < MAP_SIZE; ++j) {
                var spr = new cc.Sprite(res.tile_0);
                spr.x = i * TILE_SIZE + TILE_SIZE / 2;
                spr.y = j * TILE_SIZE + TILE_SIZE / 2;
                spr.setScale(4);
                spr.texture.setAliasTexParameters();
                this.addChild(spr, 0);
            }

        for (var i = 0; i < 20; ++i) {
            var p = emptyList.Draw();
            this.AddObject("redman", p.x * TILE_SIZE + TILE_SIZE / 2, p.y * TILE_SIZE + TILE_SIZE / 2, res.redman, 3);
        }

        for (var i = 0; i < 10; ++i) {
            var p = emptyList.DrawOutLine();
            this.AddObject("block", p.x * TILE_SIZE + TILE_SIZE / 2, p.y * TILE_SIZE + TILE_SIZE / 2, res.block_0, 1);
        }

        var coinCnt = randomRange(0, 5);

        for (var i = 0; i < coinCnt; ++i) {
            var p = emptyList.DrawOutLine();
            this.AddObject("coin", p.x * TILE_SIZE + TILE_SIZE / 2, p.y * TILE_SIZE + TILE_SIZE / 2, res.coin, 1);
        }

        this._draw.drawCircle(cc.p(0, 0), FINGER_GUIDE_SIZE, 0, 20, false, 6, cc.color(0, 255, 0, 255));

        this._status = cc.LabelTTF.create("HP", "Arial", "18", cc.TEXT_ALIGNMENT_LEFT);
        this._status.x = winSize.width / 2;
        this._status.y = START_Y + MAP_SIZE * TILE_SIZE + STATUS_HEIGHT;
        this.addChild(this._status);
    },

    AddObject: function(type, x, y, filename, layerIdx) {
        var spr = new cc.Sprite(filename);
        this.addChild(spr, layerIdx, 4);
        spr.x = x;
        spr.y = y;
        spr.setScale(4);
        spr.texture.setAliasTexParameters();
        spr.info = {
            type: type
        };
        this._sprites.push(spr);
    },


    ctor: function() {
        //////////////////////////////
        // 1. super init first
        this._super();

        this.Init();

        this.schedule(this.onUpdate);
        var winSize = cc.director.getWinSize();
        g_GameStatus.Init();

        return true;
    },

    onThunderManMoved: function() {
        if (this.isWaitGameEnd())
            return;

        if (this._lineIdx >= this._moveList.length - 1) {
            this._thunderman.stopAllActions();
            this.GameOver();
            return;
        }


        var prevLineIdx = this._lineIdx;
        this._lineIdx = Math.min(this._lineIdx + 3, this._moveList.length - 1);

        var prevP = cc.p(this._thunderman.x, this._thunderman.y);
        var p = cc.p(this._moveList[this._lineIdx][0], this._moveList[this._lineIdx][1]);
        var distance = cc.pDistanceSQ(prevP, p);

        g_GameStatus.lines -= parseInt(distance / 100);
        if (g_GameStatus.lines <= 0)
            this.GameOver();

        var duration = 1 / 100000 * distance;
        var move = cc.moveTo(duration, p);
        //        console.log([this._lineIdx, this._moveList.length, distance, duration]);
        var callback = cc.CallFunc.create(this.onThunderManMoved, this);
        var seq = cc.Sequence.create([move, callback]);
        this._thunderman.runAction(seq);

        for (var i = prevLineIdx + 1; i <= this._lineIdx; ++i) {
            var curP = cc.p(this._moveList[i][0], this._moveList[i][1]);

            for (var j in this._sprites) {
                var obj = this._sprites[j];

                if (obj.info.checked)
                    continue;

                if (lineRectIntersect(prevP, curP, obj.getBoundingBox())) {
                    if (obj.info.type == "spot") {
                        this.NextStage();
                        return;
                    }
                    if (obj.info.type == "block") {
                        this.GameOver();
                        return;
                    }

                    if (obj.info.type == "redman") {
                        g_GameStatus.hp--;

                        var blink = cc.Blink.create(1, 20);
                        var callback = cc.CallFunc.create(function(data) {
                            data.stopAllActions();
                            data.setVisible(true);
                        }, this, obj);
                        var blinkSeq = cc.Sequence.create([blink, callback]);
                        obj.runAction(blinkSeq);

                    }

                    if (obj.info.type == "coin") {
                        g_GameStatus.coins++

                            var blink = cc.Blink.create(1, 20);
                        var callback = cc.CallFunc.create(function(data) {
                            data.stopAllActions();
                            data.setVisible(true);
                        }, this, obj);
                        var blinkSeq = cc.Sequence.create([blink, callback]);
                        obj.runAction(blinkSeq);
                        obj.info.checked = true;
                    }
                }
            }

            prevP = curP;
        }

        if (g_GameStatus.hp <= 0)
            this.GameOver();
    },

    RefreshFingerStreakPos: function() {
        var pos = this._draw.convertToWorldSpace(cc.p(0, 0));
        this._fingerstreak.x = pos.x + FINGER_GUIDE_SIZE / 2 - 6 * 2;
        this._fingerstreak.y = pos.y + FINGER_GUIDE_SIZE / 2 - 6 * 2;
    },

    onUpdate: function(delta) {
        if (this._thundermanRunning) {
            this.RefreshFingerStreakPos();
        }

        if (this._gameEndTS) {
            var now = new Date();
            if (now > this._gameEndTS) {
                if (this._gameOver)
                    cc.director.runScene(new TitleScene());
                else {
                    g_GameStatus.stage++;
                    this.Init();
                }
            }
        }

        this._status.setString(g_GameStatus.GetStatusText());
    },

    containMap: function(ccp) {
        return cc.rectContainsPoint(cc.rect(0, 0, MAP_SIZE * TILE_SIZE, MAP_SIZE * TILE_SIZE), ccp);
    },

    touchEnd: function(location) {
        var draw = this._draw;

        if (!draw.isVisible())
            return;

        if (!this._thundermanRunning)
            return;

        draw.setVisible(false);
        draw.x = location.x;
        draw.y = location.y;

        this._thundermanRunning = false;

        if (this._moveList.length <= 1)
            return;


        this._lineIdx = 0;
        this._thunderman.x = this._moveList[0][0];
        this._thunderman.y = this._moveList[0][1];
        var prevP = cc.p(this._thunderman.x, this._thunderman.y);
        var p = cc.p(this._moveList[1][0], this._moveList[1][1]);
        var distance = cc.pDistanceSQ(prevP, p);
        var move = cc.moveTo(distance / (60 * 1000), p);
        var callback = cc.CallFunc.create(this.onThunderManMoved, this);
        var seq = cc.Sequence.create([move, callback]);
        this._thunderman.runAction(seq);
    }

});
