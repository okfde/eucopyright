/* jshint strict: true, quotmark: false, es3: true */
/* global $: false, JSZip: false, odtprocessor: false */

var EUCopyright = EUCopyright || {};
EUCopyright.settings = EUCopyright.settings || {};
EUCopyright.settings.defaultToNoOpinion = EUCopyright.settings.defaultToNoOpinion === undefined ? true : EUCopyright.settings.defaultToNoOpinion;

(function(){
  "use strict";

EUCopyright.parseUrlParams = function (querystr) {
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

EUCopyright.collectData = function() {
  var data = {};
  var question, j, radio;

  var typesOfRespondents = [];
  $('*[name="typeofrespondent"]').each(function(i, el){
    el = $(el);
    if ((el.attr('type') !== 'checkbox' && el.attr('type') !== 'radio') || el.prop('checked')){
      typesOfRespondents.push(el.val());
    }
  });

  for (var i = 0; i < EUCopyright.questions.length; i += 1) {
    question = EUCopyright.questions[i];
    if (question.type === 'multiple_choice' && question.options) {
      for (j = 0; j < question.options.length; j += 1) {
        radio = $('#q-' + question.num + '-' + j);
        if (radio.prop('checked')) {
          data['q-' + question.num] = j;
          if (question.options[j].fulltext) {
            data['q-' + question.num + '-' + j + '-text'] = $('#q-' + question.num + '-' + j + '-text').val();
          }
        }
      }
    } else if (question.type == 'open_question') {
      data['q-' + question.num + '-text'] = $('#q-' + question.num + '-text').val();
    }
  }

  data.name = $('#name').val();
  data.registerid = $('#register-id').val();
  data.typeofrespondent = typesOfRespondents;
  data.typeofrespondentother = $('#typeofrespondent-other-text').val();
  return data;
};

EUCopyright.compile = function(data, settings){
  var addFile = function(zip, zipPath){
    var d = $.Deferred();
    $.get(EUCopyright.baseurl + '/data/' + zipPath).done(function(parsed, mes, xhr){
      zip.file(zipPath, xhr.responseText);
      d.resolve();
    });
    return d;
  };

  var constructContents = function(zip, data, settings) {
    var d = $.Deferred();
    $.get(EUCopyright.baseurl + '/data/content.xml').done(function(parsed, mes, xhr){
      var text = xhr.responseText;

      text = odtprocessor.renderText(
        text,
        data,
        EUCopyright.questions,
        settings
      );

      zip.file('content.xml', text);
      d.resolve();
    });
    return d;
  };

  var zip = new JSZip();

  var jobs = [
    constructContents(zip, data, settings),
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

EUCopyright.applyGuideToAll = function(guide, options){
  var question, answer, answers = EUCopyright.answerCache[guide.slug];
  for (var i = 0; i < EUCopyright.questions.length; i += 1) {
    if (answers[EUCopyright.questions[i].num]) {
      question = EUCopyright.questions[i];
      answer = answers[question.num];
      EUCopyright.applyGuide(guide, question, answer, options);
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

EUCopyright.applyGuide = function(guide, question, answer, options) {
  options = options || {};
  var isAnswered = false;
  if (options.activeOnly && !$('#q-' + question.num).hasClass('active')) {
    return;
  }
  if (question.type === 'multiple_choice' && question.options) {
    if (answer.option !== null) {
      isAnswered = true;
      $('#q-' + question.num + '-' + answer.option).
        prop('checked', true).
        parents('div').addClass('isChecked'); // microsites might need this to hide unrecommended answer options
      if (question.options && question.options[answer.option].fulltext) {
        if ($('#q-' + question.num + '-' + answer.option + '-text').val() === '') {
          $('#q-' + question.num + '-' + answer.option + '-text').val(answer.answer);
        }
      }
    }
  } else if (question.type == 'open_question') {
    if (answer.answer) {
      isAnswered = true;
    }
    if ($('#q-' + question.num + '-text').val() === '') {
      $('#q-' + question.num + '-text').val(answer.answer);
    }
  }
  if (answer.explanation) {
    isAnswered = true;
    $('#q-' + question.num + '-customexplanation').slideDown();
    $('#q-' + question.num + '-customexplanation-text').html(answer.explanation);
    if (answer.explanationmore) {
      $('#q-' + question.num + '-customexplanation').find('.toggle').show();
      $('#q-' + question.num + '-customexplanationmore-text').html(answer.explanationmore);
    } else {
      $('#q-' + question.num + '-customexplanation').find('.toggle').hide();
      $('#q-' + question.num + '-customexplanationmore-text').html('').hide();
    }
  } else {
    $('#q-' + question.num + '-customexplanation').slideUp();
    $('#q-' + question.num + '-customexplanationmore-text').slideUp();
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
      if (csv[i].length <= 1) {
	      continue; // skip empty line in csv (usually last one)
      }
      for (var j = 0; j < csv[0].length; j += 1) {
        row[csv[0][j]] = csv[i][j];
      }
      var answer = {
        option: row.Option ? parseInt(row.Option, 10) - 1 : null,
        answer: row.Answer,
        explanation: row.Explanation.replace(/\n/g, '<br/>')
      };
      if (row.Explanation_more) {
	answer.explanationmore = row.Explanation_more.replace(/\n/g, '<br/>');
      }
      answers[parseInt(row.Question, 10)] = answer;
    }
    EUCopyright.answerCache[slug] = answers;
    clb(EUCopyright.answerCache[slug]);
  });
};

EUCopyright.loadGuide = function(slug, options){
  $('.load-question-guide').removeClass('active');
  $('.load-question-guide-' + slug).addClass('active');

  EUCopyright.loadQuestionGuide(slug, function(){
    EUCopyright.applyGuideToAll(EUCopyright.answers[slug], options);
  });
};

EUCopyright.trackGoal = function(goalId){
  if (window._paq !== undefined) {
    window._paq.push(['trackGoal', goalId]);
  }
};

EUCopyright.createDownload = function(zip){
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
        EUCopyright.trackGoal(1);
      }
    });
  } else {
    $('#download').attr({
      'href': window.URL.createObjectURL(zip.generate({type: "blob"})),
      'download': filename
    }).removeClass('disabled');
  }
  $('#download-preparing').fadeOut();
};

EUCopyright.showDownloadModal = function(){
  var data = EUCopyright.collectData();
  EUCopyright.compile(data, EUCopyright.settings).done(EUCopyright.createDownload);
  $('#download').addClass('disabled');
  $('#download-preparing').show();
  $('#download-modal').modal();
};

$(function(){
  $('.submit-form').removeClass('hide')
    .click(function(e){
      e.preventDefault();
      EUCopyright.trackGoal(1);
      var $c = $('#consultation-form');
      var $dm = $('#download-modal');
      $dm.find('.final-cases').addClass('hide');
      var email = $c.find('*[name=email]').val();
      if (email) {
        EUCopyright.trackGoal(2);
        $dm.find('.email-sent').removeClass('hide');
        $dm.find('.email-sent-to').text(email);
      } else {
        $dm.find('.download-only').removeClass('hide');
      }
      $dm.modal();
      var action = $c.attr('action');
      action = action.split('?')[0];
      $c.attr('action', action);
      $c.submit();
    });

  $('#download').click(function(){
    if (window._paq !== undefined) {
      window._paq.push(['trackGoal', 1]);
    }
  });

  $('.load-question-guide').click(function(e){
    e.preventDefault();
    var params = EUCopyright.parseUrlParams($(this).attr('href'));
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

  $('.div-toggle').hide();
  $('.toggle').show().click(function(e){
    e.preventDefault();
    if ($(this).hasClass('toggle-hide')) {
      $(this).hide();
    }
    var div = $($(this).attr('href'));
    if (div.css('display') === 'block') {
      div.slideUp();
    } else {
      div.slideDown();
    }
  });

  $('.needs-js').removeClass('hide');

  if (!EUCopyright.supports_html5_storage()) {
    $('#localstorage-hint').hide();
  }

  if (EUCopyright.supports_html5_storage()) {
    $('.delete-localstorage').click(function(e){
      e.preventDefault();
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
    $('input[type=checkbox].save').each(function() {
      var name = $(this).attr('id');
      var value = localStorage.getItem(name);
      if (!!value) {
        $('input[type=checkbox]#' + name).prop('checked', true);
      }
    });
    $('input[type=text].save, input[type=email].save').each(function() {
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
    $('input[type=checkbox].save').on('click change', function() {
      var name = $(this).attr('id');
      var value = $(this).prop('checked');
      if (value) {
        localStorage.setItem(name, value);
      } else {
        delete localStorage[name];
      }
    });
    $('input[type=text].save, input[type=email].save').on('keydown change', function() {
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

  var urlParams = EUCopyright.parseUrlParams();
  if (urlParams.guide) {
    EUCopyright.loadGuide(urlParams.guide);
  }
});

/*
Mozilla Cooke Reader/Writer
https://developer.mozilla.org/en-US/docs/Web/API/document.cookie#A_little_framework.3A_a_complete_cookies_reader.2Fwriter_with_full_unicode_support
*/

window.docCookies = {
  getItem: function (sKey) {
    return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
  },
  setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
    if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
    var sExpires = "";
    if (vEnd) {
      switch (vEnd.constructor) {
        case Number:
          sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
          break;
        case String:
          sExpires = "; expires=" + vEnd;
          break;
        case Date:
          sExpires = "; expires=" + vEnd.toUTCString();
          break;
      }
    }
    document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
    return true;
  },
  removeItem: function (sKey, sPath, sDomain) {
    if (!sKey || !this.hasItem(sKey)) { return false; }
    document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + ( sDomain ? "; domain=" + sDomain : "") + ( sPath ? "; path=" + sPath : "");
    return true;
  },
  hasItem: function (sKey) {
    return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
  },
  keys: /* optional method: you can safely remove it! */ function () {
    var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
    for (var nIdx = 0; nIdx < aKeys.length; nIdx++) { aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]); }
    return aKeys;
  }
};

}());
