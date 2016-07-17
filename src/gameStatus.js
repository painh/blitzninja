var GameStatus = function() {
    this.Init();
}

GameStatus.prototype.Init = function() {
    this.hp = 10;
    this.lines = 1000;
    this.stage = 00;
    this.coins = 00;
}

GameStatus.prototype.GetStatusText = function() {
    return "hp : " + this.hp + " / line : " + this.lines + "\nstage : " + this.stage + " / coins :" + this.coins;
}
