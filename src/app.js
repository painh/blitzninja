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

                layer._thundermanRunning = false;

                if (layer._moveList.length <= 1)
                    return;


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
            },


            onTouchesCancelled: function(touches, event) {
                return;
            }
        }, layer);
    }
});
