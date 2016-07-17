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


                if (!layer._thundermanRunning)
                    return;

                if (!layer.containMap(touchLocation)) {
                    layer.touchEnd(touchLocation);
                    return;
                }

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

                if (layer.isWaitGameEnd())
                    return;

                if (!layer.containMap(touchLocation))
                    return;

                if (!cc.rectContainsPoint(layer._thunderman.getBoundingBox(), touchLocation))
                    return;

                draw.setVisible(true);
                draw.x = touchLocation.x;
                draw.y = touchLocation.y;

                layer._moveList = [];
                layer._thundermanRunning = true;

                if (layer._fingerstreak)
                    layer.removeChild(layer._fingerstreak, true);
                layer._fingerstreak = new cc.MotionStreak(3, 3, 6, cc.color.GREEN, res.streak);
                layer.RefreshFingerStreakPos();
                layer.addChild(layer._fingerstreak, 3);
            },

            onTouchesEnded: function(touches, event) {
                if (touches.length == 0)
                    return;

                var touch = touches[0];
                var touchLocation = touch.getLocation();
                var layer = event.getCurrentTarget();
                layer.touchEnd(touchLocation);
            },


            onTouchesCancelled: function(touches, event) {
                return;
            }
        }, layer);
    }
});
