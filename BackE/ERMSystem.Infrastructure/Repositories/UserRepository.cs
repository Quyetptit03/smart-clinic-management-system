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
            await _context.AppUsers.AddAsync(user);
            await _context.SaveChangesAsync();
        }
    }
}
