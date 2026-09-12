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
        // Get the ID of the currently logged-in user
        var currentUserIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(currentUserIdClaim) || !Guid.TryParse(currentUserIdClaim, out Guid currentUserId))
        {
            return Unauthorized();
        }

        // Only return users who share at least one workspace with the current user
        var query = _db.Users.AsNoTracking()
            .Where(u => u.WorkspaceMembers.Any(wm => 
                _db.WorkspaceMembers.Any(myWm => myWm.UserId == currentUserId && myWm.WorkspaceId == wm.WorkspaceId)
            ));
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
