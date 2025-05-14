using System;
using CourseWork.Application.Interfaces;

namespace CourseWork.Infrastructure.Persistence
{
    /// <summary>
    /// Implementation of the Unit of Work pattern to manage transactions and repository instances.
    /// </summary>
    public class UnitOfWork : IUnitOfWork
    {
        private readonly ArtifactsDbContext _context;
        private ICategoryRepository _categoryRepository;
        private ISoftwareDevArtifactRepository _softwareDevArtifactRepository;
        private bool _disposed;

        public UnitOfWork(ArtifactsDbContext context)
        {
            _context = context;
        }

        public ICategoryRepository CategoryRepository
        {
            get
            {
                return _categoryRepository ??= new CategoryRepository(_context);
            }
        }

        public ISoftwareDevArtifactRepository SoftwareDevArtifactRepository
        {
            get
            {
                return _softwareDevArtifactRepository ??= new SoftwareDevArtifactRepository(_context);
            }
        }

        public void Save()
        {
            _context.SaveChanges();
        }

        protected virtual void Dispose(bool disposing)
        {
            if (!_disposed && disposing)
            {
                _context.Dispose();
            }
            _disposed = true;
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }
    }
}
