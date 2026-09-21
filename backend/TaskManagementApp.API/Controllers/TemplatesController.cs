using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using TaskManagementApp.Domain.Entities;
using TaskManagementApp.Infrastructure.Data;
using System.Security.Claims;

namespace TaskManagementApp.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TemplatesController : ControllerBase
{
    private readonly TaskManagementAppContext _context;

    public TemplatesController(TaskManagementAppContext context)
    {
        _context = context;
    }

    private Guid GetUserId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return idClaim != null ? Guid.Parse(idClaim) : Guid.Empty;
    }

    [HttpGet]
    public async Task<IActionResult> GetTemplates([FromQuery] Guid workspaceId)
    {
        var userId = GetUserId();
        var isMember = await _context.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == workspaceId && wm.UserId == userId);
        if (!isMember) return Forbid();

        var templates = await _context.ProjectTemplates
            .Include(pt => pt.TemplateTasks)
            .Where(pt => pt.WorkspaceId == workspaceId)
            .OrderByDescending(pt => pt.CreatedAt)
            .ToListAsync();

        return Ok(templates);
    }

    public record CreateTemplateDto(Guid WorkspaceId, string Name, string? Description);

    [HttpPost]
    public async Task<IActionResult> CreateTemplate([FromBody] CreateTemplateDto dto)
    {
        var userId = GetUserId();
        var isMember = await _context.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == dto.WorkspaceId && wm.UserId == userId);
        if (!isMember) return Forbid();

        var template = new ProjectTemplate
        {
            ProjectTemplateId = Guid.NewGuid(),
            WorkspaceId = dto.WorkspaceId,
            CreatedByUserId = userId,
            Name = dto.Name,
            Description = dto.Description,
            CreatedAt = DateTime.UtcNow
        };

        _context.ProjectTemplates.Add(template);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTemplates), new { workspaceId = template.WorkspaceId }, template);
    }

    public record CreateTemplateTaskDto(string Title, string? Description, string Priority, int SortOrder);

    [HttpPost("{id:guid}/tasks")]
    public async Task<IActionResult> AddTemplateTask(Guid id, [FromBody] CreateTemplateTaskDto dto)
    {
        var userId = GetUserId();
        var template = await _context.ProjectTemplates.FindAsync(id);
        if (template == null) return NotFound();

        var isMember = await _context.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == template.WorkspaceId && wm.UserId == userId);
        if (!isMember) return Forbid();

        var task = new TemplateTask
        {
            TemplateTaskId = Guid.NewGuid(),
            ProjectTemplateId = id,
            Title = dto.Title,
            Description = dto.Description,
            Priority = dto.Priority ?? "Normal",
            Status = "To Do",
            SortOrder = dto.SortOrder
        };

        _context.TemplateTasks.Add(task);
        await _context.SaveChangesAsync();

        return Ok(task);
    }
    
    [HttpPost("{id:guid}/apply")]
    public async Task<IActionResult> ApplyTemplate(Guid id)
    {
        var userId = GetUserId();
        var template = await _context.ProjectTemplates
            .Include(pt => pt.TemplateTasks)
            .FirstOrDefaultAsync(pt => pt.ProjectTemplateId == id);
            
        if (template == null) return NotFound();

        var isMember = await _context.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == template.WorkspaceId && wm.UserId == userId);
        if (!isMember) return Forbid();

        var now = DateTime.UtcNow;
        var tasksToCreate = template.TemplateTasks.Select(tt => new TaskManagementApp.Domain.Entities.Task
        {
            TaskId = Guid.NewGuid(),
            WorkspaceId = template.WorkspaceId,
            OwnerId = userId, // default to the applier
            Title = tt.Title,
            Description = tt.Description,
            Priority = tt.Priority,
            Status = tt.Status,
            CreatedAt = now,
            UpdatedAt = now
        }).ToList();

        _context.Tasks.AddRange(tasksToCreate);
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Đã áp dụng template thành công, tạo {tasksToCreate.Count} công việc mới." });
    }
}
