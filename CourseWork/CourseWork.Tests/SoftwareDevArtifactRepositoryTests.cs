using Xunit;
using Microsoft.EntityFrameworkCore;
using CourseWork.Infrastructure.Persistence;
using CourseWork.Domain.Entities;
using System.Linq;
using System;
using System.Collections.Generic;

namespace CourseWork.Tests
{
    public class SoftwareDevArtifactRepositoryTests
    {
        private DbContextOptions<ArtifactsDbContext> GetInMemoryDbOptions()
        {
            return new DbContextOptionsBuilder<ArtifactsDbContext>()
                .UseInMemoryDatabase(databaseName: System.Guid.NewGuid().ToString())
                .Options;
        }

        [Fact]
        public void GetByCategory_ShouldReturnArtifactsInCategory()
        {
            // Arrange
            var options = GetInMemoryDbOptions();
            using var context = new ArtifactsDbContext(options);
            var repository = new SoftwareDevArtifactRepository(context);

            var category = new Category { Name = "Test Category", Path = "/1" };
            context.Categories.Add(category);
            context.SaveChanges();

            var artifacts = new[]
            {
                new SoftwareDevArtifact 
                { 
                    Title = "Artifact1", 
                    CategoryId = category.Id,
                    Description = "Test description",
                    DocumentationType = "Manual",
                    Url = "http://example.com",
                    Author = "Test Author",
                    CurrentVersion = "1.0",
                    Created = DateTime.Now,
                    Framework = ".NET",
                    ProgrammingLanguage = "C#",
                    LicenseType = "MIT"
                },
                new SoftwareDevArtifact 
                { 
                    Title = "Artifact2", 
                    CategoryId = category.Id,
                    Description = "Test description",
                    DocumentationType = "Manual",
                    Url = "http://example.com",
                    Author = "Test Author",
                    CurrentVersion = "1.0",
                    Created = DateTime.Now,
                    Framework = ".NET",
                    ProgrammingLanguage = "C#",
                    LicenseType = "MIT"
                }
            };
            context.Artifacts.AddRange(artifacts);
            context.SaveChanges();

            // Act
            var result = repository.GetByCategory(category.Id).ToList();

            // Assert
            Assert.Equal(2, result.Count);
            Assert.All(result, a => Assert.Equal(category.Id, a.CategoryId));
        }

        [Fact]
        public void AddVersion_ShouldAddVersionToArtifact()
        {
            // Arrange
            var options = GetInMemoryDbOptions();
            using var context = new ArtifactsDbContext(options);
            var repository = new SoftwareDevArtifactRepository(context);

            var artifact = new SoftwareDevArtifact 
            { 
                Title = "Test Artifact",
                Description = "Test description",
                DocumentationType = "Manual",
                Url = "http://example.com",
                Author = "Test Author",
                CurrentVersion = "1.0",
                Created = DateTime.Now,
                Framework = ".NET",
                ProgrammingLanguage = "C#",
                LicenseType = "MIT"
            };
            context.Artifacts.Add(artifact);
            context.SaveChanges();

            var version = new ArtifactVersion 
            { 
                VersionNumber = "1.0.0", 
                Changes = "Initial version",
                DownloadUrl = "http://example.com/download/1.0.0",
                UpdateDate = DateTime.Now
            };

            // Act
            repository.AddVersion(artifact.Id, version);

            // Assert
            var updatedArtifact = context.Artifacts
                .Include(a => a.Versions)
                .First(a => a.Id == artifact.Id);
            Assert.Single(updatedArtifact.Versions);
            Assert.Equal("1.0.0", updatedArtifact.Versions.First().VersionNumber);
        }

        [Fact]
        public void FilterByFramework_ShouldReturnMatchingArtifacts()
        {
            // Arrange
            var options = GetInMemoryDbOptions();
            using var context = new ArtifactsDbContext(options);
            var repository = new SoftwareDevArtifactRepository(context);

            var artifacts = new[]
            {
                new SoftwareDevArtifact 
                { 
                    Title = "Artifact1",
                    Description = "Test description",
                    DocumentationType = "Manual",
                    Url = "http://example.com",
                    Author = "Test Author",
                    CurrentVersion = "1.0",
                    Created = DateTime.Now,
                    Framework = ".NET",
                    ProgrammingLanguage = "C#",
                    LicenseType = "MIT"
                },
                new SoftwareDevArtifact 
                { 
                    Title = "Artifact2",
                    Description = "Test description",
                    DocumentationType = "Manual",
                    Url = "http://example.com",
                    Author = "Test Author",
                    CurrentVersion = "1.0",
                    Created = DateTime.Now,
                    Framework = "Java",
                    ProgrammingLanguage = "Java",
                    LicenseType = "GPL"
                },
                new SoftwareDevArtifact 
                { 
                    Title = "Artifact3",
                    Description = "Test description",
                    DocumentationType = "Manual",
                    Url = "http://example.com",
                    Author = "Test Author",
                    CurrentVersion = "1.0",
                    Created = DateTime.Now,
                    Framework = ".NET",
                    ProgrammingLanguage = "C#",
                    LicenseType = "MIT"
                }
            };
            context.Artifacts.AddRange(artifacts);
            context.SaveChanges();

            // Act
            var result = repository.FilterByFramework(".NET").ToList();

            // Assert
            Assert.Equal(2, result.Count);
            Assert.All(result, a => Assert.Equal(".NET", a.Framework));
        }

        [Fact]
        public void GetAll_ShouldIncludeVersionsAndCategory()
        {
            // Arrange
            var options = GetInMemoryDbOptions();
            using var context = new ArtifactsDbContext(options);
            var repository = new SoftwareDevArtifactRepository(context);

            var category = new Category { Name = "Test Category", Path = "/1" };
            context.Categories.Add(category);

            var artifact = new SoftwareDevArtifact 
            { 
                Title = "Test Artifact", 
                CategoryId = category.Id,
                Description = "Test description",
                DocumentationType = "Manual",
                Url = "http://example.com",
                Author = "Test Author",
                CurrentVersion = "1.0",
                Created = DateTime.Now,
                Framework = ".NET",
                ProgrammingLanguage = "C#",
                LicenseType = "MIT",
                Versions = new List<ArtifactVersion> 
                { 
                    new ArtifactVersion 
                    { 
                        VersionNumber = "1.0.0",
                        Changes = "Initial version",
                        DownloadUrl = "http://example.com/download/1.0.0",
                        UpdateDate = DateTime.Now
                    } 
                }
            };
            context.Artifacts.Add(artifact);
            context.SaveChanges();

            // Act
            var result = repository.GetAll().First();

            // Assert
            Assert.NotNull(result.Category);
            Assert.NotEmpty(result.Versions);
        }

        [Fact]
        public void FilterByProgrammingLanguage_ShouldReturnMatchingArtifacts()
        {
            // Arrange
            var options = GetInMemoryDbOptions();
            using var context = new ArtifactsDbContext(options);
            var repository = new SoftwareDevArtifactRepository(context);

            var artifacts = new[]
            {
                new SoftwareDevArtifact 
                { 
                    Title = "Artifact1",
                    Description = "Test description",
                    DocumentationType = "Manual",
                    Url = "http://example.com",
                    Author = "Test Author",
                    CurrentVersion = "1.0",
                    Created = DateTime.Now,
                    Framework = ".NET",
                    ProgrammingLanguage = "C#",
                    LicenseType = "MIT"
                },
                new SoftwareDevArtifact 
                { 
                    Title = "Artifact2",
                    Description = "Test description",
                    DocumentationType = "Manual",
                    Url = "http://example.com",
                    Author = "Test Author",
                    CurrentVersion = "1.0",
                    Created = DateTime.Now,
                    Framework = "Java",
                    ProgrammingLanguage = "Java",
                    LicenseType = "GPL"
                },
                new SoftwareDevArtifact 
                { 
                    Title = "Artifact3",
                    Description = "Test description",
                    DocumentationType = "Manual",
                    Url = "http://example.com",
                    Author = "Test Author",
                    CurrentVersion = "1.0",
                    Created = DateTime.Now,
                    Framework = ".NET",
                    ProgrammingLanguage = "C#",
                    LicenseType = "MIT"
                }
            };
            context.Artifacts.AddRange(artifacts);
            context.SaveChanges();

            // Act
            var result = repository.FilterByProgrammingLanguage("C#").ToList();

            // Assert
            Assert.Equal(2, result.Count);
            Assert.All(result, a => Assert.Equal("C#", a.ProgrammingLanguage));
        }

        [Fact]
        public void FilterByLicenseType_ShouldReturnMatchingArtifacts()
        {
            // Arrange
            var options = GetInMemoryDbOptions();
            using var context = new ArtifactsDbContext(options);
            var repository = new SoftwareDevArtifactRepository(context);

            var artifacts = new[]
            {
                new SoftwareDevArtifact 
                { 
                    Title = "Artifact1",
                    Description = "Test description",
                    DocumentationType = "Manual",
                    Url = "http://example.com",
                    Author = "Test Author",
                    CurrentVersion = "1.0",
                    Created = DateTime.Now,
                    Framework = ".NET",
                    ProgrammingLanguage = "C#",
                    LicenseType = "MIT"
                },
                new SoftwareDevArtifact 
                { 
                    Title = "Artifact2",
                    Description = "Test description",
                    DocumentationType = "Manual",
                    Url = "http://example.com",
                    Author = "Test Author",
                    CurrentVersion = "1.0",
                    Created = DateTime.Now,
                    Framework = "Java",
                    ProgrammingLanguage = "Java",
                    LicenseType = "GPL"
                },
                new SoftwareDevArtifact 
                { 
                    Title = "Artifact3",
                    Description = "Test description",
                    DocumentationType = "Manual",
                    Url = "http://example.com",
                    Author = "Test Author",
                    CurrentVersion = "1.0",
                    Created = DateTime.Now,
                    Framework = ".NET",
                    ProgrammingLanguage = "C#",
                    LicenseType = "MIT"
                }
            };
            context.Artifacts.AddRange(artifacts);
            context.SaveChanges();

            // Act
            var result = repository.FilterByLicenseType("MIT").ToList();

            // Assert
            Assert.Equal(2, result.Count);
            Assert.All(result, a => Assert.Equal("MIT", a.LicenseType));
        }
    }
}
