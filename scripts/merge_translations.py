import sys

import yaml


def persona(old, new, overwrite_language):
    old_t = old['translations']
    new_t = new['translations']

    for key in old_t:
        if key in new_t and overwrite_language in new_t[key]:
            old_t[key][overwrite_language] = new_t[key][overwrite_language]


def questions(old, new, overwrite_language):
    for o, n in zip(old, new):
        if overwrite_language in n['text']:
            o['text'][overwrite_language] = n['text'][overwrite_language]
        if overwrite_language in n['explanation']:
            o['explanation'][overwrite_language] = n['explanation'][overwrite_language]
        if overwrite_language in n['explanationmore']:
            o['explanationmore'][overwrite_language] = n['explanationmore'][overwrite_language]
        if o['type'] == 'multiple_choice':
            for oo, on in zip(o['options'], n['options']):
                if 'details' in oo and overwrite_language in on['details']:
                    oo['details'][overwrite_language] = on['details'][overwrite_language]


def main(mode, base_file, new_file, overwrite_language):
    old = yaml.load(file(base_file).read())
    new = yaml.load(file(new_file).read())

    assert len(overwrite_language) == 2
    if mode == 'persona':
        persona(old, new, overwrite_language)
    elif mode == 'questions':
        questions(old, new, overwrite_language)

    sys.stdout.write(yaml.safe_dump(old, allow_unicode=True, default_flow_style=False, encoding='utf-8', width=10000))

if __name__ == '__main__':
    main(*sys.argv[1:])
