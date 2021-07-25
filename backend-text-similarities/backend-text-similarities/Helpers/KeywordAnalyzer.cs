using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend_text_similarities.Helpers
{
    public class KeywordAnalyzer
    {
        public static KeywordAnalysis Analyze(string content)
        {
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
                if(word.Value >= 3)
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
