/**
 * Wrapper for RiftPlot live editor.
 * Takes simpler syntax and produces a MathBox code.
 *
 * @author: chrisf1337 (Chris Fu)
 */

/**
 * Plotting wrapper around mathbox. Assumes that the scene is empty and the camera is positioned
 * properly.
 */
var Wrapper = function(mathbox) {
  this.mathbox = mathbox;
  this.view = null;
}

/**
 * Sets up axes. RGB = XYZ axes.
 * @param xrange, yrange, zrange An array of [min, max] values.
 */
Wrapper.prototype.setup = function(xrange, yrange, zrange) {
  var view = this.mathbox.cartesian({
    range: [xrange, yrange, zrange],
    scale: [1, 1, 1],
    rotation: [-Math.PI / 2, 0, Math.PI / 2]
  });
  view.axis({
    axis: 1,
    color: 'red'
  }).axis({
    axis: 2,
    color: 'green'
  }).axis({
    axis: 3,
    color: 'blue'
  });
  this.view = view;
}

/**
 * Creates a plot of a function z(x, y).
 * @param  {string} expr A valid js expression as a string (e.g., 'x * x + y * y' or 'Math.sin(x) +
 *     Math.cos(y)')
 */
Wrapper.prototype.plot3D = function(expr) {
  this.setup();
  var jsExpr = new Function('emit', 'x', 'y', 'emit(x, y, ' + expr + ');');
  var sampler = this.view.area({
    width: 64,
    height: 64,
    axes: [1, 2],
    expr: function (emit, x, y, i, j, time) {
      jsExpr(emit, x, y);
    },
    items: 1,
    channels: 3,
  });
  this.view.surface({
    shaded: true,
    lineX: true,
    lineY: true,
    points: sampler,
    color: 0x234322,
    width: 5,
  });
};
