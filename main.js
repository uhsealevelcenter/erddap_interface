var SELECTED_VARIABLES = ["sea_level", "time"];
var data_resolution = "daily"; //default is daily
var data_quality = "fast"; //default is fast delivery

var searchParamCollection = {
    resolution: data_resolution,
    quality: data_quality,
    variables: SELECTED_VARIABLES,
    constraints: [], //{term: "", searchString: "", S2ID: ""}
    timeRange: []
    //Todo: download file format
};

// List all select2 element IDs and all of the search parameters (term) that will be listed in the dropdown options
var searchOptions = {
    params: [
        {select2ID: "#select2Station", term: "station_name"},
        {select2ID: "#select2Country", term: "station_country"},
    ]

}
$(document).ready(function () {

    var today = new Date();

    var oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    var calendarOptions = {
        mode: "range",
        enableTime: true,
        dateFormat: "Y-m-d\\TH:i\\Z",
        defaultDate: [oneWeekAgo, today],
        // defaultHour: [12, 12],
        time_24hr: true,

        onChange: function (selectedDates, dateStr, instance) {
            // console.log("onChange selectedDates" + selectedDates[0].toISOString());
            // console.log("dateStr: " + dateStr);
        },
        onOpen:
            function (selectedDates, dateStr, instance) {
                console.log("CALENDAR OPEN");
                searchParamCollection.timeRange = [];
                selectedDates.forEach(date => searchParamCollection.timeRange.push(date.toISOString()))
            },

        onClose: function (selectedDates, dateStr, instance) {
            console.log("onClose selectedDates: ");
            selectedDates.forEach(function (value, i) {
                searchParamCollection.timeRange[i] = value.toISOString();
            });
        }
    }


    $(".flatpickr").flatpickr(calendarOptions);

    $("#target").submit(function (event) {
        console.log("BUTTON CLICKED");
        alert("Handler for .submit() called.");
        event.preventDefault();
        // $.get( "ajax/test.html", function( data ) {
        // $( ".result" ).html( data );
        // alert( "Load was performed." );
    });


    // Example query to get sea level data and time stamp for France
    //https://uhslc.soest.hawaii.edu/erddap/tabledap/global_hourly_fast.htmlTable?sea_level,time&time>=2020-03-01T00:00:00Z&time<=2020-03-30T22:59:59Z&station_country="France"

    // 1) data type hourly or daily fast || hourly or daily research quality
    // 2) returned data format (starts with a ".")
    // 3) variables returned (starts with "?" and then comma separated values)
    // 4) Constraints used (e.g. country, time etc) are separated by "&"
    // 5) for time, need to provide >= and <= ISO time range
    // 6) Country name needs to be in quotes e.g. "France", same goes for station names
    // 7) If no constrain selected ERDDAP queries ALL of them


    // Populate each dropdown element specified in searchOptions
    // searchOptions.params.forEach(element => populateDropdown(element.select2ID, element.term));

    populateAllDropdowns();

    function repopulateDropdowns() {
        var searchVariables = buildSearchVariablesString(searchOptions.params);
        //build a string of all search variables and their constraints
        var searchConstraints = buildSearchConstraintsString(searchParamCollection.constraints);
        var resolutionAndQuality = buildDataTypeString();
        var url = "https://uhslc.soest.hawaii.edu/erddap/tabledap/" + resolutionAndQuality + ".json?" + searchVariables + "&distinct()" + searchConstraints;
        console.log("URL: " + url);
        console.log("searchVariables: " + searchVariables + " s2ID: " + " searchConstraint: " + searchConstraints);
        $.getJSON(url, function (data) {
            // Get the table columns from the server and repopulate all the select2 elements
            data.table.columnNames.forEach(function (element, counter) {
                searchOptions.params.forEach(function (param, i) {
                    if (element === param.term) {
                        $(param.select2ID).select2({
                            placeholder: {
                                id: '-1', // the value of the option
                                text: 'Search ...',
                            },
                            allowClear: true,
                            tags: false,
                            tokenSeparators: [',', ' '],
                            data: transformJSONtoSelect2(data, param.term).results,
                        });
                        // Reselect the element we searched for
                        searchParamCollection.constraints.forEach(function (_param, j) {
                            var matchObject = transformJSONtoSelect2(data, param.term).results.find(o => o.text === _param.searchString.substring(1, _param.searchString.length - 1));
                            if (matchObject != undefined) {
                                $(param.select2ID).val(matchObject.id).trigger('change');
                            }

                        });
                    }

                });
            });
        })
    }


    // TODO: will need to include data type (daily/hourly), returned data type, and data quality (fast or research)
    // based on the user selection in the checkmark and/or toggle group
    function populateAllDropdowns() {
        // build a string of all search variables
        var stringBuildSP = buildSearchVariablesString(searchOptions.params);
        var resolutionAndQuality = buildDataTypeString();

        // console.log("stringBuildSP "+stringBuildSP);
        $.getJSON("https://uhslc.soest.hawaii.edu/erddap/tabledap/" + resolutionAndQuality + ".json?" + stringBuildSP + "&distinct()", function (data) {
            var tempJson = {"results": [{"id": -1, "text": ""}]};

            searchOptions.params.forEach(function (param, j) {
                data.table.rows.forEach(function (value, i) {
                    // console.log("param.term "+param.term);
                    // Find the column index of the search parameter and add it json
                    // and do not duplicate data
                    const found = tempJson.results.some(el => el.text === value[data.table.columnNames.indexOf(param.term)]);
                    if (!found)
                        tempJson.results.push({"id": i, "text": value[data.table.columnNames.indexOf(param.term)]})
                });

                $(param.select2ID).select2({
                    placeholder: {
                        id: '-1', // the value of the option
                        text: 'Search for ' + param.term,
                    },
                    allowClear: true,
                    tags: false,
                    tokenSeparators: [',', ' '],
                    data: tempJson.results,
                });

                // Add on:select listener to each dropdown
                $(param.select2ID).on('select2:select', function (e) {
                    var data = e.params.data;
                    var id = data.id;
                    var selectedString = "\"" + data.text + "\"";
                    //Clear the dropdown options of the other select2 boxes that were not selected
                    searchOptions.params.forEach(function (_param, i) {
                        $(_param.select2ID).html('').select2({data: [{id: '', text: ''}]});
                    });

                    searchParamCollection.constraints.push({
                        term: param.term,
                        searchString: selectedString,
                        S2ID: param.select2ID
                    });

                    // repopulate the boxes with the constraints from the previous step
                    repopulateDropdowns();

                });

                // Add on:unselect listener to each dropdown to clear the string
                $(param.select2ID).on('select2:unselect', function (e) {
                    searchParamCollection.constraints.forEach(function (_param, i) {
                        if (param.term === _param.term) {
                            searchParamCollection.constraints.splice(i, 1);
                        }
                    });

                    // repopulate the boxes with the constraints from the previous step
                    repopulateDropdowns();
                });

                tempJson = {"results": [{"id": -1, "text": ""}]};
            });


        })
            .fail(function (jqXHR, textStatus, errorThrown) {
                alert('Failed to retrieve data! ' + textStatus);

            })
            .always(function () {
                // request ended
            });
    }

});

// Only happens ones
function buildSearchVariablesString(collection) {
    var stringBuild = "";
    var separator = [',', ''];
    collection.forEach(function (param, i) {
        if (i == searchOptions.params.length - 1)
            stringBuild += param.term + separator[1];
        else
            stringBuild += param.term + separator[0];
    });
    return stringBuild;
}

// Changes depending on user input
function buildSearchConstraintsString(collection) {
    var stringBuild = "";
    var separator = ['&', ''];
    collection.forEach(function (param, i) {
        stringBuild += separator[0] + param.term + "=" + param.searchString + separator[1];
    });
    return stringBuild;
}

// Returns data resolution and quality ERDDAP API compatible string
function buildDataTypeString() {
    return "global_" + searchParamCollection.resolution + "_" + searchParamCollection.quality;
}

function updateUIURL(_data_resolution, _data_quality, _variablesArr, _searchParamsArr) {
    searchParamCollection = {
        resolution: _data_resolution,
        quality: _data_quality,
        variables: _variablesArr,
        constraints: _searchParamsArr
        //Todo: download file format
    };
    // console.log(_data_resolution + _data_quality +)
}

function ValidateVariableSelection() {
    SELECTED_VARIABLES = ["sea_level", "time"];
    var checkboxes = document.getElementsByName("variable");
    var numberOfCheckedItems = 0;
    for (var i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) {
            numberOfCheckedItems++;
            SELECTED_VARIABLES.push(checkboxes[i].getAttribute("value"))
        }
    }
    searchParamCollection.variables = SELECTED_VARIABLES;
}

function ValidateResolutionSelection() {
    var resolution = document.getElementsByName("resolution");
    for (var i = 0; i < resolution.length; i++) {
        if (resolution[i].checked) {
            data_resolution = resolution[i].getAttribute("value")
        }
    }
    searchParamCollection.resolution = data_resolution;
}

function ValidateQualitySelection() {
    var quality = document.getElementsByName("quality");
    for (var i = 0; i < quality.length; i++) {
        if (quality[i].checked) {
            data_quality = quality[i].getAttribute("value")
        }
    }
    searchParamCollection.quality = data_quality;
}

function transformJSONtoSelect2(jsonData, column) {
    var tempJson = {"results": [{"id": -1, "text": ""}]};

    jsonData.table.rows.forEach(function (value, i) {
        const found = tempJson.results.some(el => el.text === value[jsonData.table.columnNames.indexOf(column)]);
        if (!found)
            tempJson.results.push({"id": i, "text": value[jsonData.table.columnNames.indexOf(column)]})
    });
    return tempJson;
}

function buildTimeRangeString() {
    var dateRange = "";

    searchParamCollection.timeRange.forEach(function (value, i) {
        if (i == 0)
            dateRange += "&time>=" + value;
        else
            dateRange += "&time<=" + value;
    });
    return dateRange;
}

function assembleDownloadLink() {
    var mainURL = "https://uhslc.soest.hawaii.edu/erddap/tabledap/";
    var dataFormat = $("#fileFormat :selected").text().split("-")[0].trim();
    console.log("DATA FORMAT: "+dataFormat);
    var searchVariables = "";
    var separator = [',', ''];
    searchParamCollection.variables.forEach(function (param, i) {
        if (i == searchParamCollection.variables.length - 1)
            searchVariables += param + separator[1];
        else
            searchVariables += param + separator[0];
    });
    var searchConstraints = buildSearchConstraintsString(searchParamCollection.constraints);
    var timeRangeString = buildTimeRangeString();
    var finalURL = mainURL + buildDataTypeString() + dataFormat + "?" + searchVariables + timeRangeString + searchConstraints + "&distinct()";

    return finalURL;
}

function pad(num, size) {
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}

function downloadData() {
    var uri = assembleDownloadLink();

    $.ajax({
        url: uri,
        // data: data,
        success: success,
        // dataType: 'json',
        method: "GET"
    });

    function success(data) {
        // console.log("DATA: " + data);
        // console.log("DATA.URL: " + data.url);
        var iframe = document.createElement("iframe");
        iframe.setAttribute("src", uri);
        iframe.setAttribute("style", "display: none");
        document.body.appendChild(iframe);
        // document.body.removeChild(iframe);
    }

    // $.get(uri, function(data, status){
    //   // alert("Data: " + data + "\nStatus: " + status);
    //     console.log("DATA: "+data);
    // });
}

function percentEncode(s) {
    var s2 = "";
    for (var i = 0; i < s.length; i++) {
        var ch = s.charAt(i);
        if (ch == "\xA0") s2 += "%20";
        else s2 += encodeURIComponent(ch);
    }
    return s2;
}


