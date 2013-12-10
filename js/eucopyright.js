var EUCopyright = {};


EUCopyright.compile = function(){
  var zip = new JSZip();

  var replaceParagraph = function(doc, key, value){
    return doc.replace(
      new RegExp('(<text:p text:style-name="' + key + '">)[^<]*(</text:p>)'),
      '$1' + value + '$2'
    );
  };

  var underline = function(doc, key){
    return doc.replace(
      new RegExp('(<style:style style:name="' + key + '"[^>]*>(?:<style:paragraph-properties[^/]*/>)?<style:text-properties)([^/]*/></style:style>)'),
      '$1 style:text-underline-style="solid" style:text-underline-width="auto" style:text-underline-color="font-color"$2'
    );
  };

  var constructContents = function(zip){
    var d = $.Deferred();
    $.get('data/content.xml').done(function(parsed, mes, xhr){
      var text = xhr.responseText;
      text = replaceParagraph(text, 'P288', $('#name').val());
      text = replaceParagraph(text, 'P289', '');
      text = replaceParagraph(text, 'P293', $('#register-id').val());
      if ($('#anonymous').prop('checked')) {
        text = underline(text, 'P316');
      }
      // text = underline(text, 'T326');
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
    console.log('files done');
    d.resolve(zip.generate({type:"blob"}));
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

});