/* jshint strict: true, quotmark: false, es3: true */

(function(exports){
  "use strict";
  var escapeXML = function(str){
    return str.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/"/g, '&quot;')
               .replace(/'/g, '&apos;');
  };

  var replaceParagraph = function(doc, key, value){
    if (Object.prototype.toString.call(value) === '[object Array]') {
      value = value[0];
    }
    value = value || '';
    return doc.replace(
      new RegExp('(<text:p text:style-name="' + key + '">).*?(</text:p>)'),
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

  var processQuestions = function(text, replies, questions, settings) {
    var question, j, paste, radio, checked;

    for (var i = 0; i < questions.length; i += 1) {
      question = questions[i];

      if (question.type === 'multiple_choice' && question.options) {
        checked = false;
        radio = parseInt(replies['q-' + question.num], 10);
        for (j = 0; j < question.options.length; j += 1) {
          if (radio === j) {
            paste = '';
            checked = true;
            if (question.options[j].fulltext) {
              paste = replies['q-' + question.num + '-' + j + '-text'];
            }
            text = applyOdfs(text, question.options[j].odf, paste);
          }
        }
        if (!checked && settings.defaultToNoOpinion) {
          // Check no opinion, if not filled in
          text = applyOdfs(text, question.options[2].odf, '');
        }
      } else if (question.type == 'open_question') {
        paste = replies['q-' + question.num + '-text'];
        text = applyOdfs(text, question.odf, paste);
      }
    }
    return text;
  };

  exports.renderText = function(text, data, questions, settings){
    var name = data.name;
    if (name) {
      text = replaceParagraph(text, 'P288', name);
      text = replaceParagraph(text, 'P289', '');
    } else {
      text = underline(text, 'P316');
    }

    var registerId = data.registerid;
    if (registerId) {
      text = replaceParagraph(text, 'P293', registerId);
    }

    var respondents = {
      enduser: ['T326'],
      representEnduser: ['T340', 'T341', 'T342', 'T343', 'T344', 'T345'],
      institution: ['T354'],
      representInstitution: ['T367', 'T368', 'T369', 'T370'],
      author: ['P378'],
      publisher: ['P380'],
      intermediary: ['T393', 'T394', 'T395', 'T396', 'T397'],
      representIntermediary: ['T405', 'T406'],
      collective: ['P414'],
      publicauthority: ['P416'],
      memberstate: ['P418'],
      other: ['T421']
    };

    if (Object.prototype.toString.call(data.typeofrespondent) !== '[object Array]') {
      data.typeofrespondent = [data.typeofrespondent];
    }

    var alreadyChecked = {};
    for (var i = 0; i < data.typeofrespondent.length; i += 1) {
      var respondentKeys = respondents[data.typeofrespondent[i]];
      if (!respondentKeys) { continue; }
      if (alreadyChecked[data.typeofrespondent[i]] !== undefined) { continue; }
      alreadyChecked[data.typeofrespondent[i]] = true;
      for (var j = 0; j < respondentKeys.length; j += 1) {
        text = underline(text, respondentKeys[j]);
      }
      if (data.typeofrespondent[i] === 'other') {
        text = replaceParagraph(text, 'P423', data.typeofrespondentother);
        text = replaceParagraph(text, 'P424', '');
      }
    }

    text = processQuestions(text, data, questions, settings);

    return text;
  };
})(typeof exports === 'undefined' ? (this.odtprocessor = {}) : exports);
