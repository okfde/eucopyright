var EUCopyright = EUCopyright || {};


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
    insertTextPropertiesStyle(doc, key, 'style:text-underline-style="solid" style:text-underline-width="auto" style:text-underline-color="font-color"');
  };

  var bold = function(doc, key){
    insertTextPropertiesStyle(doc, key, 'fo:font-weight="bold" style:font-weight-asian="bold" style:font-weight-complex="bold"');
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

      if (question.type === 'multiple_choice') {
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
      console.log(arguments);
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


  $('.toggle').click(function(e){
    e.preventDefault();
    $($(this).attr('href')).toggle();
  });

  setTimeout(function () {
    var $sideBar = $('.side-navbar')

    $sideBar.affix({
      offset: {
        top: function () {
          var offsetTop      = $sideBar.offset().top;
          var sideBarMargin  = parseInt($sideBar.children(0).css('margin-top'), 10)
          var navOuterHeight = $('.navbar').height();
          console.log(offsetTop - navOuterHeight - sideBarMargin);
          return (this.top = offsetTop - navOuterHeight - sideBarMargin)
        }
      , bottom: function () {
          return (this.bottom = $('.footer-row').outerHeight(true))
        }
      }
    })
  }, 100)
});
