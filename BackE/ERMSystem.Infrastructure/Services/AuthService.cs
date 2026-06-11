using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using ERMSystem.Application.DTOs;
using ERMSystem.Application.Interfaces;
using ERMSystem.Domain.Entities;

namespace ERMSystem.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IConfiguration _configuration;

        public AuthService(IUserRepository userRepository, IConfiguration configuration)
        {
            _userRepository = userRepository;
            _configuration = configuration;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto)
        {
            var username = registerDto.Username.Trim().ToLowerInvariant();
            var userExists = await _userRepository.UsernameExistsAsync(username);
            if (userExists)
                throw new InvalidOperationException($"Username '{username}' is already taken.");

            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                Username = username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password),
                Role = AppRole.Receptionist
            };

            await _userRepository.AddAsync(user);

            return BuildAuthResponse(user);
        }

        public async Task<AuthResponseDto> CreateUserAsync(CreateUserDto createUserDto)
        {
            var username = createUserDto.Username.Trim().ToLowerInvariant();
            var userExists = await _userRepository.UsernameExistsAsync(username);
            if (userExists)
                throw new InvalidOperationException($"Username '{username}' is already taken.");

            if (!Array.Exists(AppRole.All, r => r == createUserDto.Role))
                throw new ArgumentException($"Invalid role '{createUserDto.Role}'. Must be Admin, Doctor, or Receptionist.");

            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                Username = username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(createUserDto.Password),
                Role = createUserDto.Role
            };

            await _userRepository.AddAsync(user);

            return BuildAuthResponse(user);
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
        {
            var user = await _userRepository.GetByUsernameAsync(loginDto.Username.Trim());
            if (user == null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
                throw new UnauthorizedAccessException("Invalid username or password.");

            return BuildAuthResponse(user);
        }

        private AuthResponseDto BuildAuthResponse(AppUser user)
        {
            var expiryMinutes = int.Parse(_configuration["Jwt:ExpiryMinutes"] ?? "60");
            var expiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes);
            var token = GenerateJwtToken(user, expiresAt);

            return new AuthResponseDto
            {
                Token = token,
                Username = user.Username,
                Role = user.Role,
                ExpiresAt = expiresAt
            };
        }

        private string GenerateJwtToken(AppUser user, DateTime expiresAt)
        {
            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: expiresAt,
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
