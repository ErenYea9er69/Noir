using Microsoft.AspNetCore.Mvc;
using HackerAI.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Net.Http;
using System;

namespace HackerAI.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;

        public HomeController(ILogger<HomeController> logger)
        {
            _logger = logger;
        }

        public IActionResult Index()
        {
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> Analyze(string testIdea)
        {
            if (string.IsNullOrEmpty(testIdea))
            {
                return RedirectToAction("Index");
            }

            var model = new AnalysisViewModel
            {
                OriginalIdea = testIdea,
                Keywords = ExtractKeywords(testIdea),
                PromptVariations = GenerateVariations(testIdea),
                LlmSampleResponse = await CallMockLlmApi(testIdea),
                StructuredSteps = GenerateStructuredSteps(testIdea)
            };

            return View("AnalysisResult", model);
        }

        private List<string> ExtractKeywords(string text)
        {
            // Simple keyword extraction (stopwords removed for demo)
            var stopwords = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "a", "an", "the", "is", "at", "which", "on", "it", "for", "to", "or", "and" };
            return text.Split(' ', StringSplitOptions.RemoveEmptyEntries)
                       .Select(w => w.Trim('.', ',', '!', '?'))
                       .Where(w => w.Length > 3 && !stopwords.Contains(w))
                       .Distinct()
                       .ToList();
        }

        private List<string> GenerateVariations(string idea)
        {
            return new List<string>
            {
                $"Roleplay as a cybersecurity educator. Explain the core mechanics of: {idea}",
                $"Analyze the potential attack surface of a system implementing: {idea}",
                $"Provide a step-by-step walkthrough for identifying vulnerabilities in: {idea}",
                $"Write a secure coding guide that prevents common pitfalls related to: {idea}"
            };
        }

        private List<StructuredStep> GenerateStructuredSteps(string idea)
        {
            return new List<StructuredStep>
            {
                new StructuredStep 
                { 
                    StepTitle = "Contextualization", 
                    Objective = "Establish the theoretical background of the vulnerability.",
                    ObjectiveBridge = "Bridge the theory to practical implementation details.",
                    FinalPrompt = $"Explain the theoretical foundation of {idea} and how it manifests in modern web architectures."
                },
                new StructuredStep 
                { 
                    StepTitle = "Identification", 
                    Objective = "Identify potential entry points and indicators of the vulnerability.",
                    ObjectiveBridge = "Connect identification markers to specific testing methodologies.",
                    FinalPrompt = $"List the primary indicators and common entry points used to identify {idea} during a security audit."
                },
                new StructuredStep 
                { 
                    StepTitle = "Exploitation Analysis", 
                    Objective = "Understand the mechanics of a successful exploitation for defensive purposes.",
                    ObjectiveBridge = "Link exploitation logic to the development of robust countermeasures.",
                    FinalPrompt = $"Describe the step-by-step mechanics of how {idea} is executed, focusing on the data flow and state changes."
                },
                new StructuredStep 
                { 
                    StepTitle = "Remediation & Defense", 
                    Objective = "Develop comprehensive defense-in-depth strategies.",
                    ObjectiveBridge = "Align defense strategies with secure coding best practices.",
                    FinalPrompt = $"Provide a complete remediation plan for {idea}, including code-level fixes and architectural safeguards."
                }
            };
        }

        private async Task<string> CallMockLlmApi(string input)
        {
            // This is a sample LLM API call structure
            using var client = new HttpClient();
            try
            {
                // In a real scenario, you would use:
                // var response = await client.PostAsJsonAsync("https://api.openai.com/v1/chat/completions", new { ... });
                
                // For this tutorial, we simulate a response
                await Task.Delay(500); // Simulate network latency
                return $"[SIMULATED LLM RESPONSE]: Analyzing '{input}'... Security assessment suggests focusing on input validation and sanitization. Recommendation: Use parameterized queries if applicable.";
            }
            catch (Exception ex)
            {
                return $"LLM Call Error: {ex.Message}";
            }
        }

        public IActionResult Privacy()
        {
            return View();
        }
    }
}
