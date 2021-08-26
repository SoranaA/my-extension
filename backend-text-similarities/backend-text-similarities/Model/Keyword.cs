using System.Collections.Generic;

namespace backend_text_similarities.Helpers
{
    public class KeywordAnalysis
    {
        public string Content { get; set; }
        public int WordCount { get; set; }
        public IEnumerable<Keyword> Keywords { get; set; }
    }

    public class Keyword
    {
        public string Word { get; set; }
        public decimal Rank { get; set; }
    }
}