var EUCopyright = EUCopyright || {};

EUCopyright.parseCSV = function( strData, strDelimiter ){
    /*
    This code taken from:
    http://stackoverflow.com/a/1293163/114462
    under CC-By-SA 3.0
    */
    // This will parse a delimited string into an array of
    // arrays. The default delimiter is the comma, but this
    // can be overriden in the second argument.
      // Check to see if the delimiter is defined. If not,
      // then default to comma.
      strDelimiter = (strDelimiter || ",");

      // Create a regular expression to parse the CSV values.
      var objPattern = new RegExp(
        (
          // Delimiters.
          "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

          // Quoted fields.
          "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

          // Standard fields.
          "([^\"\\" + strDelimiter + "\\r\\n]*))"
        ),
        "gi"
        );


      // Create an array to hold our data. Give the array
      // a default empty first row.
      var arrData = [[]];

      // Create an array to hold our individual pattern
      // matching groups.
      var arrMatches = null;


      // Keep looping over the regular expression matches
      // until we can no longer find a match.
      while (arrMatches = objPattern.exec( strData )){

        // Get the delimiter that was found.
        var strMatchedDelimiter = arrMatches[ 1 ];

        // Check to see if the given delimiter has a length
        // (is not the start of string) and if it matches
        // field delimiter. If id does not, then we know
        // that this delimiter is a row delimiter.
        if (
          strMatchedDelimiter.length &&
          (strMatchedDelimiter != strDelimiter)
          ){

          // Since we have reached a new row of data,
          // add an empty row to our data array.
          arrData.push( [] );

        }


        // Now that we have our delimiter out of the way,
        // let's check to see which kind of value we
        // captured (quoted or unquoted).
        if (arrMatches[ 2 ]){

          // We found a quoted value. When we capture
          // this value, unescape any double quotes.
          var strMatchedValue = arrMatches[ 2 ].replace(
            new RegExp( "\"\"", "g" ),
            "\""
            );

        } else {
          // We found a non-quoted value.
          var strMatchedValue = arrMatches[ 3 ];

        }
        // Now that we have our value string, let's add
        // it to the data array.
        arrData[ arrData.length - 1 ].push( strMatchedValue );
      }

      // Return the parsed data.
      return( arrData );
    }

EUCopyright.compile = function(){
  var escapeXML = function(str){
    return str.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/"/g, '&quot;')
               .replace(/'/g, '&apos;');
  }

  var replaceParagraph = function(doc, key, value){
    return doc.replace(
      new RegExp('(<text:p text:style-name="' + key + '">)[^<]*(</text:p>)'),
      '$1' + escapeXML(value) + '$2'
    );
  };

  var insertTextPropertiesStyle = function(doc, key, style){
    var re = new RegExp('(<style:style style:name="' + key + '"[^>]*>(?:<style:paragraph-properties[^/]*/>)?<style:text-properties)([^/]*/></style:style>)')
    if (!re.test(doc)) {
      var re2 = new RegExp('(<style:style style:name="' + key + '"[^>]*>(?:<style:paragraph-properties[^/]*/>)?)(</style:style>)')
      if (!re2.test(doc)) {
        throw new Error('could not underline at ' + key);
      }
      return doc.replace(
        re2,
        '$1<style:text-properties ' + style + '/>$2'
      );
    }
    return doc.replace(
      re,
      '$1 ' + style + '$2'
    );
  }

  var underline = function(doc, key){
    return insertTextPropertiesStyle(doc, key, 'style:text-underline-style="solid" style:text-underline-width="auto" style:text-underline-color="font-color"');
  };

  var bold = function(doc, key){
    return insertTextPropertiesStyle(doc, key, 'fo:font-weight="bold" style:font-weight-asian="bold" style:font-weight-complex="bold"');
  }

  var applyOdf = function(text, odf, paste) {
    if (odf.action == 'mark') {
      text = underline(text, odf.key);
      text = bold(text, odf.key);
    } else if (odf.action == 'remove') {
      text = replaceParagraph(text, odf.key, '');
    } else if (odf.action == 'paste' && paste) {
      text = replaceParagraph(text, odf.key, paste);
    }
    return text
  };

  var applyOdfs = function(text, odfs, paste) {
    if (!odfs) {
      return text;
    }
    for (var i = 0; i < odfs.length; i += 1) {
      text = applyOdf(text, odfs[i], paste);
    }
    return text;
  }

  var processQuestions = function(text) {
    var question, j, paste, radio;

    for (var i = 0; i < EUCopyright.questions.length; i += 1) {
      question = EUCopyright.questions[i];

      if (question.type === 'multiple_choice' && question.options) {
        for (j = 0; j < question.options.length; j += 1) {
          radio = $('#q-' + question.num + '-' + j);
          if (radio.prop('checked')) {
            paste = '';
            if (question.options[j].fulltext) {
              paste = $('#q-' + question.num + '-' + j + '-text').val();
            }
            text = applyOdfs(text, question.options[j].odf, paste);
          }
        }
      } else if (question.type == 'open_question') {
        paste = $('#q-' + question.num + '-text').val();
        text = applyOdfs(text, question.odf, paste);
      }
    }
    return text;
  };

  var constructContents = function(zip){
    var d = $.Deferred();
    $.get('data/content.xml').done(function(parsed, mes, xhr){
      var text = xhr.responseText;

      var name = $('#name').val()
      if (name) {
        text = replaceParagraph(text, 'P288', name);
        text = replaceParagraph(text, 'P289', '');
      } else {
        text = underline(text, 'P316');
      }

      text = replaceParagraph(text, 'P293', $('#register-id').val());

      var respondents = {
        enduser: ['T326'],
        representEnduser: ['T340', 'T341', 'T342', 'T343', 'T344', 'T345'],
        institution: ['T354'],
        representInstitution: ['T367', 'T368', 'T369', 'T370'],
        author: ['P378'],
        representAuthor: ['P378'],
        publisher: ['P380'],
        representPublisher: ['P380'],
        intermediary: ['T393', 'T394', 'T395', 'T396', 'T397'],
        representIntermediary: ['T405', 'T406'],
        collective: ['P414'],
        publicauthority: ['P416'],
        memberstate: ['P418'],
        other: ['T421']
      };

      var typeOfRespondent = $('*[name="typeofrespondent"]:checked').val();
      $(respondents[typeOfRespondent]).each(function(i, key){
        text = underline(text, key);
      });
      if (typeOfRespondent === 'other') {
        text = replaceParagraph(text, 'P423', $('#typeofrespondent-other-text').val());
        text = replaceParagraph(text, 'P424', '');
      }

      text = processQuestions(text);

      zip.file('content.xml', text);
      d.resolve()
    });
    return d;
  }

  var addFile = function(zip, zipPath){
    var d = $.Deferred();
    $.get('data/' + zipPath).done(function(parsed, mes, xhr){
      zip.file(zipPath, xhr.responseText);
      d.resolve();
    });
    return d;
  }

  var zip = new JSZip();

  var jobs = [
    constructContents(zip),
    addFile(zip, 'mimetype'),
    addFile(zip, 'META-INF/manifest.xml'),
    addFile(zip, 'meta.xml'),
    addFile(zip, 'settings.xml'),
    addFile(zip, 'styles.xml')
  ];

  var d = $.Deferred();

  $.when.apply($, jobs).then(function(){
    d.resolve(zip.generate({type: "blob"}));
  })

  return d;
};

EUCopyright.addAnswers = function(url){
  $.get(url, function(text, status, xhr){
    var csv = EUCopyright.parseCSV(xhr.responseText);
    var answers = {};
    var question, answer, num

    for (var i = 1; i < csv.length; i += 1) {
      var row = {};
      for (var j = 0; j < csv[0].length; j += 1) {
        row[csv[0][j]] = csv[i][j];
      }
      answers[parseInt(row['Question'], 10)] = {
        option: row['Option'] ? parseInt(row['Option'], 10) - 1 : null,
        answer: row['Answer'],
        explanation: row['Explanation'],
      };
    }
    for (i = 0; i < EUCopyright.questions.length; i += 1) {
      if (answers[EUCopyright.questions[i].num]) {
        question = EUCopyright.questions[i];
        answer = answers[question.num]
        if (question.type === 'multiple_choice' && question.options) {
          if (answer.option !== null) {
            $('#q-' + question.num + '-' + answer.option).prop('checked', true);
            if (question.options && question.options[answer.option].fulltext) {
              $('#q-' + question.num + '-' + answer.option + '-text').val(answer.answer);
            }
          }
        } else if (question.type == 'open_question') {
          $('#q-' + question.num + '-text').val(answer.answer);
        }
        if (answer.explanation) {
          $('#q-' + question.num + '-explanation').show().find('.explanation-text').text(answer.explanation);
        } else {
          $('#q-' + question.num + '-explanation').hide();
        }
      }
    }
  });
};

$(function(){
  $('#compile').click(function(e){
    e.preventDefault();
    EUCopyright.compile().done(function(blob){
      $('#download').attr({
        'href': window.URL.createObjectURL(blob),
        'download': 'consultation-document_en.odt'
      }).removeClass('disabled');
      $('#download-preparing').fadeOut();
    });

    $('#download-preparing').show();
    $('#download-modal').modal();
  });

  $('.suggested-answer').click(function(e){
    e.preventDefault();
    EUCopyright.addAnswers($(this).attr('href'));
  });

  $('.toggle').click(function(e){
    e.preventDefault();
    var div = $($(this).attr('href'));
    if (div.css('display') === 'block') {
      div.slideUp();
    } else {
      div.slideDown();
    }
  });

  $('.radio-text textarea').on('keyup', function(){
    $(this).parent().parent().find('input:not(checked)').prop('checked', true);
  });

  $('.sdfootnoteanc').click(function(){
    $('#footnote-div').show();
  });

  setTimeout(function () {
    var $sideBar = $('.side-navbar')

    $sideBar.affix({
      offset: {
        top: function () {
          var offsetTop      = $sideBar.offset().top;
          var sideBarMargin  = parseInt($sideBar.children(0).css('margin-top'), 10)
          var navOuterHeight = $('.navbar').height();
          return (this.top = offsetTop - navOuterHeight - sideBarMargin)
        }
      , bottom: function () {
          return (this.bottom = $('.footer-row').outerHeight(true))
        }
      }
    })
  }, 100)
});
