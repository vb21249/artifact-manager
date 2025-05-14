using System;
using System.Collections.Generic;
using FluentValidation;

namespace CourseWork.Domain.Entities.Validation
{
    public class ArtifactMetadataValidator : AbstractValidator<SoftwareDevArtifact>
    {
        public ArtifactMetadataValidator()
        {
            RuleFor(x => x.Title)
                .NotEmpty().WithMessage("Title is required")
                .Length(3, 200).WithMessage("Title must be between 3 and 200 characters");

            RuleFor(x => x.Description)
                .NotEmpty().WithMessage("Description is required")
                .MaximumLength(2000).WithMessage("Description cannot exceed 2000 characters");

            RuleFor(x => x.Url)
                .NotEmpty().WithMessage("URL is required")
                .Must(uri => Uri.TryCreate(uri, UriKind.Absolute, out _))
                .WithMessage("Invalid URL format");

            RuleFor(x => x.DocumentationType)
                .NotEmpty().WithMessage("Documentation type is required")
                .Must(BeValidDocumentationType)
                .WithMessage("Invalid documentation type");

            RuleFor(x => x.Author)
                .NotEmpty().WithMessage("Author is required")
                .Length(2, 100).WithMessage("Author name must be between 2 and 100 characters");

            RuleFor(x => x.CurrentVersion)
                .NotEmpty().WithMessage("Version is required")
                .Matches(@"^\d+\.\d+(\.\d+)?$")
                .WithMessage("Version must be in format: major.minor[.patch]");

            RuleFor(x => x.CategoryId)
                .NotEqual(0).WithMessage("Category must be specified");
        }

        private bool BeValidDocumentationType(string documentationType)
        {
            var validTypes = new HashSet<string>
            {
                "API Documentation",
                "User Guide",
                "Technical Specification",
                "Code Documentation",
                "Tutorial",
                "Sample Code",
                "Reference Manual"
            };

            return validTypes.Contains(documentationType);
        }
    }
}
