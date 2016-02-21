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
  this.manipulates = {};
};

/**
 * Sets up axes. RGB = XYZ axes.
 * @param xrange, yrange, zrange An array of [min, max] values.
 */
Wrapper.prototype.setup = function(xrange, yrange, zrange) {
  var view = this.mathbox.cartesian({
    range: [xrange, yrange, zrange],
    scale: [1, 1, 1],
    // rotation: [-Math.PI / 2, 0, Math.PI / 2]
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
};

/**
 * Creates a plot of a function z(x, y).
 * @param  {string} expr A valid js expression as a string (e.g., 'x * x + y * y' or 'Math.sin(x) +
 *     Math.cos(y)')
 */
Wrapper.prototype.plot3D = function(expr) {
  var jsExpr = new Function('emit', 'x', 'y', 'emit(x, y, ' + expr + ');');
  this.view.area({
    width: 64,
    height: 64,
    axes: [1, 2],
    expr: function (emit, x, y, i, j, time) {
      jsExpr(emit, x, y);
    },
    items: 1,
    channels: 3,
  }).surface({
    shaded: true,
    lineX: true,
    lineY: true,
    color: 0x234322,
    width: 5,
  });
};

Wrapper.prototype._newManipulatePlot3D = function(expr, manipulateVar, id) {
  var newExpr = expr.replace('[a]', ($('#' + id + '-slider').val()).toString() + '*');
  console.log('emit(x, y, ' + newExpr + ');');
  var jsExpr = new Function('emit', 'x', 'y', 'emit(x, y, ' + newExpr + ');');
  this.view.area({
    width: 64,
    height: 64,
    axes: [1, 2],
    expr: function (emit, x, y, i, j, time) {
      jsExpr(emit, x, y);
      // emit(x, y, )
    },
    items: 1,
    channels: 3,
  }).surface({
    shaded: true,
    lineX: true,
    lineY: true,
    color: 0x234322,
    width: 5,
  });
};

// Usage: w.manipulatePlot3D('[a]x + y', '[a]', 0, 2, 'id');
Wrapper.prototype.manipulatePlot3D = function(expr, manipulateVar, start, end, step, id) {
  // New manipulate
  if ($('#' + id + '-slider').length === 0) {
    var slider = $('<input>', {
      'class': 'manipulate',
      type: 'range',
      id: id + '-slider',
      min: start.toString(),
      max: end.toString(),
      step: step.toString(),
    });
    // Add manipulate to table and mark as seen
    this.manipulates[id] = {
      'expr': expr,
      'manipulateVar': manipulateVar,
      'seen': true,
    };
    console.log(this.manipulates);
    // Insert slider and plot
    $('.container').prepend(slider);
    $('.manipulate').on('change', function() {
      run();
    });
    this._newManipulatePlot3D(expr, manipulateVar, id);
  } else {
    console.log(this.manipulates);
    var slider = $('#' + id + '-slider');
    if (this.manipulates[id]['seen']) {
      // We have already seen another manipulate ealier with the same id, so
      // ignore this one
      return;
    }
    if (slider.attr('min') != start || slider.attr('max') != end
        || this.manipulates[id]['expr'] != expr
        || this.manipulates[id]['manipulateVar'] != manipulateVar) {
      slider.attr({
        min: start.toString(),
        max: end.toString(),
        step: step.toString(),
      });
      if (expr !== this.manipulates[id]['expr']) {
        this._newManipulatePlot3D(expr, manipulateVar, id);
      }
      this.manipulates[id] = {
        'expr': expr,
        'manipulateVar': manipulateVar,
        'seen': true
      };
    } else {
      this.manipulates[id]['seen'] = true;
      this._newManipulatePlot3D(expr, manipulateVar, id);
    }
  }
};

Wrapper.prototype._resetManipulateSeen = function() {
  $.each(this.manipulates, function(id, val) {
    this['seen'] = false;
  });
};

Wrapper.prototype._removeOldManipulatePlot3D = function() {
  var that = this;
  $.each(this.manipulates, function(id, val) {
    if (!this['seen']) {
      $('#' + id + '-slider').remove();
      console.log('that:');
      console.log(that);
      delete that.manipulates[id];
    }
  });
};
