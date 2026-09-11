using TaskManagementApp.Infrastructure.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using TaskManagementApp.Domain.Entities;
using TaskManagementApp.Infrastructure.Data;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace TaskManagementApp.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly TaskManagementAppContext _db;
    private readonly IHubContext<RealTime.TaskHub> _taskHub;

    public TasksController(TaskManagementAppContext db, IHubContext<RealTime.TaskHub> taskHub)
    {
        _db = db;
        _taskHub = taskHub;
    }

    public record TaskCreateDto(
        string Title,
        string? Description,
        DateTime? StartDate,
        DateTime? DueDate,
        string Priority,
        string Status,
        Guid WorkspaceId,
        int Progress = 0,
        decimal? EstimatedHours = null,
        bool IsMilestone = false
    );

    public record TaskUpdateDto(
        string? Title,
        string? Description,
        DateTime? StartDate,
        DateTime? DueDate,
        string? Priority,
        string? Status,
        int? Progress,
        decimal? EstimatedHours,
        decimal? ActualHours,
        bool? IsMilestone
    );

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] Guid workspaceId,
        [FromQuery] string? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var userId = GetUserId();
        
        var isMember = await _db.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == workspaceId && wm.UserId == userId);
        if (!isMember) return Forbid();

        var query = _db.Tasks.AsNoTracking().Where(t => t.WorkspaceId == workspaceId);
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(t => t.Status == status);
        if (!string.IsNullOrWhiteSpace(search)) query = query.Where(t => t.Title.Contains(search) || (t.Description ?? "").Contains(search));
        var total = await query.CountAsync();
        var items = await query
            .OrderBy(t => t.StartDate ?? t.CreatedAt)
            .ThenBy(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new {
                t.TaskId,
                t.Title,
                t.Description,
                t.StartDate,
                t.DueDate,
                t.Priority,
                t.Status,
                t.Progress,
                t.EstimatedHours,
                t.ActualHours,
                t.IsMilestone,
                t.OwnerId,
                t.WorkspaceId,
                t.CreatedAt,
                t.UpdatedAt
            })
            .ToListAsync();
        return Ok(new { total, page, pageSize, items });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var userId = GetUserId();
        var task = await _db.Tasks
            .AsNoTracking()
            .Include(t => t.Predecessors).ThenInclude(d => d.PredecessorTask)
            .Include(t => t.Successors).ThenInclude(d => d.SuccessorTask)
            .Include(t => t.Comments).ThenInclude(c => c.User)
            .Include(t => t.TimeLogs).ThenInclude(tl => tl.User)
            .Include(t => t.Attachments)
            .Include(t => t.TaskAssignments).ThenInclude(a => a.User)
            .FirstOrDefaultAsync(t => t.TaskId == id);
        if (task == null) return NotFound();
        var isMember = await _db.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == task.WorkspaceId && wm.UserId == userId);
        if (!isMember) return Forbid();

        return Ok(new {
            task.TaskId,
            task.Title,
            task.Description,
            task.StartDate,
            task.DueDate,
            task.Priority,
            task.Status,
            task.Progress,
            task.EstimatedHours,
            task.ActualHours,
            task.IsMilestone,
            task.OwnerId,
            task.WorkspaceId,
            task.CreatedAt,
            task.UpdatedAt,
            Dependencies = task.Predecessors.Select(d => new {
                d.TaskDependencyId,
                d.PredecessorTaskId,
                PredecessorTitle = d.PredecessorTask.Title,
                d.Type,
                d.LagDays
            }),
            Comments = task.Comments.OrderBy(c => c.CreatedAt).Select(c => new {
                c.TaskCommentId,
                c.Content,
                c.CreatedAt,
                c.UpdatedAt,
                UserId = c.UserId,
                UserName = c.User.FullName ?? c.User.Email
            }),
            TimeLogs = task.TimeLogs.OrderByDescending(tl => tl.LogDate).Select(tl => new {
                tl.TimeLogId,
                tl.Hours,
                tl.LogDate,
                tl.Comment,
                tl.CreatedAt,
                UserId = tl.UserId,
                UserName = tl.User.FullName ?? tl.User.Email
            }),
            Attachments = task.Attachments.Select(a => new {
                a.TaskAttachmentId,
                a.FileName,
                a.FileUrl,
                a.ContentType,
                a.FileSizeBytes,
                a.UploadedAt
            }),
            Assignees = task.TaskAssignments.Select(a => new {
                a.TaskAssignmentId,
                a.UserId,
                UserName = a.User.FullName ?? a.User.Email,
                UserEmail = a.User.Email
            })
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TaskCreateDto dto)
    {
        var userId = GetUserId();
        
        var isMember = await _db.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == dto.WorkspaceId && wm.UserId == userId);
        if (!isMember) return Forbid();

        var task = new TaskManagementApp.Domain.Entities.Task
        {
            TaskId = Guid.NewGuid(),
            Title = dto.Title,
            Description = dto.Description,
            StartDate = dto.StartDate,
            DueDate = dto.DueDate,
            Priority = string.IsNullOrWhiteSpace(dto.Priority) ? "Normal" : dto.Priority,
            Status = string.IsNullOrWhiteSpace(dto.Status) ? "To Do" : dto.Status,
            Progress = dto.Progress,
            EstimatedHours = dto.EstimatedHours,
            IsMilestone = dto.IsMilestone,
            OwnerId = userId,
            WorkspaceId = dto.WorkspaceId,
            CreatedAt = DateTime.UtcNow
        };
        _db.Tasks.Add(task);
        await _db.SaveChangesAsync();
        await _taskHub.Clients.Group($"workspace:{dto.WorkspaceId}").SendAsync("TaskCreated", task);
        return CreatedAtAction(nameof(GetById), new { id = task.TaskId }, task);
    }

    [HttpPut("{id:guid}")]
    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] TaskUpdateDto dto)
    {
        var userId = GetUserId();
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.TaskId == id);
        if (task == null) return NotFound();
        var isMember = await _db.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == task.WorkspaceId && wm.UserId == userId);
        if (!isMember) return Forbid();
        
        if (dto.Title is not null) task.Title = dto.Title;
        if (dto.Description is not null) task.Description = dto.Description;
        if (dto.StartDate.HasValue) task.StartDate = dto.StartDate.Value;
        if (dto.DueDate.HasValue) task.DueDate = dto.DueDate.Value;
        if (!string.IsNullOrWhiteSpace(dto.Priority)) task.Priority = dto.Priority!;
        if (!string.IsNullOrWhiteSpace(dto.Status)) task.Status = dto.Status!;
        if (dto.Progress.HasValue) task.Progress = Math.Clamp(dto.Progress.Value, 0, 100);
        if (dto.EstimatedHours.HasValue) task.EstimatedHours = dto.EstimatedHours.Value;
        if (dto.ActualHours.HasValue) task.ActualHours = dto.ActualHours.Value;
        if (dto.IsMilestone.HasValue) task.IsMilestone = dto.IsMilestone.Value;
        task.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _taskHub.Clients.Group($"workspace:{task.WorkspaceId}").SendAsync("TaskUpdated", task);
        return Ok(task);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = GetUserId();
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.TaskId == id);
        if (task == null) return NotFound();
        var isMember = await _db.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == task.WorkspaceId && wm.UserId == userId);
        if (!isMember) return Forbid();
        var workspaceId = task.WorkspaceId;
        _db.Tasks.Remove(task);
        await _db.SaveChangesAsync();
        await _taskHub.Clients.Group($"workspace:{workspaceId}").SendAsync("TaskDeleted", new { TaskId = id });
        return NoContent();
    }

    // ─── My Tasks: tasks assigned to the current user across all workspaces ───
    [HttpGet("my")]
    public async Task<IActionResult> GetMyTasks()
    {
        var userId = GetUserId();
        var today = DateTime.UtcNow.Date;

        var tasks = await _db.Tasks
            .AsNoTracking()
            .Where(t => t.OwnerId == userId)
            .Include(t => t.Workspace)
            .OrderBy(t => t.DueDate)
            .Select(t => new {
                t.TaskId,
                t.Title,
                t.Status,
                t.Priority,
                t.StartDate,
                t.DueDate,
                t.Progress,
                t.WorkspaceId,
                WorkspaceName = t.Workspace != null ? t.Workspace.Name : null,
                t.CreatedAt
            })
            .ToListAsync();

        return Ok(tasks);
    }
}
