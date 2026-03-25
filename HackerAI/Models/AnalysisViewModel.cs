using System.Collections.Generic;

namespace HackerAI.Models
{
    public class AnalysisViewModel
    {
        public string OriginalIdea { get; set; } = string.Empty;
        public List<string> Keywords { get; set; } = new List<string>();
        public List<string> PromptVariations { get; set; } = new List<string>();
        public string LlmSampleResponse { get; set; } = string.Empty;
        public List<StructuredStep> StructuredSteps { get; set; } = new List<StructuredStep>();
    }

    public class StructuredStep
    {
        public string StepTitle { get; set; } = string.Empty;
        public string Objective { get; set; } = string.Empty;
        public string ObjectiveBridge { get; set; } = string.Empty;
        public string FinalPrompt { get; set; } = string.Empty;
    }
}
