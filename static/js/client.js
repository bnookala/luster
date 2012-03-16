$(window).load(function () {
    socket = io.connect('http://127.0.0.1:1337');
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
                [42, 43, 44, 45, 46, 47, 48], /** 47, 47 **/
                [41, 40, 39, 38, 37, 36, 35],
                [28, 29, 30, 31, 32, 33, 34],
                [27, 26, 25, 24, 23, 22, 21],
                [14, 15, 16, 17, 18, 19, 20],
                [13, 12, 11, 10, 9, 8, 7],
    /** 0,0 **/ [0, 1, 2, 3, 4, 5, 6]
];

/**
* 'XY' ordered
*/
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
    $('div#buttons input[name=reset]').click($.proxy(this.resetLanterns, this));
    $('div#buttons input[name=stop]').click($.proxy(this.stopStream, this));
    $('div#buttons input[name=start]').click($.proxy(this.startStream, this));
    $('div#buttons input[name=draw]').click($.proxy(this.drawCurrentFrame, this));
    this.colorPicker = $('div#colorpicker').farbtastic($.proxy(this.changeColor, this));
};

/** Create a lantern object and add it **/
luster.Controller.prototype.addLantern = function (id, xCoord, yCoord, size) {
    var lanternSVG = this.paper.circle(xCoord, yCoord, size);
    var labelSVG = this.paper.text(xCoord, yCoord, id);
    var lantern = new luster.Lantern(id, lanternSVG, labelSVG);

    this.svgIDMap[lanternSVG.id] = lantern;
    this.lanternArray.push(lantern);
    this.lanternMap[id] = lantern;
};

/** Clear all the lanterns **/
luster.Controller.prototype.clearLanterns = function () {
    $.each(this.lanternArray, function () {
        this.svg.attr('fill', '#ffffff');
    });
};

/** Stop the stream AND clear the lanterns **/
luster.Controller.prototype.resetLanterns = function () {
    this.stopStream();
    this.clearLanterns();
};

/** Stop the stream of data **/
luster.Controller.prototype.stopStream = function () {
    socket.emit('stop-test', {});
};

/** Start the stream of data **/
luster.Controller.prototype.startStream = function () {
    socket.emit('start-test', {});
};

luster.Controller.prototype.drawCurrentFrame = function () {
    // Hex to rgb values, and then have to emit a 'draw-frame' event
    var datagram = {"lights": {}};
    var controller = this;

    $.each(this.lanternArray, function () {
        var rgbObj = Raphael.getRGB(this.svg.attr('fill'));
        datagram['lights'][this.id] = {
            'r': rgbObj.r,
            'g': rgbObj.g,
            'b': rgbObj.b
        };
    });

    socket.emit('draw-frame', datagram);
};

/** Callback for farbtastic, tocall whenever the color is changed **/
luster.Controller.prototype.changeColor = function (newColor) {
    this.COLOR = newColor;
};

/** Get and return the lantern object by its XY coordinate **/
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

/** Fill each of the lanterns with data from the new frame **/
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
    this.svg.attr('fill', '#ffffff');
    this.svg.click(this.pickColor);
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

luster.Lantern.prototype.onMove = function () {
    return;
};

luster.Lantern.prototype.moveStart = function () {
    this.svg.attr('fill', controller.COLOR);
    return;
};

luster.Lantern.prototype.moveEnd = function () {
    return;
};

luster.Lantern.prototype.onDragOver = function (draggedOverElement) {
    draggedOverElement.attr('fill', controller.COLOR);
    // If interactive draw mode is on, show changes as they're being drawn
    if (controller.DRAW_MODE_INTERACTIVE) {
        var lantern = controller.svgIDMap[draggedOverElement.id];
        if (lantern) {
            // Figure out RGB...
            var rgbObj = Raphael.getRGB(lantern.svg.attr('fill'));
            var datagram = {
                "lights": {}
            };

            // Fully transportable.
            datagram["lights"][lantern.id] = {
                "r": rgbObj.r,
                "g": rgbObj.g,
                "b": rgbObj.b,
            }
            socket.emit('draw-partial', datagram);
        }
    }
};

