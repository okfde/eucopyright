var problems = [];
var currentProblem = 0;
var guideSlug = 'crew_30c3';

function start(btn) {
  $('input[type=checkbox]').each(function(i, cb) {
    if (cb.checked) {
      var isDuplicate = false;
      for (var j=0; j<problems.length; j++) { // is it already in there?
        if (problems2questions[problems[j][0]][0] == problems2questions[cb.value][0]) {
          // first question for this problem is equal? TODO this only works in simple cases
          isDuplicate = true;
          problems[j][1] += '<br />& '+cb.getAttribute('title');
        }
      }
     if (!isDuplicate) problems.push([cb.value, cb.getAttribute('title')]);
    }
  });
  if (problems.length > 0) {
    $('.container')[0].className = 'container step-problem'; // switch to next "tab"
    $('.download-document').click(function(e){ step() }); // make final button do the right thing
    if (typeof guideSlug != 'undefined') {
      EUCopyright.loadGuide(guideSlug);
    } else {
      EUCopyright.loadGuide('30c3');
    }
    step();
  } else { // nothing selected
    btn.innerHTML = "Please select a problem above before continuing &raquo;";
  }
}

function step() {
  if (currentProblem < problems.length) { // not at end yet

    $('#step-problem h2')[0].innerHTML = problems[currentProblem][1];

    // move last q's back to hidden container
    var cl = document.getElementById('problem').children.length;
    for (var i=0; i<cl; i++) {
      $('#questions')[0].appendChild($('#problem')[0].children[0]);
    }

    // fetch new q's
    $(problems2questions[problems[currentProblem][0]]).each(function(i, q) {
      $('#problem')[0].appendChild($('.q-'+q)[0]);
    });

    if (currentProblem == problems.length-1) {
      $('#next').hide();
      $('.give-name').show();
      $('.download-document').show();
    }
    currentProblem++;

    $('#problem').find(':input:first').focus(); // TODO doesn't work?
    //$('#problem textarea')[0].focus(); // if there's a textarea, place the cursor inside

  } else { // reached end
    $('.container')[0].className = 'container step-end';
    $('#step-end').find(':input:first')[0].focus(); // TODO doesn't work?
  }
}