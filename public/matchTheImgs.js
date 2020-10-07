function matchTheImgs() {
    $('#compResult').html('');
    try {
        $.ajax({
            type: 'GET',
            contentType: 'application/json',
            url: 'http://localhost:5555/api/matchImages',						
            success: function(data) {
                displayImageMatch(data);
            }
        })
        .done(function() {
        }) 
        .fail(function() {
        })
        .always(function() {
        });
    } catch(err) {
        console.log('matchTheImgs error: ' + err + ' message: ' + err.message);
    }
}

// format image match JSON into HTML table for display in web browser
function displayImageMatch(data) {
    var matchTable = '<br/><br/><table class="matchTable"><tr><th class="srcImgCol">Source Image</th><th class="srcNameCol">Source Name</th>' + 
        '<th class="imgCol">Target Image</th><th class="nameCol">Target Name</th><th class="scoreCol">Score</th><th class="scoreCol">Normalized</th></tr>';
    var imgName;
    var imgLink;
    var imgLinkTarget;
    var ixImg = 0;
    var imgCompRows = 0;
    var sectionSep = '<tbody>';
    var rowClass = '';
    data.forEach(item => {
        imgCompRows = 0;
        if ((++ixImg % 2) == 0) {
            $('.rowImg').addClass('rowImgEven');
            rowClass = ' class="rowImgEven"';
        } else {
            $('.rowImg').removeClass('rowImgEven');
            rowClass = '';
        }

        imgName = item.image;
        imgLink = '<img src="example_imgs/' + imgName + '" class="srcImgClass">';
        item.comparison.forEach(comp => {
            imgCompRows++;
        });
        item.comparison.forEach(comp => {
            imgLinkTarget = '<img src="example_imgs/' + comp.compareImage + '" class="imgClass">';
            if (imgName != '') {
                matchTable += sectionSep + '<tr class="rowSep"><td class="srcImgCol"></td><td class="srcNameCol"></td><td class="imgCol"></td>' +
                    '<td class="nameCol"></td><td class="scoreCol"></td><td class="scoreCol"></td></tr>';
                matchTable += sectionSep + '<tr' + rowClass + '><td rowspan="' + imgCompRows + '" class="srcImgCol">' + imgLink + '</td><td rowspan="' + 
                    imgCompRows + '" class="srcNameCol">' + imgName + '</td><td class="imgCol">' + imgLinkTarget + '</td><td class="nameCol">'  +
                    comp.compareImage + '</td><td class="scoreCol">' + comp.Score + '</td><td class="scoreCol">' + comp.NormalizedScore + '</td></tr>';
                sectionSep = '</tbody><tbody>';
            } else {
                matchTable += '<tr' + rowClass + '><td class="imgCol">' + imgLinkTarget + '</td><td class="nameCol">'  +
                    comp.compareImage + '</td><td class="scoreCol">' + comp.Score + '</td><td class="scoreCol">' + comp.NormalizedScore + '</td></tr>';                
            }

            imgName = '';  
            imgLink = '';
        });
    });
    matchTable += '</tbody></table>'; 
    $('#compResult').html(matchTable);
}
