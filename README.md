# Public Consultation on the review of the EU copyright rules

This website will make it easier to fill out the public consultation form and gives helpful guidance. It allows to download a finished ODT document to send to the commission.

## Provide answers for review

If you want to provide your own perspective, it's a matter of filling in a spreadsheet with answers for each question. [You can take this spreadsheet as an example](https://docs.google.com/spreadsheet/ccc?key=0AhDkodM9ozpddFkxZE95VHJpczV4dks3bTJ5NzhNRmc&usp=sharing
).

- The "Question" column contains the question number
- The "Option" column may contain a number (1, 2 or 3) if there is an option to fill in (choosing the first, second or third option)
- The "Answer" column may contain text that will be filled in if there is text field related to the chosen option or if it's an open question. Do not provide full answers, let users write in their own words.
- The "Explanation" column may contain an explanation to the question or the given answer that will be shown along-side it.

Contact stefan.wehrmeyer@okfn.org to be included with your answers.

## Provide translations

The `_data/questions.yml` contains the questions with text keys and language sub keys (en, de). Add your question translations there. Provide further translations for strings in `_data/translations.yml`.

### Persona site

Add your translations to the head of `_layouts/persona.html`.
Then create a document with like this:

    ---
    layout: persona
    language: <language code (e.g. en)>
    ---

and put it into your language folder.
The full question versions are at `en/full/index.html`

### Guides

You can provide a translated version of a guide as well. See the available guides under `_data/answers.yml` and under `guides/`.
Postfix your guide slug with the language code: `c4c_en`.


## Setup the backup server on Heroku

Install the Heroku toolbelt, create an app and add the `heroku` Git remote. Then:

    # Do this to explicitly define node.js as build pack
    heroku config:add BUILDPACK_URL=https://github.com/heroku/heroku-buildpack-nodejs
    git push heroku gh-pages:master

Add the Postmark Add-On to you app, add sending signatures.

Set some environment variables:

    heroku config:set FROM_EMAIL_ADDRESS=verified@emailaddress.eu
    heroku config:set "ALLOWED_DOMAIN=http://youcan.fixcopyright.eu"

### Database

    CREATE TABLE submission
    (
      id serial NOT NULL,
      timestamp timestamp NOT NULL,
      data text NOT NULL,
      CONSTRAINT submission_pkey PRIMARY KEY (id)
    );