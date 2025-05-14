using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CourseWork.Domain.Entities
{
    /// <summary>
    /// Represents a software development artifact with version history.
    /// </summary>
    public class SoftwareDevArtifact
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(200)]
        public string Title { get; set; }

        [StringLength(2000)]
        public string Description { get; set; }

        [Required]
        [Url]
        public string Url { get; set; }

        [Required]
        [StringLength(50)]
        public string DocumentationType { get; set; }

        public DateTime Created { get; set; }

        [Required]
        [StringLength(100)]
        public string Author { get; set; }

        [Required]
        [StringLength(20)]
        public string CurrentVersion { get; set; }

        [StringLength(50)]
        public string ProgrammingLanguage { get; set; }

        [StringLength(50)]
        public string Framework { get; set; }

        [StringLength(50)]
        public string LicenseType { get; set; }

        // Navigation properties
        public int CategoryId { get; set; }
        public virtual Category Category { get; set; }

        public virtual ICollection<ArtifactVersion> Versions { get; set; } = new List<ArtifactVersion>();

        public void AddVersion(ArtifactVersion version)
        {
            if (version == null) throw new ArgumentNullException(nameof(version));
            version.SoftwareDevArtifact = this;
            Versions.Add(version);
            CurrentVersion = version.VersionNumber;
        }

        public List<ArtifactVersion> GetVersionHistory()
        {
            return new List<ArtifactVersion>(Versions);
        }
    }
}
