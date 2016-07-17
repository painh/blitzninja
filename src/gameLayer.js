var TILE_SIZE = 32;
var MAP_SIZE = 10;
var FINGER_GUIDE_SIZE = 32;

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

removeFromList = function(list, obj) {
    var idx = list.indexOf(obj);
    if (idx == -1)
        return;

    list.splice(idx, 1);
}



var EmptyMapList = function() {
    this.list = [];

    for (var i = 0; i < MAP_SIZE; ++i)
        for (var j = 0; j < MAP_SIZE; ++j) {
            this.list.push(cc.p(i, j));
        }
}

EmptyMapList.prototype.Draw = function() {
    var idx = randomRange(0, this.list.length - 1);

    var p = this.list[idx];

    removeFromList(this.list, p);

    return p;
}

EmptyMapList.prototype.DrawOutLine = function() {
    for(var i = 0; i < 200; ++i)
    {
        var idx = randomRange(0, this.list.length - 1);

        var p = this.list[idx];

        if(p.x == 0 || p.x == MAP_SIZE -1 ||
            p.y == 0 || p.y == MAP_SIZE - 1)
        {
            removeFromList(this.list, p);

            return p;
        }

    }

    throw "wtf";
}

EmptyMapList.prototype.DrawInRect = function() {
    for(var i = 0; i < 200; ++i)
    {
        var idx = randomRange(0, this.list.length - 1);

        var p = this.list[idx];

        if( (p.x != 0 && p.x != MAP_SIZE -1 &&
            p.y != 0 && p.y != MAP_SIZE - 1) )
        {
            removeFromList(this.list, p);

            return p;
        }

    }

    throw "wtf";
}


EmptyMapList.prototype.Remove = function(x, y) {
    var idx = y * MAP_SIZE + x;

    var p = this.list[idx];

    removeFromList(this.list, p);
}


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

    isWaitGameEnd: function() {
        if (this._gameEndTS == null)
            return false;

        return true;
    },

    SetWaitGameEnd: function(afterSec) {
        this._gameEndTS = new Date();
        this._gameEndTS.setSeconds(this._gameEndTS.getSeconds() + afterSec);
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

        this._draw.drawCircle(cc.p(0, 0), FINGER_GUIDE_SIZE, 0, 20, false, 6, cc.color(0, 255, 0, 255));
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

        return true;
    },

    onThunderManMoved: function() {
        if (this._lineIdx >= this._moveList.length - 1) {
            this._thunderman.stopAllActions();
            this.SetWaitGameEnd(3);
            return;
        }

        if(this.isWaitGameEnd())
            return;

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
                var obj = this._sprites[j];

                if (lineRectIntersect(prevP, curP, obj.getBoundingBox())) {
                    if (obj.info.type == "spot") {
                        this.SetWaitGameEnd(3);
                        return;
                    }
                    if (obj.info.type == "block") {
                        this.SetWaitGameEnd(3);
                        return;
                    }
                    var blink = cc.Blink.create(1, 20);
                    var callback = cc.CallFunc.create(function(data) {
                        data.stopAllActions();
                        data.setVisible(true);
                    }, this, obj);
                    var seq = cc.Sequence.create([blink, callback]);
                    obj.runAction(seq);
                }
            }

            prevP = curP;
        }
    },

    onUpdate: function(delta) {
        var pos = this._draw.convertToWorldSpace(cc.p(0, 0));
        if (this._thundermanRunning) {
            this._fingerstreak.x = pos.x + FINGER_GUIDE_SIZE / 2 - 6 * 2;
            this._fingerstreak.y = pos.y + FINGER_GUIDE_SIZE / 2 - 6 * 2;
        }

        if(this._gameEndTS)
        {
            var now = new Date();
            if(now > this._gameEndTS)
                this.Init();

        }

    },

    containMap: function(ccp) {
        return cc.rectContainsPoint(cc.rect(0, 0, MAP_SIZE * TILE_SIZE, MAP_SIZE * TILE_SIZE), ccp);
    },

    touchEnd : function(location)
    {
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
