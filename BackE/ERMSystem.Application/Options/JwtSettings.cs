namespace ERMSystem.Application.Options;

public class JwtSettings
{
    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = "ERMSystem";
    public string Audience { get; set; } = "ERMSystemUsers";
    public int ExpiryMinutes { get; set; } = 60;
    public int RefreshTokenExpiryDays { get; set; } = 14;
}
