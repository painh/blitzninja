var TitleLayer = cc.Layer.extend({
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


        var title = new cc.Sprite(res.title);
        this.addChild(title);
        title.x = title.getBoundingBox().width / 2;
        title.y = 300;


        return true;
    },

});

var TitleScene = cc.Scene.extend({
    onEnter: function() {
        this._super();
        var layer = new TitleLayer();
        this.addChild(layer);

        cc.eventManager.addListener({
            event: cc.EventListener.TOUCH_ALL_AT_ONCE,
            onTouchesEnded: function(touches, event) { 
                cc.director.runScene(new GameScene());
//                cc.director.replaceScene(new GameScene()); 
            },
        }, layer);
    }
});
