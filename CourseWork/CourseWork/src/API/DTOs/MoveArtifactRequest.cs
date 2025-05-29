using System.ComponentModel.DataAnnotations;

namespace CourseWork.API.DTOs
{
    public class MoveArtifactRequest
    {
        [Required]
        public int NewCategoryId { get; set; }
        
        // Position in the new category's artifacts list (0-based index)
        public int? Position { get; set; }
    }
}
