/* jshint strict: true, quotmark: false, es3: true */
/* global $: false, EUCopyright: false */

$(function(){
  "use strict";
  var personaSections = {
    general: ['access', 'linking', 'digitalcontent', 'termofprotection', 'limitations', 'privatecopying', 'respectforrights', 'otherissues'],
    onlineuser: ['access', 'linking', 'digitalcontent', 'limitations', 'privatecopying', 'respectforrights'],
    parent: ['linking', 'digitalcontent', 'limitations', 'privatecopying', 'respectforrights'],
    teacher: ['teaching', 'research', 'textmining'],
    business: ['rightsholder', 'textmining', 'usergeneratedcontent', 'privatecopying2', 'privatecopying3'],
    librarian: ['libraries', 'textmining', 'registration', 'termofprotection', 'identifiers'],
    blogger: ['usergeneratedcontent'],
    rightsholder: ['rightsholder2', 'remuneration', 'registration', 'privatecopying2'],
    disabled: ['disabilities']
  };
  var qIndex = {}, qCount = 0;
  var toggleSections = function() {
    var personas = [];
    $('.personas .thumbnail').each(function(i, el) {
      el = $(el);
      el.toggleClass('active', el.find('input').prop('checked'));
      if (el.hasClass('active')) {
        personas.push(el.attr('id').split('-')[1]);
      }
    });
    var groupObj = {}, personaSection;
    for (var i = 0; i < personas.length; i += 1) {
      personaSection = personaSections[personas[i]];
      for (var j = 0; j < personaSection.length; j += 1) {
        if (groupObj[personaSection[j]] === undefined) {
          groupObj[personaSection[j]] = true;
        }
      }
    }

    $('#persona-questions .question-section').removeClass('active').hide();
    $('.q').removeClass('active');
    $('#persona-questions .question-section.general').show();
    for (var group in groupObj) {
      $('#persona-questions .section-' + group).addClass('active').show();
      $('#persona-questions .section-' + group).find('.q').addClass('active');
    }
    qCount = $('.q.active').length;
    qIndex = {};
    $('.q.active').each(function(i, el){
      qIndex[$(el).attr('id')] = i;
    });
  };

  $('.personas .thumbnail input').change(function(){
    toggleSections();
    refreshScroll();
  });
  $('.delete-localstorage').show();
  $('#persona-questions').hide();
  $('.continue-questions').click(function(){
    $(this).hide();
    $('#persona-questions').show();
    $progressBar.show();
    window.setTimeout(function(){
      refreshScroll();
    }, 100);
  });
  window.setTimeout(function(){
    toggleSections();
  }, 100);

  var $progressBar = $('#progress-bar').hide();
  $progressBar.css('width', $progressBar.parent().width() + 'px');

  var offsets = $([]), targets = $([]);
  var $scrollElement = $(window);
  var activeTarget = null;
  var process = function(){
    var scrollTop    = $scrollElement.scrollTop();
    var scrollHeight = $scrollElement[0].scrollHeight;
    var maxScroll    = scrollHeight - $scrollElement.height();
    var i;

    if (scrollTop >= maxScroll) {
      return activeTarget != (i = targets.last()[0]) && activate(i);
    }

    for (i = offsets.length; i--;) {
      if (activeTarget != targets[i] && scrollTop >= offsets[i] && (!offsets[i + 1] || scrollTop <= offsets[i + 1])) {
        activate(targets[i]);
      }
    }
  };
  var $progressBarSub = $progressBar.find('.progress-bar');
  var activate = function(target){
    if (qIndex[target] === undefined) { return; }
    $progressBarSub.attr({
      'aria-valuenow': qIndex[target],
      'aria-valuemin': 1,
      'aria-valuemax': qCount
    }).css('width', ((qIndex[target] + 1) / qCount * 100) + '%');
  };
  var refreshScroll = function(){
    offsets = $([]);
    targets = $([]);
    var offsetMethod = 'offset';
    $('body')
      .find('.q.active')
      .map(function () {
        var $el = $(this);
        return [[ $el[offsetMethod]().top + (!$.isWindow($scrollElement.get(0)) && $scrollElement.scrollTop()),
              $el.attr('id')]];
      })
      .sort(function (a, b) { return a[0] - b[0]; })
      .each(function () {
        offsets.push(this[0]);
        targets.push(this[1]);
      });
  };
  refreshScroll();
  $(window).resize(refreshScroll);
  $(window).on('scroll', process);
  EUCopyright.loadGuide('c4c_' + $('html').attr('lang'));
});
