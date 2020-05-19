$(document).ready(() => {
    
    // SVG with margin convention

    var margin = {top: 20, right: 10, bottom: 30, left: 30};

    var width = 960 - margin.left - margin.right,
        height = 700 - margin.top - margin.bottom;

    var svg = d3.select(".chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    // Time and Color Scale

    var x = d3.scaleTime()
        .domain([new Date(2014, 3, 1), new Date(2019, 2, 1)])
        .range([0, width]);

    var lineColorScale = d3.scaleOrdinal()
        .domain([0,9])
        .range(d3.schemeCategory10);

    // Initial displayed models
    
    var disp_models = [2,15];

    d3.json("data.json").then((data) => {
        d3.json("full.json").then((full) => {

            // parse the dates in full.json

            full.forEach(element => {
                element[0] = dateParser(element[0].slice(0,10));
            });

            // Main update function

            function updateChart(d) {

                // Prepare data for display

                var used_data_array = [];

                d.forEach(element => {used_data_array.push(data[element]);});

                // X-scale

                var xScale = d3.scaleLinear()
                    .domain([0, used_data_array[0].length-1])
                    .range([0, width]);
                
                // Find min and max of all y-values to be displayed
                
                var flat = Array.prototype.concat.apply([], used_data_array);
                var superflat =  Array.prototype.concat.apply([], flat);

                // Y-scale

                var yScale = d3.scaleLinear()
                    .domain([d3.min(superflat)*.9,d3.max(superflat)*1.1])
                    .range([height,0]);
                
                // Generator functions for areas of confidence intervals and mean lines
                
                var areaGenerator = d3.area()
                    .x((d, i) => {return xScale(i);})
                    .y0((d) => {return yScale(d[1]);})
                    .y1((d) => {return yScale(d[2]);})
                    .curve(d3.curveMonotoneX);

                var lineGenerator = d3.line()
                    .x((d, i) => {return xScale(i);})
                    .y((d) => {return yScale(d[0]);})
                    .curve(d3.curveMonotoneX);
                
                // Append areas of confidence intervals

                var areas = svg.selectAll(".cis")
                    .data(used_data_array);
                
                areas.exit().remove();
                
                areas.enter()
                    .append("path")
                    .merge(areas)
                    .attr("class","cis")
                    .attr('fill', (d,i) => {return lineColorScale(i);})
                    .attr("stroke", "none")
                    .attr("fill-opacity", ".05")
                    .attr("d", (d) => {return areaGenerator(d);});
                
                // Append lines of mean values
                
                var lines = svg.selectAll(".line")
                    .data(used_data_array);
                
                lines.exit().remove();
                
                lines.enter()
                    .append("path")
                    .merge(lines)
                    .attr("class", "line")
                    .attr("fill", "none")
                    .attr("stroke", (d,i) => {return lineColorScale(i);})
                    .attr("stroke-width", 1.5)
                    .attr("d", (d) => { return lineGenerator(d);});

                // Axis calls

                svg.call(d3.axisLeft(yScale));
                
                svg.append("g")
                    .attr("transform", "translate(0," + height + ")")
                    .call(d3.axisBottom(x));
            
                };
            
            // Brush call
            
            const brush = d3.brushX()
                .extent([[0,0], [width,height]])
                .on("end", () => {

                    var br_select = d3.brushSelection(d3.select(".brush").node());

                    if (br_select) {
                        var start_date = x.invert(d3.brushSelection(d3.select(".brush").node())[0]);
                        var end_date = x.invert(d3.brushSelection(d3.select(".brush").node())[1]);
                        // console.log(d3.timeFormat("%d.%m.%Y")(start_date));
                        // console.log(d3.timeFormat("%d.%m.%Y")(end_date));

                        date_table = DateFilter(table,[start_date,end_date]);
                        MakeTable(date_table, disp_models.map(x => x +1));
                    } else {
                        MakeTable(table, disp_models.map(x => x +1));
                    };
                });

            svg.append("g")
                .attr("class", "brush")
                .call(brush);

            // Append checkboxes and labels

            for (i = 0; i < data.length; i++) {
                var checkBox = $('<input type="checkbox" name="' + i +'" id="'+i+'"/>');
                checkBox.appendTo('#input_div');
                $('#input_div').append('<label id= label'+i+' for="'+ i + '">' + (i+1) + '</label>');
            };

            // Check initial displayed topics checkbox and set label color;

            var test_arr = disp_models;

            test_arr.forEach((element) => {
                $("#"+ element).prop('checked', true);
                $("#label"+ element).css('background-color', lineColorScale(test_arr.indexOf(element)));
                });
            
            // Manage input and behavior of checkboxes

            $(':checkbox').click((e)=> {
                var item = parseInt(e.target.id);
                if (test_arr.includes(item)) {
                    if (test_arr.length > 1) {
                        test_arr.splice(test_arr.indexOf(item),1);
                        $("#label"+ item).css('background-color', 'white');
                        updateChart(test_arr);

                        var brush_selection = d3.brushSelection(d3.select(".brush").node());
                        table = TopicFilter(full, test_arr.map(x => x +1));

                        if (brush_selection) {
                            let start_date = x.invert(brush_selection[0]);
                            let end_date = x.invert(brush_selection[1]);
                            var temp_table = DateFilter(table, [start_date,end_date]);
                            MakeTable(temp_table, test_arr.map(x => x +1));
                        } else {   
                            MakeTable(table, test_arr.map(x => x +1));
                            console.log("hier");
                        };

                        // Update table with new topics and existing date filter

                    } else {
                        e.target.checked = true;
                    };
                } else {
                    test_arr.push(item);
                    updateChart(test_arr);

                    var brush_selection = d3.brushSelection(d3.select(".brush").node());
                    table = TopicFilter(full, test_arr.map(x => x +1));

                    if (brush_selection) {
                        let start_date = x.invert(brush_selection[0]);
                        let end_date = x.invert(brush_selection[1]);
                        var temp_table = DateFilter(table, [start_date,end_date]);
                        MakeTable(temp_table, test_arr.map(x => x +1));
                    } else {   
                        MakeTable(table, test_arr.map(x => x +1));
                    };


                    // Update table with new topics and existing date filter

                    };
                
                // Update label colors
                
                test_arr.forEach((element) => {
                    $("#label"+ element).css('background-color', lineColorScale(test_arr.indexOf(element)));
                    });

                });
            
            // Initial update function call
            
            updateChart(disp_models);

            // Update table with disp_models topic filter and no date filter

            var table = TopicFilter(full, disp_models.map(x => x +1));
            MakeTable(table, disp_models.map(x => x +1));

        });
                    
        });
    
    // Function definitions:

    // This function computes the harmonic mean of all items in input_array
    // It is called by TopicFilter
    function HarmonicMean(input_array) {
        let frac_sum = 0;
        for (let i = 0; i < input_array.length; i++) {
            frac_sum += 1/input_array[i];
        };
        return input_array.length/frac_sum;
    };

    // Date parser
    // var dateParser = d3.timeParse("%Y-%m-%d %H:%M:%S"); 
    var dateParser = d3.timeParse("%Y-%m-%d"); 

    // Date filter filters by dates
    function DateFilter (d,date_arr) {
        let data = d;
        data = data.filter(a => a[0] >= date_arr[0] && a[0] <= date_arr[1]);
        return data;
    };

    // Topic filter returns an array of arrays filter by topics 
    // Example Topicfilter(full,[3,16]) returns documents from topics 3 and 16
    // If 2 or more topics are given, TopicFilter calculates the HM 
    // and appends it to each document array

    function TopicFilter(d,arr) {
        arr.forEach(element => {d = d.filter(a => a[element+2]> .1);});
        var data_filtered = [];
    
        if (arr.length == 1) {
            
            d.forEach(element => {
                let top = element[arr[0]+2];
                let head = element.slice(0,3);
                head.push(top);
                data_filtered.push(head);
            });
    
        } else {
    
            d.forEach(element => {
                let head = (element.slice(0,3));
                let top = element.filter(item => arr.includes(element.indexOf(item)-2));
                let hm = HarmonicMean(top);
    
                head = head.concat(top);
                head.push(hm);
                data_filtered.push(head);
            });
    
        };
        return data_filtered;
    };

    // Make the Table from filtered data

    function MakeTable(d,topic_arr) {

        if (d.length == 0) {

            $('#tab').html("<p>No documents match your filter.</p>");

        } else {

            var topic_arr_ordered = topic_arr.sort(d3.ascending);
            var number_of_cols = d[0].length;
            var formatTime = d3.timeFormat("%d.%m.%Y");

            // Make Table Head

            var init_th = '<table id="myTable" class="tablesorter"><thead><tr><th>Title</th><th class="sorter-shortDate dateFormat-ddmmyyyy">Date of Publication</th>';
            
            if (number_of_cols == 4) {
                var rest_th = '<th>Topic ' + topic_arr_ordered[0] + '</th></tr></thead>'
            } else {
                var rest_th = '';
                for (let i = 3; i < number_of_cols; i++){
                    if (i < number_of_cols-1) {
                        rest_th += '<th>Topic ' + topic_arr_ordered[i-3] + '</th>';
                    } else {
                        rest_th += '<th>Harmonic Mean</th></tr></thead>';
                    };
                };
            };

            var th = init_th + rest_th;
            
            // Make table body

            var tb = '<tbody>'
            d.forEach(element => {
                tb += '<tr>';
                tb += '<td><a href="' + element[1] + '">' + element[2] + '</a></td>';
                tb += '<td>' + formatTime(element[0]) + '</td>';
                for (i = 3; i < number_of_cols; i++) {
                    tb += '<td>' + element[i] + '</td>';
                };
                tb += '</tr>';
            });
            tb += '</tbody></table>'

            var full_table = th + tb;

            $('#tab').html(full_table);
            
            $(() => {
                $("#myTable").tablesorter();
            });

        };
    };

    });
