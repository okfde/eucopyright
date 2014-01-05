/* jshint strict: true, quotmark: false, es3: true */
/* global $: false, JSZip: false */

var EUCopyright = EUCopyright || {};
EUCopyright.settings = EUCopyright.settings || {};
EUCopyright.settings.defaultToNoOpinion = EUCopyright.settings.defaultToNoOpinion === undefined ? true : EUCopyright.settings.defaultToNoOpinion;

(function(){
  "use strict";

var parseUrlParams = function (querystr) {
  var urlParams;
  querystr = querystr || window.location.search;
  var match,
      pl     = /\+/g,  // Regex for replacing addition symbol with a space
      search = /([^&=]+)=?([^&]*)/g,
      decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
      query  = querystr.substring(1);

  urlParams = {};
  match = search.exec(query);
  while (match) {
    urlParams[decode(match[1])] = decode(match[2]);
    match = search.exec(query);
  }
  return urlParams;
};

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
  var strMatchedValue, strMatchedDelimiter;

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
  arrMatches = objPattern.exec(strData);
  while (arrMatches){

    // Get the delimiter that was found.
    strMatchedDelimiter = arrMatches[ 1 ];

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
      strMatchedValue = arrMatches[ 2 ].replace(/""/g, '"');

    } else {
      // We found a non-quoted value.
      strMatchedValue = arrMatches[ 3 ];

    }
    // Now that we have our value string, let's add
    // it to the data array.
    arrData[arrData.length - 1].push(strMatchedValue);
    arrMatches = objPattern.exec(strData);
  }

  // Return the parsed data.
  return arrData ;
};

EUCopyright.compile = function(){
  var escapeXML = function(str){
    return str.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/"/g, '&quot;')
               .replace(/'/g, '&apos;');
  };

  var replaceParagraph = function(doc, key, value){
    return doc.replace(
      new RegExp('(<text:p text:style-name="' + key + '">)[^<]*(</text:p>)'),
      '$1' + escapeXML(value) + '$2'
    );
  };

  var insertTextPropertiesStyle = function(doc, key, style){
    var re = new RegExp('(<style:style style:name="' + key + '"[^>]*>(?:<style:paragraph-properties[^/]*/>)?<style:text-properties)([^/]*/></style:style>)');
    if (!re.test(doc)) {
      var re2 = new RegExp('(<style:style style:name="' + key + '"[^>]*>(?:<style:paragraph-properties[^/]*/>)?)(</style:style>)');
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
  };

  var underline = function(doc, key){
    return insertTextPropertiesStyle(doc, key, 'style:text-underline-style="solid" style:text-underline-width="auto" style:text-underline-color="font-color"');
  };

  var bold = function(doc, key){
    return insertTextPropertiesStyle(doc, key, 'fo:font-weight="bold" style:font-weight-asian="bold" style:font-weight-complex="bold"');
  };

  var applyOdf = function(text, odf, paste) {
    if (odf.action == 'mark') {
      text = underline(text, odf.key);
      text = bold(text, odf.key);
    } else if (odf.action == 'remove' && paste) {
      text = replaceParagraph(text, odf.key, '');
    } else if (odf.action == 'paste' && paste) {
      text = replaceParagraph(text, odf.key, paste);
    }
    return text;
  };

  var applyOdfs = function(text, odfs, paste) {
    if (!odfs) {
      return text;
    }
    for (var i = 0; i < odfs.length; i += 1) {
      text = applyOdf(text, odfs[i], paste);
    }
    return text;
  };

  var processQuestions = function(text) {
    var question, j, paste, radio, checked;

    for (var i = 0; i < EUCopyright.questions.length; i += 1) {
      question = EUCopyright.questions[i];

      if (question.type === 'multiple_choice' && question.options) {
        checked = false;
        for (j = 0; j < question.options.length; j += 1) {
          radio = $('#q-' + question.num + '-' + j);
          if (radio.prop('checked')) {
            paste = '';
            checked = true;
            if (question.options[j].fulltext) {
              paste = $('#q-' + question.num + '-' + j + '-text').val();
            }
            text = applyOdfs(text, question.options[j].odf, paste);
          }
        }
        if (!checked && EUCopyright.settings.defaultToNoOpinion) {
          // Check no opinion, if not filled in
          text = applyOdfs(text, question.options[2].odf, '');
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
    $.get(EUCopyright.baseurl + '/data/content.xml').done(function(parsed, mes, xhr){
      var text = xhr.responseText;

      var name = $('#name').val();
      if (name) {
        text = replaceParagraph(text, 'P288', name);
        text = replaceParagraph(text, 'P289', '');
      } else {
        text = underline(text, 'P316');
      }

      var registerId = $('#register-id').val();
      if (registerId) {
        text = replaceParagraph(text, 'P293', registerId);
      }

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

      var typeOfRespondent = $('*[name="typeofrespondent"]');
      typeOfRespondent.each(function(i, el){
        el = $(el);
        if ((el.attr('type') !== 'checkbox' && el.attr('type') !== 'radio') || el.prop('checked')){
          var currentTypeOfRespondent = el.val();
          $(respondents[currentTypeOfRespondent]).each(function(j, key){
            text = underline(text, key);
          });
          if (currentTypeOfRespondent === 'other') {
            text = replaceParagraph(text, 'P423', $('#typeofrespondent-other-text').val());
            text = replaceParagraph(text, 'P424', '');
          }
        }
      });
      text = processQuestions(text);

      zip.file('content.xml', text);
      d.resolve();
    });
    return d;
  };

  var addFile = function(zip, zipPath){
    var d = $.Deferred();
    $.get(EUCopyright.baseurl + '/data/' + zipPath).done(function(parsed, mes, xhr){
      zip.file(zipPath, xhr.responseText);
      d.resolve();
    });
    return d;
  };

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
    d.resolve(zip);
  });

  return d;
};

EUCopyright.answerCache = {};

EUCopyright.applyGuideToAll = function(guide){
  var question, answer, answers = EUCopyright.answerCache[guide.slug];
  for (var i = 0; i < EUCopyright.questions.length; i += 1) {
    if (answers[EUCopyright.questions[i].num]) {
      question = EUCopyright.questions[i];
      answer = answers[question.num];
      EUCopyright.applyGuide(guide, question, answer);
    }
  }
};

EUCopyright.supports_html5_storage = function() {
  try {
    return 'localStorage' in window && window.localStorage !== null;
  } catch (e) {
    return false;
  }
};

EUCopyright.applyGuide = function(guide, question, answer) {
  var isAnswered = false;
  if (question.type === 'multiple_choice' && question.options) {
    if (answer.option !== null) {
      isAnswered = true;
      $('#q-' + question.num + '-' + answer.option).
        prop('checked', true).
        parents('div').addClass('isChecked'); // microsites might need this to hide unrecommended answer options
      if (question.options && question.options[answer.option].fulltext) {
        $('#q-' + question.num + '-' + answer.option + '-text').val(answer.answer);
      }
    }
  } else if (question.type == 'open_question') {
    if (answer.answer) {
      isAnswered = true;
    }
    $('#q-' + question.num + '-text').val(answer.answer);
  }
  if (answer.explanation) {
    isAnswered = true;
    $('#q-' + question.num + '-customexplanation').text(answer.explanation).slideDown();
  } else {
    $('#q-' + question.num + '-customexplanation').slideUp();
  }
  $('.answer-choices-' + question.num + ' a').removeClass('active');
  if (isAnswered) {
    $('#answer-choice-' + guide.slug + '-' + question.num).addClass('active');
  }
};

EUCopyright.loadQuestionGuide = function(slug, clb){
  if (EUCopyright.answerCache[slug] !== undefined){
    if (EUCopyright.answerCache[slug] === 'waiting') {
      return;
    }
    return clb(EUCopyright.answerCache[slug]);
  }

  EUCopyright.answerCache[slug] = 'waiting';
  $.get(EUCopyright.answers[slug].url, function(text, status, xhr){
    var csv = EUCopyright.parseCSV(xhr.responseText);
    var answers = {};

    for (var i = 1; i < csv.length; i += 1) {
      var row = {};
      for (var j = 0; j < csv[0].length; j += 1) {
        row[csv[0][j]] = csv[i][j];
      }
      answers[parseInt(row.Question, 10)] = {
        option: row.Option ? parseInt(row.Option, 10) - 1 : null,
        answer: row.Answer,
        explanation: row.Explanation
      };
    }
    EUCopyright.answerCache[slug] = answers;
    clb(EUCopyright.answerCache[slug]);
  });
};

EUCopyright.loadGuide = function(slug){
  $('.load-question-guide').removeClass('active');
  $('.load-question-guide-' + slug).addClass('active');

  EUCopyright.loadQuestionGuide(slug, function(answers){
    EUCopyright.applyGuideToAll(EUCopyright.answers[slug], answers);
  });
};

$(function(){
  $('.download-document').click(function(e){
    e.preventDefault();
    EUCopyright.compile().done(function(zip){
      var filename = 'consultation-document_en.odt';
      if (window.URL === undefined || !JSZip.support.blob) {
        $('#download-link-container').downloadify({
          swf: EUCopyright.baseurl + '/js/downloadify.swf',
          downloadImage: EUCopyright.baseurl + '/img/downloadbutton.png',
          width: 116,
          height: 45,
          filename: filename,
          data: function(){
            return zip.generate();
          },
          dataType: 'base64',
          onComplete: function(){
            if (window._paq !== undefined) {
              window._paq.push(['trackGoal', 1]);
            }
          }
        });
      } else {
        $('#download').attr({
          'href': window.URL.createObjectURL(zip.generate({type: "blob"})),
          'download': filename
        }).removeClass('disabled');
        $('#download').click(function(){
          if (window._paq !== undefined) {
            window._paq.push(['trackGoal', 1]);
          }
        });
      }
      $('#download-preparing').fadeOut();
    });

    $('#download-preparing').show();
    $('#download-modal').modal();
  });

  $('.load-question-guide').click(function(e){
    e.preventDefault();
    var params = parseUrlParams($(this).attr('href'));
    EUCopyright.loadGuide(params.guide);
  });

  $('.load-question').click(function(e){
    e.preventDefault();
    var slug = $(this).attr('href').substr(1);
    var qnum = parseInt($(this).data('question'), 10);
    EUCopyright.loadQuestionGuide(slug, function(answers){
      EUCopyright.applyGuide(
        EUCopyright.answers[slug],
        EUCopyright.questions[qnum - 1],
        answers[qnum]
      );
    });
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

  if (!EUCopyright.supports_html5_storage()) {
    $('#localstorage-hint').hide();
  }

  if (EUCopyright.supports_html5_storage()) {
    $('.delete-localstorage').click(function(){
      var answer = window.confirm('Are you sure?');
      if (!answer) { return; }
      for (var key in localStorage) {
        delete localStorage[key];
      }
      window.location.reload();
    });
  }

  $('.radio-text textarea.save').on('keyup', function(){
    var radio = $(this).parent().parent().find('input:not(checked)');
    radio.prop('checked', true);

    if (EUCopyright.supports_html5_storage()) {
      var name = radio.attr('name');
      var value = radio.val();
      if (value !== null) {
        localStorage.setItem(name, value);
      }
    }
  });

  $('.sdfootnoteanc').click(function(){
    $('#footnote-div').show();
  });

  $('textarea').autogrow();

  if (EUCopyright.supports_html5_storage()) {
    $('textarea.save').each(function() {
      var id = $(this).attr('id');
      var value = localStorage.getItem(id);
      $(this).val(value);
    });
    $('input[type=radio].save').each(function() {
      var name = $(this).attr('name');
      var value = localStorage.getItem(name);
      if (value !== null) {
        $('input[type=radio]#' + name + '-' + value).prop('checked', true);
      }
    });
    $('input[type=text].save').each(function() {
      var id = $(this).attr('id');
      var value = localStorage.getItem(id);
      $(this).val(value);
    });

    $('textarea.save').on('keydown change', function() {
      var id = $(this).attr('id');
      var value = $(this).val();
      if (value !== null) {
        localStorage.setItem(id, value);
      }
    });
    $('input[type=radio].save').on('click change', function() {
      var name = $(this).attr('name');
      var value = $(this).val();
      if (value !== null) {
        localStorage.setItem(name, value);
      }
    });
    $('input[type=text].save').on('keydown change', function() {
      var id = $(this).attr('id');
      var value = $(this).val();
      if (value !== null) {
        localStorage.setItem(id, value);
      }
    });
  }

  setTimeout(function () {
    var $sideBar = $('.side-navbar');

    $sideBar.affix({
      offset: {
        top: function () {
          var offsetTop      = $sideBar.offset().top;
          var sideBarMargin  = parseInt($sideBar.children(0).css('margin-top'), 10);
          var navOuterHeight = $('.navbar').height();
          this.top = offsetTop - navOuterHeight - sideBarMargin;
          return this.top;
        },
        bottom: function () {
          this.bottom = $('.footer-row').outerHeight(true);
          return this.bottom;
        }
      }
    });
  }, 100);

  var urlParams = parseUrlParams();
  if (urlParams.guide) {
    EUCopyright.loadGuide(urlParams.guide);
  }
});

}());
