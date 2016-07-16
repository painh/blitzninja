var TILE_SIZE = 32;
var MAP_SIZE = 10;

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

    for (var i = 1; i < MAP_SIZE - 1; ++i)
        for (var j = 1; j < MAP_SIZE - 1; ++j) {
            this.list.push(cc.p(i, j));
        }
}

EmptyMapList.prototype.Draw = function() {
    var idx = randomRange(0, this.list.length - 1);

    var p = this.list[idx];

    removeFromList(this.list, p);

    return p;
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

    Init : function()
    {
        this.removeAllChildren();
        this._draw =  null;
        this._fingerstreak =  null;
        this._thunderman =  null;
        this._moveList =  [];
        this._sprites =  [];
        this._lineIdx =  0;
        this._thundermanRunning =  false;
        this._spot =  null;

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
        var axis = randomRange(0, 1);
        var axisType = randomRange(0, 1);
        var pos = randomRange(0, MAP_SIZE - 1);
        var x, y;

        if (axis == 0 && axisType == 0) {
            x = pos * TILE_SIZE;
            y = 0;
        }

        if (axis == 0 && axisType == 1) {
            x = pos * TILE_SIZE;
            y = (MAP_SIZE - 1) * TILE_SIZE;
        }

        if (axis == 1 && axisType == 0) {
            y = pos * TILE_SIZE;
            x = 0;
        }

        if (axis == 1 && axisType == 1) {
            y = pos * TILE_SIZE;
            x = (MAP_SIZE - 1) * TILE_SIZE;
        }

        x += TILE_SIZE / 2;
        y += TILE_SIZE / 2;

        this.AddObject("spot", x, y, res.spot, 5);

        this._thunderman = new cc.Sprite(res.thunderman);
        this.addChild(this._thunderman, 5, 4);
        this._thunderman.x = TILE_SIZE * 5 + TILE_SIZE / 2;
        this._thunderman.y = TILE_SIZE * 5 + TILE_SIZE / 2;
        this._thunderman.setScale(4);
        this._thunderman.texture.setAliasTexParameters();

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
            this.AddObject("redman", p.x * TILE_SIZE + TILE_SIZE / 2,  p.y * TILE_SIZE + TILE_SIZE / 2, res.redman, 3);
        }

        for (var i = 0; i < 20; ++i) { 
            var p = emptyList.Draw();
            this.AddObject("block", p.x * TILE_SIZE + TILE_SIZE / 2,  p.y * TILE_SIZE + TILE_SIZE / 2, res.block_0, 1);
        }

        var r = 32;
        this._draw.drawCircle(cc.p(0, 0), r, 0, 20, false, 6, cc.color(0, 255, 0, 255));

        this._fingerstreak = new cc.MotionStreak(3, 3, 6, cc.color.GREEN, res.streak);
        this._fingerstreak.setPosition(0 + r / 2, 0 + r / 2);
        //        this._fingerstreak.setPosition(this._thunderman.x + r / 2, this._thunderman.y + r / 2);
        this.addChild(this._fingerstreak, 3);

    },

    AddObject : function(type, x, y, filename, layerIdx)
    {
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
                var obj = this._sprites[j];

                if (lineRectIntersect(prevP, curP, obj.getBoundingBox())) {
                    if(obj.info.type == "spot")
                    {
                        this.Init();
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
        this._fingerstreak.x = pos.x + 32 / 2 - 6 * 2;
        this._fingerstreak.y = pos.y + 32 / 2 - 6 * 2;
    },

    containMap: function(ccp) {
        return cc.rectContainsPoint(cc.rect(0, 0, MAP_SIZE * TILE_SIZE, MAP_SIZE * TILE_SIZE), ccp);
    }

});
