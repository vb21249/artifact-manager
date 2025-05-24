using System.ComponentModel.DataAnnotations;

namespace CourseWork.API.DTOs
{
    public class MoveCategoryToRequest
    {
        [Required]
        public int NewParentId { get; set; }
        
        // Position in the new parent's children list (0-based index)
        public int? Position { get; set; }
    }
}
