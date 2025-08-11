using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagementApp.Models;

namespace TaskManagementApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PasswordController : ControllerBase
{
    private readonly TaskManagementAppContext _db;
    private readonly Services.IEmailService _email;
    private readonly Services.IPasswordHasher _passwordHasher;

    public PasswordController(TaskManagementAppContext db, Services.IEmailService email, Services.IPasswordHasher passwordHasher)
    {
        _db = db;
        _email = email;
        _passwordHasher = passwordHasher;
    }

    public record ForgotRequest(string Email);
    public record ResetRequest(string Token, string NewPassword);

    [HttpPost("forgot")] // send reset email
    [AllowAnonymous]
    public async Task<IActionResult> Forgot([FromBody] ForgotRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null)
            return Ok(); // do not reveal

        var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray()).Replace("/", "_").Replace("+", "-");
        var reset = new PasswordResetToken
        {
            PasswordResetTokenId = Guid.NewGuid(),
            UserId = user.UserId,
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddHours(1),
            Used = false
        };
        _db.PasswordResetTokens.Add(reset);
        await _db.SaveChangesAsync();

        var frontendUrl = HttpContext.Request.Headers["Origin"].FirstOrDefault() ?? "http://localhost:3000";
        var link = $"{frontendUrl}/reset-password?token={Uri.EscapeDataString(token)}";
        await _email.SendAsync(user.Email, "Reset your password", $"Click <a href=\"{link}\">here</a> to reset your password. This link expires in 1 hour.");
        return Ok();
    }

    [HttpPost("reset")] // confirm reset
    [AllowAnonymous]
    public async Task<IActionResult> Reset([FromBody] ResetRequest request)
    {
        var reset = await _db.PasswordResetTokens.Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Token == request.Token);
        if (reset == null || reset.Used || reset.ExpiresAt < DateTime.UtcNow)
            return BadRequest("Invalid or expired token");

        reset.User.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
        reset.Used = true;
        await _db.SaveChangesAsync();
        return Ok();
    }
}


