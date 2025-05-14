using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CourseWork.API.DTOs
{
    public class ArtifactDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string Url { get; set; }
        public string DocumentationType { get; set; }
        public DateTime Created { get; set; }
        public string Author { get; set; }
        public string CurrentVersion { get; set; }
        public string ProgrammingLanguage { get; set; }
        public string Framework { get; set; }
        public string LicenseType { get; set; }
        public int CategoryId { get; set; }
        public List<ArtifactVersionDto> Versions { get; set; } = new();
    }

    public class CreateArtifactDto
    {
        [Required]
        [StringLength(200, MinimumLength = 3)]
        public string Title { get; set; }

        [Required]
        [StringLength(2000)]
        public string Description { get; set; }

        [Required]
        [Url]
        public string Url { get; set; }

        [Required]
        [StringLength(50)]
        public string DocumentationType { get; set; }

        [Required]
        [StringLength(100)]
        public string Author { get; set; }

        [Required]
        [RegularExpression(@"^\d+\.\d+(\.\d+)?$")]
        public string CurrentVersion { get; set; }

        [StringLength(50)]
        public string ProgrammingLanguage { get; set; }

        [StringLength(50)]
        public string Framework { get; set; }

        [StringLength(50)]
        public string LicenseType { get; set; }

        [Required]
        public int CategoryId { get; set; }
    }

    public class UpdateArtifactDto
    {
        [Required]
        [StringLength(200, MinimumLength = 3)]
        public string Title { get; set; }

        [Required]
        [StringLength(2000)]
        public string Description { get; set; }

        [Required]
        [Url]
        public string Url { get; set; }

        [StringLength(50)]
        public string ProgrammingLanguage { get; set; }

        [StringLength(50)]
        public string Framework { get; set; }

        [StringLength(50)]
        public string LicenseType { get; set; }
    }

    public class ArtifactVersionDto
    {
        public int Id { get; set; }
        public string VersionNumber { get; set; }
        public DateTime UpdateDate { get; set; }
        public string Changes { get; set; }
        public string DownloadUrl { get; set; }
    }

    public class CreateArtifactVersionDto
    {
        [Required]
        [RegularExpression(@"^\d+\.\d+(\.\d+)?$")]
        public string VersionNumber { get; set; }

        [Required]
        [StringLength(2000)]
        public string Changes { get; set; }

        [Required]
        [Url]
        public string DownloadUrl { get; set; }
    }

    public class ArtifactSearchDto
    {
        public string SearchTerm { get; set; }
        public string ProgrammingLanguage { get; set; }
        public string Framework { get; set; }
        public string LicenseType { get; set; }
        public List<int> CategoryIds { get; set; }
        public string SortField { get; set; }
        public bool SortDescending { get; set; }
    }
}
