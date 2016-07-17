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

