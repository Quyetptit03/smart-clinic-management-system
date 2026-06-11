using ERMSystem.Application.Interfaces;
using ERMSystem.Application.Options;
using ERMSystem.Application.Services;
using ERMSystem.Infrastructure.Repositories;
using ERMSystem.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ── Database ────────────────────────────────────────────────────────────────
builder.Services.AddDbContext<ERMSystem.Infrastructure.Data.ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── JWT Configuration ─────────────────────────────────────────────────────
// All JWT settings come from environment variables or .NET User Secrets.
// JwtSettings is registered as a singleton so AuthService and middleware share the same resolved values.
var jwtKey = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "ERMSystem";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "ERMSystemUsers";
var jwtExpiryMinutes = int.TryParse(builder.Configuration["Jwt:ExpiryMinutes"], out var m) ? m : 60;

if (builder.Environment.IsDevelopment())
{
    if (string.IsNullOrWhiteSpace(jwtKey))
    {
        jwtKey = "DEV_ONLY_FALLBACK_KEY_NOT_FOR_PRODUCTION_2026_32c";
        Console.WriteLine("[WARN] Jwt:Key is not configured. Using a DEV_ONLY_FALLBACK_KEY. " +
                          "Run 'dotnet user-secrets set Jwt:Key <your-secret>' in BackE/ERMSystem.API to fix this.");
    }
}
else
{
    if (string.IsNullOrWhiteSpace(jwtKey))
    {
        throw new InvalidOperationException(
            "JWT signing key is not configured. " +
            "Set the Jwt__Key environment variable (or use .NET User Secrets in Development) before starting the application.");
    }
}

var jwtSettings = new JwtSettings
{
    Key = jwtKey,
    Issuer = jwtIssuer,
    Audience = jwtAudience,
    ExpiryMinutes = jwtExpiryMinutes
};
builder.Services.AddSingleton(jwtSettings);

Console.WriteLine($"[JWT] Issuer   : {jwtSettings.Issuer}");
Console.WriteLine($"[JWT] Audience : {jwtSettings.Audience}");
Console.WriteLine($"[JWT] Key set  : True (length: {jwtSettings.Key.Length})");
Console.WriteLine($"[JWT] Expiry   : {jwtSettings.ExpiryMinutes} min");

// ── JWT Authentication ──────────────────────────────────────────────────────
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Key))
        };
    });

builder.Services.AddAuthorization();

// ── CORS (FIX CHÍNH Ở ĐÂY) ──────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",
                "https://localhost:3000"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// ── OpenAPI / Swagger ───────────────────────────────────────────────────────
builder.Services.AddOpenApi();

// ── DI – Auth ───────────────────────────────────────────────────────────────
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();

// ── DI – Patient ────────────────────────────────────────────────────────────
builder.Services.AddScoped<IPatientRepository, PatientRepository>();
builder.Services.AddScoped<IPatientService, PatientService>();

// ── DI – Doctor ─────────────────────────────────────────────────────────────
builder.Services.AddScoped<IDoctorRepository, DoctorRepository>();
builder.Services.AddScoped<IDoctorService, DoctorService>();

// ── DI – Medicine ───────────────────────────────────────────────────────────
builder.Services.AddScoped<IMedicineRepository, MedicineRepository>();
builder.Services.AddScoped<IMedicineService, MedicineService>();

// ── DI – Appointment ────────────────────────────────────────────────────────
builder.Services.AddScoped<IAppointmentRepository, AppointmentRepository>();
builder.Services.AddScoped<IAppointmentService, AppointmentService>();

// ── DI – MedicalRecord ──────────────────────────────────────────────────────
builder.Services.AddScoped<IMedicalRecordRepository, MedicalRecordRepository>();
builder.Services.AddScoped<IMedicalRecordService, MedicalRecordService>();

// ── DI – Prescription ───────────────────────────────────────────────────────
builder.Services.AddScoped<IPrescriptionRepository, PrescriptionRepository>();
builder.Services.AddScoped<IPrescriptionItemRepository, PrescriptionItemRepository>();
builder.Services.AddScoped<IPrescriptionService, PrescriptionService>();
builder.Services.AddScoped<IPrescriptionItemService, PrescriptionItemService>();

// ── DI – Dashboard ──────────────────────────────────────────────────────────
builder.Services.AddScoped<IDashboardService, DashboardService>();

builder.Services.AddControllers();

var app = builder.Build();

// ── HTTP Pipeline ───────────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

// ⚠️ CORS phải đặt trước Auth
app.UseCors("AllowFrontend");

// HTTPS redirect (giữ lại)
app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
