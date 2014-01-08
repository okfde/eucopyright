/* jshint strict: false */
/* global require: false, process: false, console: false, Buffer: false */

var fs = require('fs');
var yaml = require('js-yaml');
var EUCopyrightQuestions = yaml.safeLoad(fs.readFileSync('_data/questions.yml', 'utf8'));
var translations = yaml.safeLoad(fs.readFileSync('_data/translations.yml', 'utf8'));
var AdmZip = require('adm-zip');
var postmark = require('postmark')(process.env.POSTMARK_API_KEY);
var odtprocessor = require('./js/odtprocessor.js');
console.log(translations);
var express = require('express');
var app = express();


var files = {
  content: fs.readFileSync('data/content.xml', 'utf8'),
  manifest: fs.readFileSync('data/META-INF/manifest.xml'),
  meta: fs.readFileSync('data/meta.xml'),
  mimetype: fs.readFileSync('data/mimetype'),
  settings: fs.readFileSync('data/settings.xml'),
  styles: fs.readFileSync('data/styles.xml'),
};


var ODTContentType = 'application/vnd.oasis.opendocument.text';
var ODTFilename = 'consultation-document_en.odt';


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

var validateEmail = function(email) {
  return (/\S+@\S+\.\S+/).test(email);
};

var createODT = function(content) {
  var zip = new AdmZip();
  zip.addFile('mimetype', files.mimetype);
  zip.addFile('META-INF/manifest.xml', files.manifest);
  zip.addFile('meta.xml', files.meta);
  zip.addFile('settings.xml', files.settings);
  zip.addFile('styles.xml', files.styles);
  zip.addFile('content.xml', new Buffer(content));
  return zip.toBuffer();
};

var createText = function(data, settings) {
  return odtprocessor.renderText(
    files.content,
    data,
    EUCopyrightQuestions,
    settings
  );
};

var sendEmail = function(email, name, buffer, lang){
  var body = translations.emailBody[lang] || translations.emailBody.en;
  name = name || translations.emailName[lang] || translations.emailName.en;
  body = body.replace(/\{\{\s*name\s*\}\}/, name);
  console.info('Sending email to ' + email);
  postmark.send({
      'From': process.env.FROM_EMAIL_ADDRESS,
      'To': email,
      'Subject': translations.emailSubject[lang] || translations.emailSubject.en,
      'TextBody': body,
      'Attachments': [{
        'Content': buffer.toString('base64'),
        'Name': ODTFilename,
        'ContentType': ODTContentType
      }]
  }, function(error) {
      if(error) {
          console.error('Unable to send to ' + email + ' via postmark: ' + error.message);
          return;
      }
      console.info('Sent email to ' + email);
  });
};

app.post('/document', function(req, res){
  var buffer = createODT(createText(req.body, {}));
  if (req.body.email && validateEmail(req.body.email)) {
    sendEmail(req.body.email, req.body.name, buffer, req.body.language || 'en');
    if (req.query.redirect) {
      return res.redirect(req.query.redirect);
    }
  }
  res.setHeader('Content-Type', ODTContentType);
  res.setHeader('Content-Length', buffer.length);
  res.setHeader('Content-Disposition', 'attachment; filename="' + ODTFilename +'"');
  res.end(buffer);
});

var port = process.env.PORT || 5000;
app.listen(port);
console.log('Listening on port ' + port);
