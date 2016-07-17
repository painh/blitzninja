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
