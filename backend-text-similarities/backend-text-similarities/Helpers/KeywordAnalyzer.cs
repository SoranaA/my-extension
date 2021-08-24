using System.Collections.Generic;

namespace backend_text_similarities.Helpers
{
    public class KeywordAnalyzer
    {
        private static readonly string[] ignoredCharacters = new string[]
        {
            ",", ".", "?", "!", ";", ":", "'", "\"", "(", ")", "[", "]", "-"
        };

        public static string ReplaceSpecialCharacters(string content)
        {
            foreach (var c in ignoredCharacters)
            {
                content = content.Replace(c, string.Empty);
            }

            content = content.Replace('ă', 'a');
            content = content.Replace('â', 'a');
            content = content.Replace('î', 'i');
            content = content.Replace('ș', 's');
            content = content.Replace('ş', 's');
            content = content.Replace('ț', 't');
            content = content.Replace('ţ', 't');

            return content;
        }

        public static KeywordAnalysis Analyze(string content)
        {
            content = ReplaceSpecialCharacters(content);

            KeywordAnalysis analysis = new KeywordAnalysis { Content = content };
            int wordCount = 0;

            var allWorlds = content.Split(' ');
            var wordDictionary = new Dictionary<string, int>();

            foreach (var word in allWorlds)
            {
                wordCount++;

                if (word.Length < 3)
                    continue;

                if (!wordDictionary.ContainsKey(word))
                {
                    wordDictionary.Add(word, 1);
                }
                else
                {
                    wordDictionary[word]++;
                }
            }

            var keywords = new List<Keyword>();

            foreach (var word in wordDictionary)
            {
                if (word.Value >= 3)
                {
                    keywords.Add(new Keyword
                    {
                        Word = word.Key,
                        Rank = word.Value,
                    });
                }
            }

            analysis.WordCount = wordCount;
            analysis.Keywords = keywords;

            return analysis;
        }
    }
}