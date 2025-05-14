using Microsoft.EntityFrameworkCore;
using CourseWork.Domain.Entities;

namespace CourseWork.Infrastructure.Persistence
{
    /// <summary>
    /// Entity Framework DbContext for the Software Development Artifacts Management System.
    /// </summary>
    public class ArtifactsDbContext : DbContext
    {
        public ArtifactsDbContext(DbContextOptions<ArtifactsDbContext> options)
            : base(options)
        {
        }

        public DbSet<Category> Categories { get; set; }
        public DbSet<SoftwareDevArtifact> Artifacts { get; set; }
        public DbSet<ArtifactVersion> ArtifactVersions { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Category hierarchy
            modelBuilder.Entity<Category>(entity =>
            {
                entity.HasMany(c => c.Subcategories)
                    .WithOne(c => c.ParentCategory)
                    .HasForeignKey(c => c.ParentCategoryId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(c => c.Path)
                    .IsRequired()
                    .HasMaxLength(1000);

                entity.HasIndex(c => c.Path);
                
                // Add index for ordering
                entity.HasIndex(c => new { c.ParentCategoryId, c.Position });
            });

            // Configure Category-Artifact relationship
            modelBuilder.Entity<Category>()
                .HasMany(c => c.Artifacts)
                .WithOne(a => a.Category)
                .HasForeignKey(a => a.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure Artifact-Version relationship
            modelBuilder.Entity<SoftwareDevArtifact>(entity =>
            {
                entity.HasMany(a => a.Versions)
                    .WithOne(v => v.SoftwareDevArtifact)
                    .HasForeignKey(v => v.SoftwareDevArtifactId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Add indexes for common queries
                entity.HasIndex(a => a.ProgrammingLanguage);
                entity.HasIndex(a => a.Framework);
                entity.HasIndex(a => a.LicenseType);
                entity.HasIndex(a => a.DocumentationType);
            });
        }
    }
}
