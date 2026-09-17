using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagementApp.Domain.Entities;
using TaskManagementApp.Infrastructure.Data;

namespace TaskManagementApp.Controllers;

[ApiController]
[Route("api/workspaces/{workspaceId:guid}/templates")]
[Authorize]
public class ProjectTemplatesController : ControllerBase
{
    private readonly TaskManagementAppContext _db;

    public ProjectTemplatesController(TaskManagementAppContext db)
    {
        _db = db;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

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

    public record CreateTemplateDto(string Name, string? Description, List<TemplateTaskDto>? Tasks = null);
    public record TemplateTaskDto(string Title, string? Description, string Priority = "Normal", string Status = "To Do", int SortOrder = 0);
    public record ApplyTemplateDto(Guid TemplateId);

    [HttpGet]
    public async Task<IActionResult> GetTemplates(Guid workspaceId)
    {
        var userId = GetUserId();
        if (!await IsMemberAsync(workspaceId, userId)) return Forbid();

        var templates = await _db.ProjectTemplates
            .AsNoTracking()
            .Where(pt => pt.WorkspaceId == workspaceId)
            .Include(pt => pt.TemplateTasks)
            .OrderByDescending(pt => pt.CreatedAt)
            .Select(pt => new {
                pt.ProjectTemplateId,
                pt.Name,
                pt.Description,
                pt.CreatedAt,
                CreatedBy = pt.CreatedByUser != null ? (pt.CreatedByUser.FullName ?? pt.CreatedByUser.Email) : null,
                Tasks = pt.TemplateTasks.OrderBy(tt => tt.SortOrder).Select(tt => new {
                    tt.TemplateTaskId,
                    tt.Title,
                    tt.Description,
                    tt.Priority,
                    tt.Status,
                    tt.SortOrder
                })
            })
            .ToListAsync();

        return Ok(templates);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetTemplate(Guid workspaceId, Guid id)
    {
        var userId = GetUserId();
        if (!await IsMemberAsync(workspaceId, userId)) return Forbid();

        var template = await _db.ProjectTemplates
            .AsNoTracking()
            .Include(pt => pt.TemplateTasks)
            .FirstOrDefaultAsync(pt => pt.ProjectTemplateId == id && pt.WorkspaceId == workspaceId);

        if (template == null) return NotFound();

        return Ok(new {
            template.ProjectTemplateId,
            template.Name,
            template.Description,
            template.CreatedAt,
            Tasks = template.TemplateTasks.OrderBy(tt => tt.SortOrder).Select(tt => new {
                tt.TemplateTaskId,
                tt.Title,
                tt.Description,
                tt.Priority,
                tt.Status,
                tt.SortOrder
            })
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreateTemplate(Guid workspaceId, [FromBody] CreateTemplateDto dto)
    {
        var userId = GetUserId();
        if (!await IsAdminAsync(workspaceId, userId)) return Forbid();

        var template = new ProjectTemplate
        {
            ProjectTemplateId = Guid.NewGuid(),
            WorkspaceId = workspaceId,
            CreatedByUserId = userId,
            Name = dto.Name,
            Description = dto.Description,
            CreatedAt = DateTime.UtcNow
        };
        _db.ProjectTemplates.Add(template);
        await _db.SaveChangesAsync();

        if (dto.Tasks != null && dto.Tasks.Any())
        {
            var taskEntities = dto.Tasks.Select((t, i) => new TemplateTask
            {
                TemplateTaskId = Guid.NewGuid(),
                ProjectTemplateId = template.ProjectTemplateId,
                Title = t.Title,
                Description = t.Description,
                Priority = t.Priority,
                Status = t.Status,
                SortOrder = t.SortOrder
            }).ToList();

            _db.TemplateTasks.AddRange(taskEntities);
            await _db.SaveChangesAsync();
        }

        return CreatedAtAction(nameof(GetTemplate), new { id = template.ProjectTemplateId, workspaceId }, template);
    }

    [HttpPost("{id:guid}/apply")]
    public async Task<IActionResult> ApplyTemplate(Guid workspaceId, Guid id, [FromBody] ApplyTemplateDto _)
    {
        var userId = GetUserId();
        if (!await IsMemberAsync(workspaceId, userId)) return Forbid();

        var template = await _db.ProjectTemplates
            .Include(pt => pt.TemplateTasks)
            .FirstOrDefaultAsync(pt => pt.ProjectTemplateId == id && pt.WorkspaceId == workspaceId);

        if (template == null) return NotFound();

        var createdTasks = new List<object>();
        foreach (var templateTask in template.TemplateTasks.OrderBy(tt => tt.SortOrder))
        {
            var task = new TaskManagementApp.Domain.Entities.Task
            {
                TaskId = Guid.NewGuid(),
                Title = templateTask.Title,
                Description = templateTask.Description,
                Priority = templateTask.Priority,
                Status = templateTask.Status,
                OwnerId = userId,
                WorkspaceId = workspaceId,
                CreatedAt = DateTime.UtcNow
            };
            _db.Tasks.Add(task);
            createdTasks.Add(new { task.TaskId, task.Title });
        }
        await _db.SaveChangesAsync();

        return Ok(new { CreatedFromTemplate = template.Name, Tasks = createdTasks });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteTemplate(Guid workspaceId, Guid id)
    {
        var userId = GetUserId();
        if (!await IsAdminAsync(workspaceId, userId)) return Forbid();

        var template = await _db.ProjectTemplates.FirstOrDefaultAsync(pt => pt.ProjectTemplateId == id && pt.WorkspaceId == workspaceId);
        if (template == null) return NotFound();

        _db.ProjectTemplates.Remove(template);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
