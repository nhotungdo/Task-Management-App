using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using TaskManagementApp.Domain.Entities;
using TaskManagementApp.Infrastructure.Data;
using TaskManagementApp.RealTime;

namespace TaskManagementApp.Controllers;

[ApiController]
[Route("api/workspaces/{workspaceId:guid}/tags")]
[Authorize]
public class TagsController : ControllerBase
{
    private readonly TaskManagementAppContext _db;
    private readonly IHubContext<TaskHub> _hub;

    public TagsController(TaskManagementAppContext db, IHubContext<TaskHub> hub)
    {
        _db = db;
        _hub = hub;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    public record TagCreateDto(string Name, string Color, Guid? WorkspaceId = null);

    public record TagUpdateDto(string? Name, string? Color);

    private async Task<bool> IsAdminAsync(Guid workspaceId, Guid userId)
    {
        return await _db.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == workspaceId && wm.UserId == userId && wm.Role == "Admin")
               || await _db.Workspaces.AnyAsync(w => w.WorkspaceId == workspaceId && w.OwnerId == userId);
    }

    private async Task<bool> IsMemberAsync(Guid workspaceId, Guid userId)
    {
        return await _db.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == workspaceId && wm.UserId == userId)
               || await _db.Workspaces.AnyAsync(w => w.WorkspaceId == workspaceId && w.OwnerId == userId);
    }

    [HttpGet]
    public async Task<IActionResult> GetTags(Guid workspaceId)
    {
        var userId = GetUserId();
        if (!await IsMemberAsync(workspaceId, userId)) return Forbid();

        var tags = await _db.Tags
            .AsNoTracking()
            .Where(t => t.WorkspaceId == workspaceId)
            .Select(t => new { t.TagId, t.Name, t.Color })
            .ToListAsync();

        return Ok(tags);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetTag(Guid workspaceId, Guid id)
    {
        var userId = GetUserId();
        if (!await IsMemberAsync(workspaceId, userId)) return Forbid();

        var tag = await _db.Tags
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.TagId == id && t.WorkspaceId == workspaceId);

        if (tag == null) return NotFound();
        return Ok(new { tag.TagId, tag.Name, tag.Color });
    }

    [HttpPost]
    public async Task<IActionResult> CreateTag(Guid workspaceId, [FromBody] TagCreateDto dto)
    {
        var userId = GetUserId();
        if (!await IsAdminAsync(workspaceId, userId)) return Forbid();

        var tag = new Tag
        {
            TagId = Guid.NewGuid(),
            WorkspaceId = workspaceId,
            Name = dto.Name,
            Color = dto.Color ?? "#6B7280",
            CreatedAt = DateTime.UtcNow
        };
        _db.Tags.Add(tag);
        await _db.SaveChangesAsync();
        await _hub.Clients.Group($"workspace:{workspaceId}").SendAsync("TagCreated", new { tag.TagId, tag.Name, tag.Color });
        return CreatedAtAction(nameof(GetTag), new { id = tag.TagId, workspaceId }, tag);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateTag(Guid workspaceId, Guid id, [FromBody] TagUpdateDto dto)
    {
        var userId = GetUserId();
        if (!await IsAdminAsync(workspaceId, userId)) return Forbid();

        var tag = await _db.Tags.FirstOrDefaultAsync(t => t.TagId == id && t.WorkspaceId == workspaceId);
        if (tag == null) return NotFound();

        if (dto.Name is not null) tag.Name = dto.Name;
        if (dto.Color is not null) tag.Color = dto.Color;
        await _db.SaveChangesAsync();
        await _hub.Clients.Group($"workspace:{workspaceId}").SendAsync("TagUpdated", new { tag.TagId, tag.Name, tag.Color });
        return Ok(tag);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteTag(Guid workspaceId, Guid id)
    {
        var userId = GetUserId();
        if (!await IsAdminAsync(workspaceId, userId)) return Forbid();

        var tag = await _db.Tags.FirstOrDefaultAsync(t => t.TagId == id && t.WorkspaceId == workspaceId);
        if (tag == null) return NotFound();

        _db.Tags.Remove(tag);
        await _db.SaveChangesAsync();
        await _hub.Clients.Group($"workspace:{workspaceId}").SendAsync("TagDeleted", new { TagId = id });
        return NoContent();
    }
}
