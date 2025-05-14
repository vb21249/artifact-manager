using System;
using System.ComponentModel.DataAnnotations;

namespace CourseWork.Domain.Entities
{
    /// <summary>
    /// Represents a specific version of a software development artifact.
    /// </summary>
    public class ArtifactVersion
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(20)]
        public string VersionNumber { get; set; }

        public DateTime UpdateDate { get; set; }

        [StringLength(2000)]
        public string Changes { get; set; }

        [Required]
        [Url]
        public string DownloadUrl { get; set; }

        // Navigation property
        public int SoftwareDevArtifactId { get; set; }
        public virtual SoftwareDevArtifact SoftwareDevArtifact { get; set; }
    }
}
