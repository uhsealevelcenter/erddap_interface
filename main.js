var SELECTED_VARIABLES = [];

$(document).ready(function () {

    var calendarOptions = {
        mode: "range",
        enableTime: true,
        dateFormat: "Y-m-d\\TH:i\\Z",
        time_24hr: true,

        onChange: function (selectedDates, dateStr, instance) {
            console.log("dateStr: " + dateStr);
        },

        onClose: function (selectedDates, dateStr, instance) {
            console.log("onClose " + selectedDates)
        }
    }

    // List all select2 element IDs and all of the search parameters (term) that will be listed in the dropdown options
    var searchOptions = {
        params: [
            {select2ID: "#select2Station", term: "station_name"},
            {select2ID: "#select2Country", term: "station_country"},
        ]

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

    $('#select2Country').on('select2:select', function (e) {
        var data = e.params.data;
        var id = data.id;
        console.log("Country selected " + data + " " + data.text);
        callERDDAP("station_country=\"" + data.text + "\"");
    });

    function callERDDAP(url) {
        $.getJSON("https://uhslc.soest.hawaii.edu/erddap/tabledap/global_hourly_fast.json?station_country&distinct()&" + url, function (data) {
            $("#select2Country").select2({
                placeholder: {
                    id: '-1', // the value of the option
                    text: 'Search ...',
                },
                allowClear: true,
                tags: false,
                tokenSeparators: [',', ' '],
                data: transformJSONtoSelect2(data).results,
            });
        })
    }



    // function populateDropdown(dropdownID, searchParam) {
    //     // build a string of all search parameters
    //     var stringBuildSP = "";
    //     $.getJSON("https://uhslc.soest.hawaii.edu/erddap/tabledap/global_hourly_fast.json?" + searchParam + "&distinct()", function (data) {
    //         $(dropdownID).select2({
    //             placeholder: {
    //                 id: '-1', // the value of the option
    //                 text: 'Search for ' + searchParam,
    //             },
    //             allowClear: true,
    //             tags: false,
    //             tokenSeparators: [',', ' '],
    //             data: transformJSONtoSelect2(data).results,
    //         });
    //     })
    //         .fail(function (jqXHR, textStatus, errorThrown) {
    //             alert('Failed to retrieve stations list! ' + textStatus);
    //
    //         })
    //         .always(function () {
    //             // request ended
    //         });
    // }

    // TODO: will need to include data type (daily/hourly), returned data type, and data quality (fast or research)
    // based on the user selection in the checkmark and/or toggle group

    function populateAllDropdowns() {
        // build a string of all search parameters
        var stringBuildSP = "";
        var separator = [',',''];
        searchOptions.params.forEach(function (param, i) {
            if(i==searchOptions.params.length-1)
                stringBuildSP+=param.term+separator[1];
            else
                stringBuildSP+=param.term+separator[0];
        });
        // console.log("stringBuildSP "+stringBuildSP);
        $.getJSON("https://uhslc.soest.hawaii.edu/erddap/tabledap/global_hourly_fast.json?" + stringBuildSP + "&distinct()", function (data) {
            var tempJson = {"results": [{"id": -1, "text": ""}]};

            searchOptions.params.forEach(function (param, j) {
                data.table.rows.forEach(function (value, i) {
                    // console.log("param.term "+param.term);
                    // Find the column index of the search parameter and add it json
                    // and do not duplicate data
                    const found = tempJson.results.some(el => el.text === value[data.table.columnNames.indexOf(param.term)]);
                    if(!found)
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

function buildDownLoadURL(){

}

function ValidateVariableSelection() {
    SELECTED_VARIABLES = [];
    var checkboxes = document.getElementsByName("variable");
    var numberOfCheckedItems = 0;
    for (var i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) {
            numberOfCheckedItems++;
            SELECTED_VARIABLES.push(checkboxes[i].getAttribute("value"))
        }

    }
}

function transformJSONtoSelect2(jsonData, /*station*/) {
    var tempJson = {"results": [{"id": -1, "text": ""}]};

    // if (station)
    //     jsonData.table.rows.forEach(element => tempJson.results.push({
    //         "id": pad(element[0], 3),
    //         "text": pad(element[0], 3) + " " + element[1]
    //     }));
    // else {
    jsonData.table.rows.forEach(function (value, i) {
        tempJson.results.push({"id": i, "text": value[0]})
    });
    // }

    return tempJson;
}

function updateSelect2Options() {

}

function pad(num, size) {
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}

function downloadData(uri) {

    $.ajax({
        url: uri,
        // data: data,
        success: success,
        // dataType: 'json',
        method: "GET"
    });
    console.log("CALL THIS URI: " + uri);

    function success(data) {
        console.log("DATA: " + data);
        console.log("DATA.URL: " + data.url);
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


