# This script is an adapted version of the Ukrstemmer by GitHub-user 
# Amice13 (https://github.com/Amice13/ukr_stemmer)
# It features stricter stemming rules as the original

import re

class UkrainianStemmerCustom():
    def __init__(self, word):
        self.word = word
        self.vowel = r'аеиоуюяіїє'  # http://uk.wikipedia.org/wiki/Голосний_звук
        self.perfectiveground = r'((ів|івши|івшись|ив|ивши|ившись)|((?<=[ая])(в|вши|вшись)))$'
        # http://uk.wikipedia.org/wiki/Рефлексивне_дієслово
        self.reflexive = r'(с[яьи])$'
        # http://uk.wikipedia.org/wiki/Прикметник + http://wapedia.mobi/uk/Прикметник
        self.adjective = r'(ее|іе|ие|ое|ими|іми|ої|а|е|і|у|ю|ій|ий|ой|ем|ім|им|ом|его|ого|ему|ому|іх|их|ую|юю|ая|яя|ою|ею)$'
        # http://uk.wikipedia.org/wiki/Дієприкметник
        self.participle = r'((івш|ивш|уюч|ьн|л)|((?<=[ая])(ем|нн|вш|ющ|щ)))$'
        # http://uk.wikipedia.org/wiki/Дієслово
        # Missing suffixes! verbs from classes i, for example -ить, -иш, имо etc. 
        self.verb = r'((іла|ила|ена|ейте|уйте|іть|іли|или|ей|уй|іл|ил|ім|им|имо|ен|іло|ило|ено|ять|ує|ують|іт|ит|ени|іть|ить|ую|ю)|((?<=[ая])(ла|на|ете|йте|ли|й|л|ем|н|ло|но|ет|ют|ны|ть|ешь|нно)))$'
        # http://uk.wikipedia.org/wiki/Іменник
        self.noun = r'(а|ев|ов|іе|ье|е|іями|ями|ами|еї|ії|и|ією|ею|єю|ой|ий|й|иям|ям|ием|ем|ам|ом|о|у|ах|іях|ях|и|і|ь|ію|ью|ю|ия|ья|я)$'
        self.rvre = r'[аеиоуюяіїє]'
        self.derivational = r'[^аеиоуюяіїє][аеиоуюяіїє]+[^аеиоуюяіїє]+[аеиоуюяіїє].*(?<=о)сть?$'
        self.RV = ''

    def ukstemmer_search_preprocess(self, word):
        word = word.lower()
        word = word.replace("'", "")
        word = word.replace("ё", "е")
        word = word.replace("ъ", "ї")
        return word

    def s(self, st, reg, to):
        orig = st
        self.RV = re.sub(reg, to, st)
        return (orig != self.RV)

    def stem_word(self):
        word = self.ukstemmer_search_preprocess(self.word)
        if not re.search('[аеиоуюяіїє]', word):
            stem = word
        else:
            p = re.search(self.rvre, word)
            start = word[0:p.span()[1]]
            self.RV = word[p.span()[1]:]

            # Step 1
            if not self.s(self.RV, self.perfectiveground, ''):

                self.s(self.RV, self.reflexive, '')
                if self.s(self.RV, self.adjective, ''):
                    self.s(self.RV, self.participle, '')
                else:
                    if not self.s(self.RV, self.verb, ''):
                        self.s(self.RV, self.noun, '')
            # Step 2
            self.s(self.RV, 'и$', '')

            # Step 3
            if re.search(self.derivational, self.RV):
                self.s(self.RV, 'ость$', '')

            # Step 4
            if self.s(self.RV, 'ь$', ''):
                self.s(self.RV, 'ейше?$', '')
                self.s(self.RV, 'нн$', u'н')

            stem = start + self.RV
        return stem
