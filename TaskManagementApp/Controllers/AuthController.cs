using TaskManagementApp.Infrastructure.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagementApp.Domain.Entities;
using TaskManagementApp.Infrastructure.Data;

namespace TaskManagementApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly TaskManagementAppContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;

    public AuthController(TaskManagementAppContext db, IPasswordHasher passwordHasher, ITokenService tokenService)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
    }

    public record RegisterRequest(string Email, string Password, string? FullName);
    public record LoginRequest(string Email, string Password);

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

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userId, out var guid)) return Unauthorized();
        var user = await _db.Users.Where(u => u.UserId == guid)
            .Select(u => new { u.UserId, u.Email, u.FullName, u.Role, u.CreatedAt, u.UpdatedAt })
            .FirstOrDefaultAsync();
        if (user == null) return NotFound();
        return Ok(user);
    }
}
