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

The `_data/questions.yml` contains the questions with text keys and language sub keys (en, de). Add your question translations there. Provide simple translations of Yes, No and No Opinion in `_data/translations.yml`.

Then copy `en/index.html` (or for a simpler version `de/index.html`) to a folder with your language and adapt accordingly. Also create a language sub folder in `_includes/` and translate the `intro.html` and `download_modal.html`. You can also translate one of the existing mini-sites (e.g. `30c3`).

You can provide a translated version of a guide as well. See the available guides under `_data/answers.yml` and under `guides/`.
