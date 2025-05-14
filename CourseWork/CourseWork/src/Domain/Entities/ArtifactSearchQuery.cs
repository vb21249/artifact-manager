using System.Collections.Generic;

namespace CourseWork.Domain.Entities
{
    /// <summary>
    /// Represents search criteria for filtering software development artifacts.
    /// </summary>
    public class ArtifactSearchQuery
    {
        public string SearchTerm { get; set; }
        public string ProgrammingLanguage { get; set; }
        public string Framework { get; set; }
        public string LicenseType { get; set; }
        public List<int> CategoryIds { get; set; } = new List<int>();
        public List<string> FileExtensions { get; set; } = new List<string>();
        public List<string> FileTypes { get; set; } = new List<string>();
        public string SortingField { get; set; }
        public bool SortDescending { get; set; }
    }
}
