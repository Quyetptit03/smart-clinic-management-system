using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ERMSystem.Application.Interfaces;
using ERMSystem.Domain.Entities;
using ERMSystem.Infrastructure.Data;

namespace ERMSystem.Infrastructure.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly ApplicationDbContext _context;

        public UserRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IReadOnlyList<AppUser>> GetAllAsync()
        {
            return await _context.AppUsers
                .OrderBy(u => u.Username)
                .ToListAsync();
        }

        public async Task<AppUser?> GetByIdAsync(Guid id)
        {
            return await _context.AppUsers.FindAsync(id);
        }

        public async Task<AppUser?> GetByUsernameAsync(string username)
        {
            var normalized = username.Trim().ToLower();
            return await _context.AppUsers
                .FirstOrDefaultAsync(u => u.Username.ToLower() == normalized);
        }

        public async Task<bool> UsernameExistsAsync(string username)
        {
            var normalized = username.Trim().ToLower();
            return await _context.AppUsers.AnyAsync(u => u.Username.ToLower() == normalized);
        }

        public async Task AddAsync(AppUser user)
        {
            user.CreatedAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.AppUsers.AddAsync(user);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(AppUser user)
        {
            user.UpdatedAt = DateTime.UtcNow;
            _context.AppUsers.Update(user);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var user = await _context.AppUsers.FindAsync(id);
            if (user != null)
            {
                _context.AppUsers.Remove(user);
                await _context.SaveChangesAsync();
            }
        }

        public async Task LockAsync(Guid id)
        {
            var user = await _context.AppUsers.FindAsync(id);
            if (user != null)
            {
                user.IsLocked = true;
                user.LockedAt = DateTime.UtcNow;
                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async Task UnlockAsync(Guid id)
        {
            var user = await _context.AppUsers.FindAsync(id);
            if (user != null)
            {
                user.IsLocked = false;
                user.LockedAt = null;
                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }
    }
}
