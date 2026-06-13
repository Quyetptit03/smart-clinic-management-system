using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.IdentityModel.Tokens;
using ERMSystem.Application.DTOs;
using ERMSystem.Application.Interfaces;
using ERMSystem.Application.Options;
using ERMSystem.Domain.Entities;

namespace ERMSystem.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly JwtSettings _jwtSettings;

        public AuthService(IUserRepository userRepository, JwtSettings jwtSettings)
        {
            _userRepository = userRepository;
            _jwtSettings = jwtSettings;
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
                Role = AppRole.Receptionist,
                IsLocked = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _userRepository.AddAsync(user);

            var refreshToken = await CreateRefreshTokenAsync(user);
            return BuildAuthResponse(user, refreshToken.Token);
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
        {
            var user = await _userRepository.GetByUsernameAsync(loginDto.Username.Trim());
            if (user == null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
                throw new UnauthorizedAccessException("Invalid username or password.");

            if (user.IsLocked)
                throw new UnauthorizedAccessException("Your account has been locked. Contact an administrator.");

            // Revoke any existing tokens (single-device session) to enforce clean rotation on re-login.
            await _userRepository.RevokeAllUserTokensAsync(user.Id);

            var refreshToken = await CreateRefreshTokenAsync(user);
            return BuildAuthResponse(user, refreshToken.Token);
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
                Role = createUserDto.Role,
                IsLocked = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _userRepository.AddAsync(user);

            var refreshToken = await CreateRefreshTokenAsync(user);
            return BuildAuthResponse(user, refreshToken.Token);
        }

        public async Task<RefreshResponseDto> RefreshTokenAsync(RefreshRequestDto request)
        {
            // 1. Validate the refresh token exists and is active.
            var storedToken = await _userRepository.GetRefreshTokenAsync(request.RefreshToken);
            if (storedToken == null)
                throw new SecurityTokenException("Invalid refresh token.");

            // 2. Check token is not expired.
            if (storedToken.IsExpired)
                throw new SecurityTokenException("Refresh token has expired. Please log in again.");

            // 3. Check token is not revoked (prevents reuse attacks).
            if (storedToken.IsRevoked)
                throw new SecurityTokenException("Refresh token has been revoked. Please log in again.");

            var user = storedToken.User;

            // 4. Validate the user still exists and is not locked.
            if (user == null)
                throw new UnauthorizedAccessException("User not found.");
            if (user.IsLocked)
                throw new UnauthorizedAccessException("Your account has been locked. Contact an administrator.");

            // 5. ROTATION: revoke the old token so it cannot be reused.
            storedToken.RevokedAt = DateTime.UtcNow;
            storedToken.ReplacedByToken = request.RefreshToken; // record rotation chain
            await _userRepository.UpdateRefreshTokenAsync(storedToken);

            // 6. ISSUE: generate a brand-new pair.
            var newAccessToken = GenerateJwtToken(user);
            var expiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryMinutes);
            var newRefreshToken = await CreateRefreshTokenAsync(user);

            return new RefreshResponseDto
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken.Token,
                Username = user.Username,
                Role = user.Role,
                ExpiresAt = expiresAt
            };
        }

        public async Task RevokeRefreshTokenAsync(string refreshToken)
        {
            var storedToken = await _userRepository.GetRefreshTokenAsync(refreshToken);
            if (storedToken == null) return; // no-op if already gone

            storedToken.RevokedAt = DateTime.UtcNow;
            await _userRepository.UpdateRefreshTokenAsync(storedToken);
        }

        private async Task<RefreshToken> CreateRefreshTokenAsync(AppUser user)
        {
            var randomBytes = new byte[CryptoRandomByteCount];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomBytes);
            }

            var token = new RefreshToken
            {
                Id = Guid.NewGuid(),
                Token = Convert.ToBase64String(randomBytes),
                UserId = user.Id,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryDays)
            };

            await _userRepository.AddRefreshTokenAsync(token);
            return token;
        }

        private AuthResponseDto BuildAuthResponse(AppUser user, string refreshToken)
        {
            var expiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryMinutes);
            var token = GenerateJwtToken(user);

            return new AuthResponseDto
            {
                Token = token,
                RefreshToken = refreshToken,
                Username = user.Username,
                Role = user.Role,
                ExpiresAt = expiresAt
            };
        }

        private string GenerateJwtToken(AppUser user)
        {
            var expiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryMinutes);
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Key));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var token = new JwtSecurityToken(
                issuer: _jwtSettings.Issuer,
                audience: _jwtSettings.Audience,
                claims: claims,
                expires: expiresAt,
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private const int CryptoRandomByteCount = 64;
    }
}
