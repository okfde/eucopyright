import sys

import yaml


def main(base_file, new_file, overwrite_language):
    old = yaml.load(file(base_file).read())
    new = yaml.load(file(new_file).read())

    assert len(overwrite_language) == 2

    for o, n in zip(old, new):
        if overwrite_language in n['text']:
            o['text'][overwrite_language] = n['text'][overwrite_language]
        if o['type'] == 'multiple_choice':
            for oo, on in zip(o['options'], n['options']):
                if 'details' in oo and overwrite_language in on['details']:
                    oo['details'][overwrite_language] = on['details'][overwrite_language]

    sys.stdout.write(yaml.safe_dump(old, allow_unicode=True, default_flow_style=False, encoding='utf-8', width=10000))

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3])
