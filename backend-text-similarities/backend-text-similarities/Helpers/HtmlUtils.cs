using System.Collections.Generic;

namespace backend_text_similarities.Helpers
{
    public class HtmlElement
    {
        public string Selector { get; set; }
        public string InnerText { get; set; }
    }

    public class SimilarElementsSearch
    {
        public List<HtmlElement> Elements { get; set; }
        public List<string> Keywords { get; set; }
    }
}