$(document).ready(function() {
  var big_margins   = { top: 40, right: 30, bottom: 70, left: 60 };
  var small_margins = { top: 20, right: 15, bottom: 30, left: 60 };
  var width         = 850 - big_margins.left - big_margins.right;
  var height        = 500 - big_margins.top - big_margins.bottom;

  var bidir_svg    = buildBarChart(height, width, big_margins, "#bidir-graph-cont");
  var inbound_svg  = buildBarChart((3 * height) / 4, width / 2 + 50, small_margins, "#inbound-graph-cont");
  var outbound_svg = buildBarChart((3 * height) / 4, width / 2 + 50, small_margins, "#outbound-graph-cont");

  var i_scatter_svg = buildScatterChart((3 * height) / 4, width / 2 + 50, small_margins, "#inbound-scatter-cont");
  var o_scatter_svg = buildScatterChart((3 * height) / 4, width / 2 + 50, small_margins, "#outbound-scatter-cont");
  var i_i_scatter_svg = buildScatterChart((3 * height) / 4, width / 2 + 50, small_margins, "#inbound-inter-scatter-cont");
  var o_i_scatter_svg = buildScatterChart((3 * height) / 4, width / 2 + 50, small_margins, "#outbound-inter-scatter-cont");
  var b_scatter_svg = buildScatterChart(height, width, big_margins, "#big-scatter-cont");

  d3.json('/commute/commutes/all', function(error, data) {
    if (error) throw error;

    var min = Number.MAX_VALUE;
    var max = 0;
    data.forEach(function(d) {
      d.date       = parseDate(d.date);
      d.total_time = +d.total_time;
      d.intermediate_time = +d.intermediate_time;

      d.start_date = new Date(d.start_time);
      d.start_time = (d.start_date.getTime() - d.start_date.setHours(0, 0, 0, 0)) / 1000 ;

      if (d.total_time < min) {
        min = d.total_time;
      } else if (d.total_time > max) {
        max = d.total_time;
      }
    });

    populateBarChart(bidir_svg, data, height, width, min, max);
    populateStats($(".stats-summary"), data);

    var inbound = data.filter(function(v) {
      return v.direction === 'in';
    });
    populateBarChart(inbound_svg, inbound, (3 * height) / 4, width / 2 + 50, min, max);
    populateStats($(".inbound-stats"), inbound);

    var outbound = data.filter(function(v) {
      return v.direction === 'out';
    });
    populateBarChart(outbound_svg, outbound, (3 * height) / 4, width / 2 + 50, min, max);
    populateStats($(".outbound-stats"), outbound);

    populateScatterChart(i_scatter_svg, inbound, (3 * height) / 4, width / 2 + 50, min, max);
    populateScatterChart(o_scatter_svg, outbound, (3 * height) / 4, width / 2 + 50, min, max);
    populateRelationChart(b_scatter_svg, data, height, width, min, max);

    var inboundIntermediate = inbound.filter(function(v) {
      return v.fuel_stop_id === null && v.intermediate_time > 0;
    });

    var outboundIntermediate = outbound.filter(function(v) {
      return v.fuel_stop_id === null && v.intermediate_time > 0;
    });

    populateIScatterChart(i_i_scatter_svg, inboundIntermediate, (3 * height) / 4, width / 2 + 50);
    populateIScatterChart(o_i_scatter_svg, outboundIntermediate, (3 * height) / 4, width / 2 + 50);
  });
});
