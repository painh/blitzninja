var TILE_SIZE = 32;
var MAP_WIDTH = 10;
var MAP_HEIGHT = 10;

function randomRange(n1, n2) {
    return Math.floor((Math.random() * (parseInt(n2) - parseInt(n1) + 1)) + parseInt(n1));
};

var HelloWorldLayer = cc.Layer.extend({
    _draw: null,
    _streak: null,
    _thunderman: null,
    _moveList: [],
    _sprites: [],
    ctor: function() {
        //////////////////////////////
        // 1. super init first
        this._super();
        console.log(cc.pSegmentIntersect);

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

        this._streak = new cc.MotionStreak(3, 3, 6, cc.color.GREEN, res.streak);
        this._streak.setPosition(this._thunderman.x + r / 2, this._thunderman.y + r / 2);
        this.addChild(this._streak, 3);

        this.schedule(this.onUpdate);

        cc.eventManager.addListener({
            event: cc.EventListener.TOUCH_ALL_AT_ONCE,
            onTouchesMoved: function(touches, event) {
                if (touches.length == 0)
                    return;

                var touch = touches[0];
                var touchLocation = touch.getLocation();
                var layer = event.getCurrentTarget();
                var draw = layer._draw;
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
                draw.setVisible(true);
                draw.x = touchLocation.x;
                draw.y = touchLocation.y;

                layer._streak.x = draw.x + 32 / 2 - 6 * 2;
                layer._streak.y = draw.y + 32 / 2 - 6 * 2;
                layer._moveList = [];
            },

            onTouchesEnded: function(touches, event) {
                if (touches.length == 0)
                    return;

                var touch = touches[0];
                var touchLocation = touch.getLocation();
                var draw = event.getCurrentTarget()._draw;
                var layer = event.getCurrentTarget();
                draw.setVisible(false);
                draw.x = touchLocation.x;
                draw.y = touchLocation.y;

                if (layer._moveList.length <= 0)
                    return;


                var list = [];
                var prevX = layer._thunderman.x = layer._moveList[0][0];
                var prevY = layer._thunderman.y = layer._moveList[0][1];
                var prevCC = cc.p(prevX, prevY);
                for (var i in layer._moveList) {
                    var pos = layer._moveList[i];
                    var p = cc.p(pos[0], pos[1]);
                    var distance = cc.pDistanceSQ(prevCC, p);
                    var move = cc.moveTo(distance / (60 * 1000), p);
                    list.push(move);
                    prevCC = p;
                }

                layer._thunderman.stopAllActions();
                var action = cc.Sequence.create(list);

                layer._thunderman.runAction(action);
                layer._moveList = [];
            },


            onTouchesCancelled: function(touches, event) {
                console.log("end");
                return;
            }
        }, this);
        return true;
    },

    onUpdate: function(delta) {
	    var pos = this._draw.convertToWorldSpace(cc.p(0, 0));
        this._streak.x = pos.x + 32 / 2 - 6 * 2;
        this._streak.y = pos.y + 32 / 2 - 6 * 2;
        //this._streak.setPosition(this._thunderman.x + TILE_SIZE / 2, this._thunderman.y + TILE_SIZE / 2);

        for (var i in this._sprites) {
            var redman = this._sprites[i];

            if (cc.rectOverlapsRect(this._thunderman.getBoundingBox(), redman.getBoundingBox())) {
                redman.runAction(cc.blink(1, 10));
            }
        }
    },

});

var HelloWorldScene = cc.Scene.extend({
    onEnter: function() {
        this._super();
        var layer = new HelloWorldLayer();
        this.addChild(layer);



    }
});
