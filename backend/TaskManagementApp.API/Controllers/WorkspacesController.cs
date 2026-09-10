using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagementApp.Domain.Entities;
using TaskManagementApp.Infrastructure.Data;

namespace TaskManagementApp.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WorkspacesController : ControllerBase
{
    private readonly TaskManagementAppContext _db;

    public WorkspacesController(TaskManagementAppContext db)
    {
        _db = db;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    public record WorkspaceCreateDto(string Name, string? Description);

    [HttpGet]
    public async Task<IActionResult> GetMyWorkspaces()
    {
        var userId = GetUserId();
        var workspaces = await _db.WorkspaceMembers
            .Include(wm => wm.Workspace)
            .Where(wm => wm.UserId == userId)
            .Select(wm => new { 
                wm.Workspace.WorkspaceId, 
                wm.Workspace.Name, 
                wm.Workspace.Description, 
                Role = wm.Role 
            })
            .ToListAsync();
            
        return Ok(workspaces);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetWorkspaceById(Guid id)
    {
        var userId = GetUserId();
        var workspace = await _db.WorkspaceMembers
            .Include(wm => wm.Workspace)
            .Where(wm => wm.WorkspaceId == id && wm.UserId == userId)
            .Select(wm => new { 
                wm.Workspace.WorkspaceId, 
                wm.Workspace.Name, 
                wm.Workspace.Description,
                wm.Workspace.CreatedAt,
                Role = wm.Role 
            })
            .FirstOrDefaultAsync();

        if (workspace == null) return NotFound();
        return Ok(workspace);
    }

    [HttpPost]
    public async Task<IActionResult> CreateWorkspace([FromBody] WorkspaceCreateDto dto)
    {
        var userId = GetUserId();
        
        var workspace = new Workspace
        {
            WorkspaceId = Guid.NewGuid(),
            Name = dto.Name,
            Description = dto.Description,
            OwnerId = userId,
            CreatedAt = DateTime.UtcNow
        };

        var member = new WorkspaceMember
        {
            WorkspaceMemberId = Guid.NewGuid(),
            WorkspaceId = workspace.WorkspaceId,
            UserId = userId,
            Role = "Admin",
            JoinedAt = DateTime.UtcNow
        };

        _db.Workspaces.Add(workspace);
        _db.WorkspaceMembers.Add(member);
        
        await _db.SaveChangesAsync();

        return Ok(new { workspace.WorkspaceId, workspace.Name, workspace.Description, Role = "Admin" });
    }

    public record InviteMemberDto(Guid UserId);

    [HttpPost("{id:guid}/members")]
    public async Task<IActionResult> InviteMember(Guid id, [FromBody] InviteMemberDto dto)
    {
        var userId = GetUserId();
        
        // Verify caller is admin of this workspace
        var isAdmin = await _db.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == id && wm.UserId == userId && wm.Role == "Admin");
        if (!isAdmin) return Forbid();

        var exists = await _db.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == id && wm.UserId == dto.UserId);
        if (exists) return Conflict("User is already a member");

        var newMember = new WorkspaceMember
        {
            WorkspaceMemberId = Guid.NewGuid(),
            WorkspaceId = id,
            UserId = dto.UserId,
            Role = "Member",
            JoinedAt = DateTime.UtcNow
        };

        _db.WorkspaceMembers.Add(newMember);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Member added successfully" });
    }
}
