using TaskManagementApp.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagementApp.Domain.Entities;
using TaskManagementApp.Infrastructure.Data;

namespace TaskManagementApp.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // All users can list members
public class UsersController : ControllerBase
{
    private readonly TaskManagementAppContext _db;

    public UsersController(TaskManagementAppContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string? search)
    {
        var query = _db.Users.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(u => u.Email.Contains(search) || (u.FullName ?? "").Contains(search));
        }
        var users = await query.Select(u => new { u.UserId, u.Email, u.FullName, u.Role, u.CreatedAt })
            .OrderBy(u => u.Email)
            .ToListAsync();
        return Ok(users);
    }
}
