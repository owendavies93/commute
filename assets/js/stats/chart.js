function buildBaseChart(height, width, margins, container) {
  return d3.select(container).append("svg")
          .attr("width", width + margins.left + margins.right)
          .attr("height", height + margins.top + margins.bottom)
          .append("g")
          .attr("transform", "translate(" + margins.left + "," + margins.top + ")");
}

function populateStats(container, data) {
  var times = data.map(function(d) { return d.total_time });

  var total  = data.length;
  var avg    = ss.mean(times);
  var median = timeFormatter(Math.round(ss.median(times)));
  var stddev = ss.standard_deviation(times).toFixed(2);
  var range  = ss.max(times) - ss.min(times);
  var iqr    = ss.iqr(times);
  var iqa    = timeFormatter(Math.round(ss.mean(members_of_quantile_range(times, 0.25, 0.75))));

  $('.stat-total', container).html(total);
  $('.stat-avg', container)  .html(timeFormatter(Math.round(avg)));
  $('.stat-med', container)  .html(median);
  $('.stat-sd', container)   .html(stddev + " secs");
  $('.stat-range', container).html(range + " secs");
  $('.stat-iqr', container)  .html(iqr + " secs");
  $('.stat-iqa', container)  .html(iqa);
}
