$(window).load(function () {
    socket = io.connect('http://10.12.7.208:1337');
    socket.on('test', function (data) {
        controller.refresh(data);
    });
    controller = new luster.Controller();
});

/** luster namespace **/

window.luster = {};

/** controller object **/

luster.Controller = function () {
    this.paper = Raphael('paper', 555, 555);
    this.initializeLanterns();
    this.bindAll();
};

/**
* The mapping for the lanterns - because the lanterns are all connected
* via a single cable.
*/

luster.Controller.prototype.lanternInitMapping = [
    [48, 35, 34, 21, 20, 7, 6],
    [47, 36, 33, 22, 19, 8, 5],
    [46, 37, 32, 23, 18, 9, 4],
    [45, 38, 31, 24, 17, 10, 3],
    [44, 39, 30, 25, 16, 11, 2],
    [43, 40, 29, 26, 15, 12, 1],
    [42, 41, 28, 27, 14, 13, 0],
];

/** Used for lantern retrieval **/
luster.Controller.prototype.lanternMap = {};

luster.Controller.prototype.svgIDMap = {};

/** Used for batch operations on lanterns **/
luster.Controller.prototype.lanternArray = [];

luster.Controller.prototype.SIZE_X = 6;
luster.Controller.prototype.SIZE_Y = 6;

luster.Controller.prototype.COLOR = '#000000';

luster.Controller.prototype.DRAW_MODE_INTERACTIVE = true;

/**
* Initalize lanterns on the client
*/
luster.Controller.prototype.initializeLanterns = function () {
    var controller = this;
    var x = 50;
    var y = 50;

    $.each(this.lanternInitMapping, function () {
        x = 50;
        for (var i=0; i < this.length; i++) {
            controller.addLantern(this[i], x, y, 30);
            x += 75;
        };
        y += 75;
    });
};

/** Bind all buttons and input types **/
luster.Controller.prototype.bindAll = function () {
    $('div#buttons input[name=clear]').click($.proxy(this.clearLanterns, this));
    $('div#buttons input[name=erase]').click($.proxy(this.eraseMode, this));
    this.colorPicker = $('div#colorpicker').farbtastic($.proxy(this.changeColor, this));
};

/** Create a lantern object and add it **/
luster.Controller.prototype.addLantern = function (id, xCoord, yCoord, size) {
    var lanternSVG = this.paper.circle(xCoord, yCoord, size);
    var lantern = new luster.Lantern(id, lanternSVG);

    this.svgIDMap[lanternSVG.id] = lantern;
    this.lanternArray.push(lantern);
    this.lanternMap[id] = lantern;
};

/** Clear all the lanterns **/
luster.Controller.prototype.clearLanterns = function () {
    var datagram = {
        "lights": {}

    };

    $.each(this.lanternArray, function () {
        this.svg.attr('fill', '#ffffff');
        var rgbObj = Raphael.getRGB(this.svg.attr('fill'));

        datagram["lights"][this.id] = {
            "r": 0,
            "g": 0,
            "b": 0,
            "i": 0
        }
    });

    socket.emit('draw', datagram);
};

/** Erase mode - just reset the canvas :) **/
luster.Controller.prototype.eraseMode = function () {
    this.COLOR = "#ffffff";
};

/** Callback for farbtastic, tocall whenever the color is changed **/
luster.Controller.prototype.changeColor = function (newColor) {
    this.COLOR = newColor;
};

/** Get and return the lantern object by its numerical ID **/
luster.Controller.prototype.getLanternByID = function (id) {
    return this.lanternMap[id];
};

/** Fill each of the lanterns with data from the new frame **/
luster.Controller.prototype.refresh = function (data) {
    var controller = this;

    $.each(data, function () {
        var lantern = controller.getLanternByID(this.id);
        lantern.setColor(this.r, this.g, this.b);
    });
};

/** lantern object **/
luster.Lantern = function (id, lanternSVG) {
    this.id = id;
    this.svg = lanternSVG;
    this.svg.attr('fill', '#ffffff');
    this.svg.click($.proxy(this.singleClick, this));
    this.svg.drag(this.onMove, $.proxy(this.moveStart, this), this.moveEnd, this, this, this);
    this.svg.onDragOver($.proxy(this.onDragOver, this));
};

/** Set the color of the lantern **/
luster.Lantern.prototype.setColor = function (r, g, b) {
    var value = Raphael.rgb(r, g, b);
    this.svg.attr('fill', value);
};

/** Reset a single lantern **/
luster.Lantern.prototype.reset = function () {
    this.svg.attr('fill', '#ffffff');
};

luster.Lantern.prototype.singleClick = function () {
    this.onDragOver(this.svg);
};

luster.Lantern.prototype.onMove = function () {
    return;
};

luster.Lantern.prototype.moveStart = function () {
    this.svg.attr('fill', controller.COLOR);
    this.onDragOver(this.svg);
};

luster.Lantern.prototype.moveEnd = function () {
    return;
};

luster.Lantern.prototype.onDragOver = function (draggedOverElement) {
    draggedOverElement.attr('fill', controller.COLOR);
    var lantern = controller.svgIDMap[draggedOverElement.id];
    if (lantern) {
        // Figure out RGB...
        var rgbObj = Raphael.getRGB(lantern.svg.attr('fill'));
        var datagram = {
            "lights": {}
        };

        var r = Math.floor(rgbObj.r/16);
        var g = Math.floor(rgbObj.g/16);
        var b = Math.floor(rgbObj.b/16);

        // Fully transportable.
        datagram["lights"][lantern.id] = {
            "r": Math.floor(r),
            "g": Math.floor(g),
            "b": Math.floor(b),
            "i": (r+g+b) * 5
        }
        socket.emit('draw', datagram);
    }
};

