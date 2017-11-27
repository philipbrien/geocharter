// Script to generate a Google Geochart from user-inputted data.

function create_table() {
    var data = $.fn.jexcel('helper', { action:'createEmptyData', cols:2, rows:10 });
    $('#data_entry').jexcel({
        data:data,
        colHeaders: ["Country/Region", "Value"],
        colWidths: [200, 100],
        columns: [
            { type: "text" },
            { type: "numeric" },
        ]
    });
}

function create_embed_code(data, lowbound, highbound, region, resolution) {
    // Yes, ideally we would use a template string with backticks here.
    // Unfortunately, older versions of IE don't like it...
    var template = '<script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>' +
'<script>' +
'    function draw_map() {' +
'        var map_data = google.visualization.arrayToDataTable(' + JSON.stringify(data) + ');' +
'        var options = {' +
'                       colorAxis: {' +
'                            colors: ["PaleGreen", "DarkGreen"],' +
'                            minValue: ' + lowbound + ',' +
'                            maxValue: ' + highbound +
'                        },' +
'                       region: "' + region + '",' +
'                       resolution: "' + resolution +'",' +
'                       displayMode: "regions",' +
'                      };' +
'        var chart = new google.visualization.GeoChart(document.getElementById("mapgen_google_chart"));' +
'        chart.draw(map_data, options);' +
'    }' +
'    google.charts.load("current", {"packages":["geochart"]});' +
'    google.charts.setOnLoadCallback(draw_map);' +
'</script>' +
'<div id="mapgen_google_chart"></div>';
    return template;
}

function draw_map() {
    var raw_data = $('#data_entry').jexcel('getData', false);
    var units = document.getElementById("units").value;
    if (units == "") {
        units = "Value";
    }
    raw_data.unshift(["Country/Region", units]);
    
    // Remove all the empty rows from the end of the table.
    while (raw_data[raw_data.length - 1][0] == "") {
        raw_data.pop();
    }
    
    // Convert the values to numbers, if possible.  Extract the min and max.
    var ii;
    var minval = Infinity;
    var maxval = 0;
    for (ii = 1; ii < raw_data.length; ii++) {
        // Strip commas and whitespace from this potential number.
        var cellval = raw_data[ii][1];
        cellval = cellval.replace(/[,\s]/g, "");
        if (Number(cellval) != NaN) {
            raw_data[ii][1] = Number(cellval);
            if (raw_data[ii][1] < minval) {
                minval = raw_data[ii][1];
            }
            if (raw_data[ii][1] > maxval) {
                maxval = raw_data[ii][1];
            }
        }
    }
    
    // Round the min and max values to the nearest nice values.
    var lowbound = Math.floor(minval/10.0) * 10;
    var highbound = Math.ceil(maxval/10.0) * 10;
    
    var map_data = google.visualization.arrayToDataTable(raw_data);
    var options = {
                    colorAxis: {
                        colors: ["PaleGreen", "DarkGreen"],
                        minValue: lowbound,
                        maxValue: highbound
                    },
                   region: document.getElementById("map_region").value,
                   resolution: document.getElementById("country_region").value,
                   displayMode: "regions",
                  };

    var chart = new google.visualization.GeoChart(document.getElementById('gmap'));
    google.visualization.events.addListener(chart, 'ready', function (){
        document.getElementById("printable_chart_data").src = chart.getImageURI();
    });
    chart.draw(map_data, options);
    
    // Create the code to embed this map, both interactively and as an image.
    var embed_code = create_embed_code(raw_data,
                                       lowbound, 
                                       highbound, 
                                       document.getElementById("map_region").value, 
                                       document.getElementById("country_region").value);
    google.visualization.events.addListener(chart, 'ready', function (){
        document.getElementById("embed_image").innerHTML = "<img src=\"" + 
            chart.getImageURI() + "\">";
    });
    document.getElementById("embed_interactive").innerHTML = embed_code;
}

function create_map() {
    google.charts.load('current', {'packages':['geochart']});
    google.charts.setOnLoadCallback(draw_map);
    document.getElementById("map_container").style.display = "inline";
}