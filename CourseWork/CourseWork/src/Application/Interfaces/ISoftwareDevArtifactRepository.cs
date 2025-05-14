using System.Collections.Generic;
using CourseWork.Domain.Entities;

namespace CourseWork.Application.Interfaces
{
    /// <summary>
    /// Interface for software development artifact-specific repository operations.
    /// </summary>
    public interface ISoftwareDevArtifactRepository : IRepository<SoftwareDevArtifact>
    {
        IEnumerable<SoftwareDevArtifact> GetByCategory(int categoryId);
        void AddVersion(int artifactId, ArtifactVersion version);
        IEnumerable<ArtifactVersion> GetVersionHistory(int artifactId);
        IEnumerable<SoftwareDevArtifact> Search(string query);
        IEnumerable<SoftwareDevArtifact> FilterByProgrammingLanguage(string language);
        IEnumerable<SoftwareDevArtifact> FilterByFramework(string framework);
        IEnumerable<SoftwareDevArtifact> FilterByLicenseType(string licenseType);
        IEnumerable<SoftwareDevArtifact> FilterByCombinedCriteria(ArtifactSearchQuery searchQuery);
    }
}
