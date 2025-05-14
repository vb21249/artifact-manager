using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using CourseWork.Application.Interfaces;
using CourseWork.Domain.Entities;

namespace CourseWork.Infrastructure.Persistence
{
    /// <summary>
    /// Implementation of the software development artifact repository with specific artifact-related operations.
    /// </summary>
    public class SoftwareDevArtifactRepository : Repository<SoftwareDevArtifact>, ISoftwareDevArtifactRepository
    {
        public SoftwareDevArtifactRepository(ArtifactsDbContext context) : base(context)
        {
        }

        public IEnumerable<SoftwareDevArtifact> GetByCategory(int categoryId)
        {
            return _dbSet.Where(a => a.CategoryId == categoryId)
                        .Include(a => a.Versions)
                        .ToList();
        }

        public void AddVersion(int artifactId, ArtifactVersion version)
        {
            var artifact = _dbSet.Find(artifactId);
            if (artifact != null)
            {
                artifact.AddVersion(version);
                _context.SaveChanges();
            }
        }

        public IEnumerable<ArtifactVersion> GetVersionHistory(int artifactId)
        {
            return _context.Set<ArtifactVersion>()
                          .Where(v => v.SoftwareDevArtifactId == artifactId)
                          .OrderByDescending(v => v.UpdateDate)
                          .ToList();
        }

        public IEnumerable<SoftwareDevArtifact> Search(string query)
        {
            return _dbSet.Where(a => a.Title.Contains(query) || 
                                   a.Description.Contains(query))
                        .Include(a => a.Versions)
                        .ToList();
        }

        public IEnumerable<SoftwareDevArtifact> FilterByProgrammingLanguage(string language)
        {
            return _dbSet.Where(a => a.ProgrammingLanguage == language)
                        .Include(a => a.Versions)
                        .ToList();
        }

        public IEnumerable<SoftwareDevArtifact> FilterByFramework(string framework)
        {
            return _dbSet.Where(a => a.Framework == framework)
                        .Include(a => a.Versions)
                        .ToList();
        }

        public IEnumerable<SoftwareDevArtifact> FilterByLicenseType(string licenseType)
        {
            return _dbSet.Where(a => a.LicenseType == licenseType)
                        .Include(a => a.Versions)
                        .ToList();
        }

        public IEnumerable<SoftwareDevArtifact> FilterByCombinedCriteria(ArtifactSearchQuery searchQuery)
        {
            var query = _dbSet.AsQueryable();

            if (!string.IsNullOrEmpty(searchQuery.SearchTerm))
            {
                query = query.Where(a => a.Title.Contains(searchQuery.SearchTerm) || 
                                       a.Description.Contains(searchQuery.SearchTerm));
            }

            if (!string.IsNullOrEmpty(searchQuery.ProgrammingLanguage))
            {
                query = query.Where(a => a.ProgrammingLanguage == searchQuery.ProgrammingLanguage);
            }

            if (!string.IsNullOrEmpty(searchQuery.Framework))
            {
                query = query.Where(a => a.Framework == searchQuery.Framework);
            }

            if (!string.IsNullOrEmpty(searchQuery.LicenseType))
            {
                query = query.Where(a => a.LicenseType == searchQuery.LicenseType);
            }

            if (searchQuery.CategoryIds?.Any() == true)
            {
                query = query.Where(a => searchQuery.CategoryIds.Contains(a.CategoryId));
            }

            // Add sorting
            if (!string.IsNullOrEmpty(searchQuery.SortingField))
            {
                query = ApplySorting(query, searchQuery.SortingField, searchQuery.SortDescending);
            }

            return query.Include(a => a.Versions).ToList();
        }

        private IQueryable<SoftwareDevArtifact> ApplySorting(
            IQueryable<SoftwareDevArtifact> query, 
            string sortField, 
            bool descending)
        {
            return sortField.ToLower() switch
            {
                "title" => descending ? query.OrderByDescending(a => a.Title) 
                                    : query.OrderBy(a => a.Title),
                "created" => descending ? query.OrderByDescending(a => a.Created) 
                                      : query.OrderBy(a => a.Created),
                "author" => descending ? query.OrderByDescending(a => a.Author) 
                                     : query.OrderBy(a => a.Author),
                _ => query.OrderBy(a => a.Id)
            };
        }

        public override IEnumerable<SoftwareDevArtifact> GetAll()
        {
            return _dbSet.Include(a => a.Versions)
                        .Include(a => a.Category)
                        .ToList();
        }
    }
}
