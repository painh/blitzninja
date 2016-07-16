var TILE_SIZE = 32;
var MAP_WIDTH = 10;
var MAP_HEIGHT = 10;

function randomRange(n1, n2) {
    return Math.floor((Math.random() * (parseInt(n2) - parseInt(n1) + 1)) + parseInt(n1));
};

function lineRectIntersect(p1, p2, rect) {
    var rectLine = [
        [cc.p(rect.x, rect.y), cc.p(rect.x + rect.width, rect.y)],
        [cc.p(rect.x + rect.width, rect.y), cc.p(rect.x + rect.width, rect.y + rect.height)],
        [cc.p(rect.x + rect.width, rect.y + rect.height), cc.p(rect.x, rect.y + rect.height)],
        [cc.p(rect.x, rect.y + rect.height), cc.p(rect.x, rect.y)],
    ];

    for (var i = 0; i < 4; ++i)
        if (cc.pSegmentIntersect(p1, p2, rectLine[i][0], rectLine[i][1]))
            return true;

    return false;
}

var GameLayer = cc.Layer.extend({
    _draw: null,
    _fingerstreak: null,
    _thunderman: null,
    _moveList: [],
    _sprites: [],
    _lineIdx: 0,
    _thundermanRunning: false,

    ctor: function() {
        //////////////////////////////
        // 1. super init first
        this._super();

        /////////////////////////////
        // 2. add a menu item with "X" image, which is clicked to quit the program
        //    you may modify it.
        // ask the window size
        var size = cc.winSize;
        var winSize = cc.director.getWinSize();
        this._draw = new cc.DrawNode();
        this.addChild(this._draw, 100);
        this._draw.setVisible(false);


        this._thunderman = new cc.Sprite(res.thunderman);
        this.addChild(this._thunderman, 5, 4);
        this._thunderman.x = TILE_SIZE * 5 + TILE_SIZE / 2;
        this._thunderman.y = TILE_SIZE * 5 + TILE_SIZE / 2;
        this._thunderman.setScale(4);
        this._thunderman.texture.setAliasTexParameters();

        for (var i = 0; i < MAP_WIDTH; ++i)
            for (var j = 0; j < MAP_HEIGHT; ++j) {
                var spr = new cc.Sprite(res.tile_0);
                spr.x = i * TILE_SIZE + TILE_SIZE / 2;
                spr.y = j * TILE_SIZE + TILE_SIZE / 2;
                spr.setScale(4);
                spr.texture.setAliasTexParameters();
                this.addChild(spr, 0);
            }

        for (var i = 0; i < 20; ++i) {
            var redman = new cc.Sprite(res.redman);
            redman.x = randomRange(0, MAP_WIDTH - 1) * TILE_SIZE + TILE_SIZE / 2;
            redman.y = randomRange(0, MAP_HEIGHT - 1) * TILE_SIZE + TILE_SIZE / 2;
            redman.setScale(4);
            redman.texture.setAliasTexParameters();
            this.addChild(redman, 3, 2);
            this._sprites.push(redman);
        }

        var r = 32;
        this._draw.drawCircle(cc.p(0, 0), r, 0, 20, false, 6, cc.color(0, 255, 0, 255));

        this._fingerstreak = new cc.MotionStreak(3, 3, 6, cc.color.GREEN, res.streak);
        this._fingerstreak.setPosition(0 + r / 2, 0 + r / 2);
        //        this._fingerstreak.setPosition(this._thunderman.x + r / 2, this._thunderman.y + r / 2);
        this.addChild(this._fingerstreak, 3);

        this.schedule(this.onUpdate);

        return true;
    },

    onThunderManMoved: function() {
        if (this._lineIdx >= this._moveList.length - 1) {
            this._thunderman.stopAllActions();
            return;
        }

        var prevLineIdx = this._lineIdx;
        this._lineIdx = Math.min(this._lineIdx + 3, this._moveList.length - 1);

        var prevP = cc.p(this._thunderman.x, this._thunderman.y);
        var p = cc.p(this._moveList[this._lineIdx][0], this._moveList[this._lineIdx][1]);
        var distance = cc.pDistanceSQ(prevP, p);
        var duration = 1 / 100000 * distance;
        var move = cc.moveTo(duration, p);
        //        console.log([this._lineIdx, this._moveList.length, distance, duration]);
        var callback = cc.CallFunc.create(this.onThunderManMoved, this);
        var seq = cc.Sequence.create([move, callback]);
        this._thunderman.runAction(seq);

        for (var i = prevLineIdx + 1; i <= this._lineIdx; ++i) {
            var curP = cc.p(this._moveList[i][0], this._moveList[i][1]);

            for (var j in this._sprites) {
                var redman = this._sprites[j];

                if (lineRectIntersect(prevP, curP, redman.getBoundingBox())) {
                    var blink = cc.Blink.create(1, 20);
                    var callback = cc.CallFunc.create(function(data) {
                        data.stopAllActions();
                        data.setVisible(true);
                    }, this, redman);
                    var seq = cc.Sequence.create([blink, callback]);
                    redman.runAction(seq);
                }
            }

            prevP = curP;
        }
    },

    onUpdate: function(delta) {
        var pos = this._draw.convertToWorldSpace(cc.p(0, 0));
        this._fingerstreak.x = pos.x + 32 / 2 - 6 * 2;
        this._fingerstreak.y = pos.y + 32 / 2 - 6 * 2;
    },

    containMap: function(ccp) {
        return cc.rectContainsPoint(cc.rect(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE), ccp);
    }

});

var GameScene = cc.Scene.extend({
    onEnter: function() {
        this._super();
        var layer = new GameLayer();
        this.addChild(layer);

        cc.eventManager.addListener({
            event: cc.EventListener.TOUCH_ALL_AT_ONCE,
            onTouchesMoved: function(touches, event) {
                if (touches.length == 0)
                    return;

                var touch = touches[0];
                var touchLocation = touch.getLocation();
                var layer = event.getCurrentTarget();

                if (!layer.containMap(touchLocation))
                    return;

                if (!layer._thundermanRunning)
                    return;

                var draw = layer._draw;
                if (!draw.isVisible())
                    return;

                if (layer._moveList.length >= 1) {
                    var lastPoint = layer._moveList[layer._moveList.length - 1];
                    var prevP = cc.p(lastPoint[0], lastPoint[1]);
                    var p = cc.p(touchLocation.x, touchLocation.y);
                    var distance = cc.pDistanceSQ(prevP, p);
                    if (distance < 100)
                        return;
                }

                draw.x = touchLocation.x;
                draw.y = touchLocation.y;

                layer._moveList.push([draw.x, draw.y]);
            },

            onTouchesBegan: function(touches, event) {
                if (touches.length == 0)
                    return;

                var touch = touches[0];
                var touchLocation = touch.getLocation();
                var draw = event.getCurrentTarget()._draw;
                var layer = event.getCurrentTarget();

                if (layer._thundermanRunning)
                    return;

                if (!layer.containMap(touchLocation))
                    return;

                if (!cc.rectContainsPoint(layer._thunderman.getBoundingBox(), touchLocation))
                    return;

                draw.setVisible(true);
                draw.x = touchLocation.x;
                draw.y = touchLocation.y;

                layer._fingerstreak.x = draw.x + 32 / 2 - 6 * 2;
                layer._fingerstreak.y = draw.y + 32 / 2 - 6 * 2;
                layer._moveList = [];
                layer._thundermanRunning = true;
            },

            onTouchesEnded: function(touches, event) {
                if (touches.length == 0)
                    return;

                var touch = touches[0];
                var touchLocation = touch.getLocation();
                var draw = event.getCurrentTarget()._draw;

                if (!draw.isVisible())
                    return;

                var layer = event.getCurrentTarget();

                if (!layer.containMap(touchLocation))
                    return;

                if (!layer._thundermanRunning)
                    return;

                draw.setVisible(false);
                draw.x = touchLocation.x;
                draw.y = touchLocation.y;


                if (layer._moveList.length <= 1)
                    return;

                layer._thundermanRunning = false;

                layer._lineIdx = 0;
                layer._thunderman.x = layer._moveList[0][0];
                layer._thunderman.y = layer._moveList[0][1];
                var prevP = cc.p(layer._thunderman.x, layer._thunderman.y);
                var p = cc.p(layer._moveList[1][0], layer._moveList[1][1]);
                var distance = cc.pDistanceSQ(prevP, p);
                var move = cc.moveTo(distance / (60 * 1000), p);
                var callback = cc.CallFunc.create(layer.onThunderManMoved, layer);
                var seq = cc.Sequence.create([move, callback]);
                layer._thunderman.runAction(seq);


                //                var list = [];
                //                var prevX = layer._thunderman.x = layer._moveList[0][0];
                //                var prevY = layer._thunderman.y = layer._moveList[0][1];
                //                var prevCC = cc.p(prevX, prevY);
                //                for (var i in layer._moveList) {
                //                    var pos = layer._moveList[i];
                //                    var p = cc.p(pos[0], pos[1]);
                //                    var distance = cc.pDistanceSQ(prevCC, p);
                //                    var move = cc.moveTo(distance / (60 * 1000), p);
                //                    list.push(move);
                //                    prevCC = p;
                //                }
                //
                //                layer._thunderman.stopAllActions();
                //                var action = cc.Sequence.create(list);
                //
                //                layer._thunderman.runAction(action);
                //                layer._moveList = [];
            },


            onTouchesCancelled: function(touches, event) {
                return;
            }
        }, layer);
    }
});
