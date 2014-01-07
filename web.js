/* jshint strict: false */
/* global require: false, process: false, console: false, Buffer: false */

var fs = require('fs');
var yaml = require('js-yaml');
var EUCopyrightQuestions = yaml.safeLoad(fs.readFileSync('_data/questions.yml', 'utf8'));
var express = require('express');
var app = express();
var postmark = require('postmark')(process.env.POSTMARK_API_KEY);
var odtprocessor = require('./js/odtprocessor.js');


var files = {
  content: fs.readFileSync('data/content.xml', 'utf8'),
  manifest: fs.readFileSync('data/META-INF/manifest.xml', 'utf8'),
  meta: fs.readFileSync('data/meta.xml', 'utf8'),
  mimetype: fs.readFileSync('data/mimetype', 'utf8'),
  settings: fs.readFileSync('data/settings.xml', 'utf8'),
  styles: fs.readFileSync('data/styles.xml', 'utf8'),
};


var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', process.env.ALLOWED_DOMAIN);
    res.header('Access-Control-Allow-Methods', 'POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
};

app.configure(function() {
    app.use(express.bodyParser());
    app.use(allowCrossDomain);
});


var createText = function() {


      // text = odtprocessor.renderText(text,
      //   data
      //   EUCopyright.questions,
      //   EUCopyright.settings
      // );

};

var sendEmail = function(email, data, clb){
    postmark.send({
        'From': process.env.FROM_EMAIL_ADDRESS,
        'To': email,
        'Subject': 'Test',
        'TextBody': 'Test Message',
        'Attachments': [{
          'Content': '',
          'Name': 'consultation-document_en.odt',
          'ContentType': 'application/vnd.oasis.opendocument.text'
        }]
    }, function(error) {
      clb(error);
    });
};

app.post('/mail', function(req, res){
  var body = '{"ok": true}';
  console.log(EUCopyrightQuestions);
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Length', Buffer.byteLength(body));
  res.end(body);
});

var port = process.env.PORT || 5000;
app.listen(port);
console.log('Listening on port ' + port);
