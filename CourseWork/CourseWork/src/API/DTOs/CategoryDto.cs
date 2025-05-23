using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CourseWork.API.DTOs
{
    public class CategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int? ParentCategoryId { get; set; }
        public int Position { get; set; }
        public string Path { get; set; }
        public List<CategoryDto> Subcategories { get; set; } = new();
        public List<ArtifactDto> Artifacts { get; set; } = new();
        public int ArtifactsCount { get; set; }
    }

    public class CreateCategoryDto
    {
        [Required]
        [StringLength(100, MinimumLength = 3)]
        public string Name { get; set; }
        public int? ParentCategoryId { get; set; }
        public int Position { get; set; }
    }

    public class UpdateCategoryDto
    {
        [Required]
        [StringLength(100, MinimumLength = 3)]
        public string Name { get; set; }
        public int Position { get; set; }
    }

    public class RearrangeCategoryDto
    {
        [Required]
        [Range(0, int.MaxValue)]
        public int NewPosition { get; set; }
    }
}
