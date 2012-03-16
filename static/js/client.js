$(window).load(function () {
    controller = new luster.Controller();
    socket = io.connect('http://127.0.0.1:1337');
    socket.on('test', function (data) {
        controller.refresh(data);
    });
});

/** luster namespace **/

window.luster = {};

/** controller object **/

luster.Controller = function () {
    this.paper = Raphael('paper', 800, 800);
    this.initializeLanterns();
};

/**
* The mapping for the lanterns - because the lanterns are all connected
* via a single cable.
*/
luster.Controller.prototype.lanternInitMapping = [
                [42, 43, 44, 45, 46, 47, 48], /** 47, 47 **/
                [41, 40, 39, 38, 37, 36, 35],
                [28, 29, 30, 31, 32, 33, 34],
                [27, 26, 25, 24, 23, 22, 21],
                [14, 15, 16, 17, 18, 19, 20],
                [13, 12, 11, 10, 9, 8, 7],
    /** 0,0 **/ [0, 1, 2, 3, 4, 5, 6]
];

luster.Controller.prototype.XYMap = [
    /** 0,0 **/ [0, 1, 2, 3, 4, 5, 6],
                [13, 12, 11, 10, 9, 8, 7],
                [14, 15, 16, 17, 18, 19, 20],
                [27, 26, 25, 24, 23, 22, 21],
                [28, 29, 30, 31, 32, 33, 34],
                [41, 40, 39, 38, 37, 36, 35],
                [42, 43, 44, 45, 46, 47, 48] /** 7, 7 **/
]

/** Used for lantern retrieval **/
luster.Controller.prototype.lanternMap = {};

luster.Controller.prototype.SIZE_X = 6;
luster.Controller.prototype.SIZE_Y = 6;

/**
* Initalize lanterns on the client
*/
luster.Controller.prototype.initializeLanterns = function () {
    var controller = this;
    var x = 250;
    var y = 50;

    $.each(this.lanternInitMapping, function () {
        x = 250;
        for (var i=0; i < this.length; i++) {
            controller.addLantern(this[i], x, y, 30);
            x += 75;
        };
        y += 75;
    });
};

/** Create a lantern object and add it **/
luster.Controller.prototype.addLantern = function (id, xCoord, yCoord, size) {
    var lanternSVG = this.paper.circle(xCoord, yCoord, size);
    var labelSVG = this.paper.text(xCoord, yCoord, id);
    var lantern = new luster.Lantern(id, lanternSVG, labelSVG);
    this.lanternMap[id] = lantern;
};

/** Get and return the lantern by object by its XY coordinate **/
luster.Controller.prototype.getLanternByXY = function (xCoord, yCoord) {
    if (xCoord > this.SIZE_X || yCoord > this.SIZE_Y || xCoord < 0 || yCoord < 0) {
        throw "IndexOutOfBounds: One or more of the provided coordinates are out of bounds"
    }

    var id = this.XYMap[xCoord][yCoord];
    return this.getLanternByID(id);
};

/** Get and return the lantern object by its numerical ID **/
luster.Controller.prototype.getLanternByID = function (id) {
    return this.lanternMap[id];
};

luster.Controller.prototype.refresh = function (data) {
    var controller = this;

    $.each(data, function () {
        var lantern = controller.getLanternByID(this.id);
        lantern.setColor(this.r, this.g, this.b);
    });
};

/** lantern object **/
luster.Lantern = function (id, lanternSVG, labelSVG) {
    this.id = id;
    this.svg = lanternSVG;
    this.label = labelSVG;
};

/** Set the color of the lantern **/
luster.Lantern.prototype.setColor = function (r, g, b) {
    var value = Raphael.rgb(r, g, b);
    this.svg.attr('fill', value);
};


