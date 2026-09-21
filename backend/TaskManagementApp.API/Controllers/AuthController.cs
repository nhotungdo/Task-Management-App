using TaskManagementApp.Infrastructure.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagementApp.Domain.Entities;
using TaskManagementApp.Infrastructure.Data;
using Google.Apis.Auth;

namespace TaskManagementApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly TaskManagementAppContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;
    private readonly IConfiguration _configuration;

    public AuthController(TaskManagementAppContext db, IPasswordHasher passwordHasher, ITokenService tokenService, IConfiguration configuration)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
        _configuration = configuration;
    }

    public record RegisterRequest(string Email, string Password, string? FullName);
    public record LoginRequest(string Email, string Password);
    public record GoogleLoginRequest(string Credential);

    [HttpPost("google")]
    [AllowAnonymous]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
    {
        try
        {
            var clientId = _configuration["Authentication:Google:ClientId"];
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { clientId }
            };
            var payload = await GoogleJsonWebSignature.ValidateAsync(request.Credential, settings);

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == payload.Email);
            if (user == null)
            {
                user = new User
                {
                    UserId = Guid.NewGuid(),
                    Email = payload.Email,
                    FullName = payload.Name,
                    PasswordHash = "google_oauth",
                    Role = "User",
                    CreatedAt = DateTime.UtcNow
                };
                _db.Users.Add(user);
                await _db.SaveChangesAsync();
            }

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Email),
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Role, user.Role)
            };
            var token = _tokenService.CreateToken(claims);
            return Ok(new { token, user = new { user.UserId, user.Email, user.FullName, user.Role } });
        }
        catch (InvalidJwtException)
        {
            return Unauthorized("Invalid Google Token. Please check your Client ID.");
        }
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest("Email and password are required");

        var exists = await _db.Users.AnyAsync(u => u.Email == request.Email);
        if (exists)
            return Conflict("Email already registered");

        var user = new User
        {
            UserId = Guid.NewGuid(),
            Email = request.Email.Trim(),
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            FullName = request.FullName,
            Role = "User",
            CreatedAt = DateTime.UtcNow
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return Ok(new { user.UserId, user.Email, user.FullName, user.Role });
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
            return Unauthorized("Invalid credentials");

        if (user.Is2FAEnabled)
        {
            // Return temporary token or just a flag. For simplicity, we can return a short-lived temp token or just tell frontend to call Login2FA with email+password+code.
            // A better way is returning a temp token.
            var tempClaims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
                new Claim("Temp2FA", "true")
            };
            var tempToken = _tokenService.CreateToken(tempClaims);
            return Ok(new { Requires2FA = true, TempToken = tempToken });
        }

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Email),
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Role, user.Role)
        };
        var token = _tokenService.CreateToken(claims);
        return Ok(new { token, user = new { user.UserId, user.Email, user.FullName, user.Role } });
    }

    public record Login2FARequest(string TempToken, string Code);

    [HttpPost("login-2fa")]
    [AllowAnonymous]
    public async Task<IActionResult> Login2FA([FromBody] Login2FARequest request)
    {
        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(request.TempToken);
        if (!jwtToken.Claims.Any(c => c.Type == "Temp2FA" && c.Value == "true")) return Unauthorized("Invalid temp token");

        var userIdStr = jwtToken.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub)?.Value;
        if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var user = await _db.Users.FindAsync(userId);
        if (user == null || string.IsNullOrEmpty(user.TwoFactorSecret)) return Unauthorized();

        var totp = new OtpNet.Totp(OtpNet.Base32Encoding.ToBytes(user.TwoFactorSecret));
        bool isValid = totp.VerifyTotp(request.Code, out long timeStepMatched, new OtpNet.VerificationWindow(2, 2));

        if (!isValid) return Unauthorized("Mã xác thực không hợp lệ");

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Email),
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Role, user.Role)
        };
        var token = _tokenService.CreateToken(claims);
        return Ok(new { token, user = new { user.UserId, user.Email, user.FullName, user.Role } });
    }

    [HttpGet("2fa/setup")]
    [Authorize]
    public async Task<IActionResult> Setup2FA()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _db.Users.FindAsync(Guid.Parse(userId!));
        if (user == null) return NotFound();

        var secretKey = OtpNet.KeyGeneration.GenerateRandomKey(20);
        var secretString = OtpNet.Base32Encoding.ToString(secretKey);

        // We save it temporarily in TwoFactorSecret even if not verified yet, or just return it and let client send it back to verify.
        // Let's store it temporarily.
        user.TwoFactorSecret = secretString;
        user.Is2FAEnabled = false; // Not fully enabled until verified
        await _db.SaveChangesAsync();

        var issuer = "TaskManagementApp";
        var qrCodeUrl = $"otpauth://totp/{issuer}:{user.Email}?secret={secretString}&issuer={issuer}";

        using var qrGenerator = new QRCoder.QRCodeGenerator();
        using var qrCodeData = qrGenerator.CreateQrCode(qrCodeUrl, QRCoder.QRCodeGenerator.ECCLevel.Q);
        using var qrCode = new QRCoder.PngByteQRCode(qrCodeData);
        var qrCodeBytes = qrCode.GetGraphic(20);
        var base64Qr = Convert.ToBase64String(qrCodeBytes);

        return Ok(new { Secret = secretString, QRCode = $"data:image/png;base64,{base64Qr}" });
    }

    public record Verify2FARequest(string Code);

    [HttpPost("2fa/verify")]
    [Authorize]
    public async Task<IActionResult> Verify2FA([FromBody] Verify2FARequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _db.Users.FindAsync(Guid.Parse(userId!));
        if (user == null || string.IsNullOrEmpty(user.TwoFactorSecret)) return NotFound();

        var totp = new OtpNet.Totp(OtpNet.Base32Encoding.ToBytes(user.TwoFactorSecret));
        bool isValid = totp.VerifyTotp(request.Code, out long timeStepMatched, new OtpNet.VerificationWindow(2, 2));

        if (!isValid) return BadRequest(new { message = "Mã xác thực không hợp lệ." });

        user.Is2FAEnabled = true;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Xác thực 2 bước đã được bật." });
    }

    [HttpPost("2fa/disable")]
    [Authorize]
    public async Task<IActionResult> Disable2FA()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _db.Users.FindAsync(Guid.Parse(userId!));
        if (user == null) return NotFound();

        user.Is2FAEnabled = false;
        user.TwoFactorSecret = null;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Xác thực 2 bước đã được tắt." });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userId, out var guid)) return Unauthorized();
        var user = await _db.Users.Where(u => u.UserId == guid)
            .Select(u => new { u.UserId, u.Email, u.FullName, u.Role, u.CreatedAt, u.UpdatedAt, u.Is2FAEnabled })
            .FirstOrDefaultAsync();
        if (user == null) return NotFound();
        return Ok(user);
    }
}
