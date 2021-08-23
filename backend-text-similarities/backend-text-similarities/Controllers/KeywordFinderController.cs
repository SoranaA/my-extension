using backend_text_similarities.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;

namespace backend_text_similarities.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class KeywordFinderController : ControllerBase
    {
        private readonly ILogger<KeywordFinderController> _logger;

        public KeywordFinderController(ILogger<KeywordFinderController> logger)
        {
            _logger = logger;
        }

        [HttpPost]
        public IEnumerable<string> GetKeywords(TextToParse text)
        {
            var keywords = new List<string>();

            if (string.IsNullOrEmpty(text.Text))
            {
                return keywords;
            }

            var keywordsObjects = KeywordAnalyzer.Analyze(text.Text).Keywords;

            foreach (var kw in keywordsObjects)
            {
                keywords.Add(kw.Word);
            }

            return keywords;
        }

        [HttpPost("similarElements")]
        public List<string> GetSimilarElementsByKeywords(SimilarElementsSearch elementsList)
        {
            var selectors = new List<string>();

            foreach (var element in elementsList.Elements)
            {
                var keywordsContained = 0;

                foreach (var keyword in elementsList.Keywords)
                {
                    if (element.InnerText.Contains(keyword))
                    {
                        keywordsContained++;
                    }
                }

                if (keywordsContained > 2)
                {
                    selectors.Add(element.Selector);
                }
            }

            return selectors;
        }
    }
}