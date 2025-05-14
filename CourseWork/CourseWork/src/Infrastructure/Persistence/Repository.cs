using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using CourseWork.Application.Interfaces;

namespace CourseWork.Infrastructure.Persistence
{
    /// <summary>
    /// Generic repository implementation using Entity Framework Core.
    /// </summary>
    public class Repository<T> : IRepository<T> where T : class
    {
        protected readonly ArtifactsDbContext _context;
        protected readonly DbSet<T> _dbSet;

        public Repository(ArtifactsDbContext context)
        {
            _context = context;
            _dbSet = context.Set<T>();
        }

        public virtual IEnumerable<T> GetAll()
        {
            return _dbSet.ToList();
        }

        public virtual T GetById(int id)
        {
            return _dbSet.Find(id);
        }

        public virtual void Add(T entity)
        {
            _dbSet.Add(entity);
        }

        public virtual void Update(T entity)
        {
            _dbSet.Attach(entity);
            _context.Entry(entity).State = EntityState.Modified;
        }

        public virtual void Delete(int id)
        {
            T entity = _dbSet.Find(id);
            if (entity != null)
            {
                _dbSet.Remove(entity);
            }
        }

        public virtual IEnumerable<T> FindByExample(T example)
        {
            // Basic implementation - override in specific repositories for custom logic
            return _dbSet.ToList();
        }
    }
}
