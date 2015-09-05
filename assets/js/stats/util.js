function members_of_quantile_range(arr, x, y) {
  var l = ss.quantile(arr, x);
  var u = ss.quantile(arr, y);

  var res = [];
  for (var i = 0; i < arr.length; i++) {
    var m = arr[i];
    if (m >= l && m <= u) {
      res.push(m);
    }
  }
  return res;
}

function leastSquares(xs, ys) {
  var xBar = ss.mean(xs);
  var yBar = ss.mean(ys);

  var ssXX = ss.sum(xs.map(function(d) {
    return Math.pow(d - xBar, 2);
  }));

  var ssYY = ss.sum(ys.map(function(d) {
    return Math.pow(d - yBar, 2);
  }));

  var ssXY = ss.sum(xs.map(function(d, i) {
    return (d - xBar) * (ys[i] - yBar);
  }));

  var slope = ssXY / ssXX;
  var intercept = yBar - (xBar * slope);
  var rSquare = Math.pow(ssXY, 2) / (ssXX * ssYY);

  return [slope, intercept, Math.round(rSquare * 1000) / 1000];
}

function minimiseTotal(targetTime, startTimeFunc, endTimeFunc, startRange, endRange) {
  var result = Number.MAX_VALUE;
  var data = {};

  for (var start = startRange.min; start <= startRange.max; start++) {
    var end = start + targetTime;

    if (end < endRange.min || end > endRange.max) continue;

    var startTime = startTimeFunc(start);
    var endTime   = endTimeFunc(end);

    if (startTime + endTime < result) {
      result = startTime + endTime;
      data = [start, startTime, end, endTime];
    }
  }

  return [result, [data]];
}
