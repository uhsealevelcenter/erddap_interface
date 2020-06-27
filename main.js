
$(document).ready(function () {

    var calendarOptions = {
        mode: "range",
        enableTime: true,
        dateFormat: "Y-m-d\\TH:i",
        time_24hr: true
    }

    $(".flatpickr").flatpickr(calendarOptions);

    $( "#target" ).submit(function( event ) {
        console.log("BUTTON CLICKED");
        alert( "Handler for .submit() called." );
        event.preventDefault();
        // $.get( "ajax/test.html", function( data ) {
        // $( ".result" ).html( data );
        // alert( "Load was performed." );
    });

    // Populate Station uhslc id and station name dropdown
    $.getJSON("https://uhslc.soest.hawaii.edu/erddap/tabledap/global_hourly_fast.json?uhslc_id,station_name&distinct()", function(data) {
        $("#select2Station").select2({
            placeholder: {
                // id: '2', // the value of the option
                text: 'Search for a station...',
            },
            tags: false,
            tokenSeparators: [',', ' '],
            data: transformJSONtoSelect2(data, true).results,
        });
    })
        .fail(function(jqXHR, textStatus, errorThrown) {
            alert('Failed to retrieve stations list! ' + textStatus);

        })
        .always(function() {
            // request ended
        });

    // Populate Countries id and station name dropdown
    $.getJSON("https://uhslc.soest.hawaii.edu/erddap/tabledap/global_hourly_fast.json?station_country&distinct()", function(data) {
        $("#select2Country").select2({
            placeholder: {
                // id: '2', // the value of the option
                text: 'Search for a station...',
            },
            tags: false,
            tokenSeparators: [',', ' '],
            data: transformJSONtoSelect2(data, false).results,
        });
    })
        .fail(function(jqXHR, textStatus, errorThrown) {
            alert('Failed to retrieve stations list! ' + textStatus);

        })
        .always(function() {
            // request ended
        });
});

function transformJSONtoSelect2(jsonData, station){
    var tempJson = {"results":[]};

    if(station)
        jsonData.table.rows.forEach(element => tempJson.results.push({"id":pad(element[0],3), "text": pad(element[0],3)+" "+element[1]}));
    else{
        jsonData.table.rows.forEach(function(value,i){
            tempJson.results.push({"id":i, "text": value[0]})
        });
    }

    return tempJson;
}

function pad(num, size) {
    var s = num+"";
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
    console.log("CALL THIS URI: "+uri);

    function success(data) {
        console.log("DATA: "+data);
        console.log("DATA.URL: "+data.url);
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
    var s2="";
    for (var i = 0; i < s.length; i++) {
        var ch=s.charAt(i);
        if (ch == "\xA0") s2+="%20";
        else s2+=encodeURIComponent(ch);
    }
    return s2;
}


