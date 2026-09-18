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
        bool IsMilestone = false,
        string? RecurrencePattern = null,
        DateTime? RecurrenceEndDate = null,
        int RecurrenceInterval = 1,
        List<Guid>? TagIds = null
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
        bool? IsMilestone,
        string? RecurrencePattern = null,
        DateTime? RecurrenceEndDate = null,
        int? RecurrenceInterval = null,
        List<Guid>? TagIds = null
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
                t.RecurrencePattern,
                t.RecurrenceEndDate,
                t.RecurrenceInterval,
                t.OwnerId,
                t.WorkspaceId,
                t.CreatedAt,
                t.UpdatedAt,
                Tags = t.Tags.Select(tag => new { tag.TagId, tag.Name, tag.Color })
            })
            .ToListAsync();
        return Ok(new { total, page, pageSize, items });
    }
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try 
        {
            var userId = Guid.Empty; // bypassed for debugging
            try { userId = GetUserId(); } catch { }
            
            var task = await _db.Tasks
                .AsNoTracking()
                .AsSplitQuery()
                .Include(t => t.Predecessors).ThenInclude(d => d.PredecessorTask)
                .Include(t => t.Successors).ThenInclude(d => d.SuccessorTask)
                .Include(t => t.Comments).ThenInclude(c => c.User)
                .Include(t => t.TimeLogs).ThenInclude(tl => tl.User)
                .Include(t => t.Attachments)
                .Include(t => t.TaskAssignments).ThenInclude(a => a.User)
                .Include(t => t.Tags)
                .Include(t => t.Subtasks)
                .FirstOrDefaultAsync(t => t.TaskId == id);
        if (task == null) return NotFound();
        var isMember = await _db.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == task.WorkspaceId && wm.UserId == userId)
                       || await _db.Workspaces.AnyAsync(w => w.WorkspaceId == task.WorkspaceId && w.OwnerId == userId)
                       || task.OwnerId == userId;
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
            task.RecurrencePattern,
            task.RecurrenceEndDate,
            task.RecurrenceInterval,
            task.OwnerId,
            task.WorkspaceId,
            task.CreatedAt,
            task.UpdatedAt,
            Dependencies = (task.Predecessors ?? Enumerable.Empty<TaskDependency>()).Select(d => new {
                d.TaskDependencyId,
                d.PredecessorTaskId,
                PredecessorTitle = d.PredecessorTask != null ? d.PredecessorTask.Title : "N/A",
                d.Type,
                d.LagDays
            }),
            Comments = (task.Comments ?? Enumerable.Empty<TaskComment>()).OrderBy(c => c.CreatedAt).Select(c => new {
                c.TaskCommentId,
                c.Content,
                c.CreatedAt,
                c.UpdatedAt,
                UserId = c.UserId,
                UserName = c.User != null ? (c.User.FullName ?? c.User.Email) : "Thành viên"
            }),
            TimeLogs = (task.TimeLogs ?? Enumerable.Empty<TimeLog>()).OrderByDescending(tl => tl.LogDate).Select(tl => new {
                tl.TimeLogId,
                tl.Hours,
                tl.LogDate,
                tl.Comment,
                tl.CreatedAt,
                UserId = tl.UserId,
                UserName = tl.User != null ? (tl.User.FullName ?? tl.User.Email) : "Thành viên"
            }),
            Attachments = (task.Attachments ?? Enumerable.Empty<TaskAttachment>()).Select(a => new {
                a.TaskAttachmentId,
                a.FileName,
                a.FileUrl,
                a.ContentType,
                a.FileSizeBytes,
                a.UploadedAt
            }),
             Assignees = (task.TaskAssignments ?? Enumerable.Empty<TaskAssignment>()).Select(a => new {
                 a.TaskAssignmentId,
                 a.UserId,
                 UserName = a.User != null ? (a.User.FullName ?? a.User.Email) : "Thành viên",
                 UserEmail = a.User != null ? a.User.Email : ""
             }),
             Tags = (task.Tags ?? Enumerable.Empty<Tag>()).Select(t => new {
                 t.TagId,
                 t.Name,
                 t.Color
             }),
             Subtasks = (task.Subtasks ?? Enumerable.Empty<Subtask>()).OrderBy(s => s.SortOrder).Select(s => new {
                 s.SubtaskId,
                 s.Title,
                 s.IsCompleted,
                 s.AssignedToUserId,
                 s.DueDate,
                 s.SortOrder
             })
         });
        }
        catch (Exception ex)
        {
            System.IO.File.WriteAllText(@"C:\temp\error.txt", ex.ToString());
            throw;
        }
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
            RecurrencePattern = dto.RecurrencePattern,
            RecurrenceEndDate = dto.RecurrenceEndDate,
            RecurrenceInterval = dto.RecurrenceInterval,
            OwnerId = userId,
            WorkspaceId = dto.WorkspaceId,
            CreatedAt = DateTime.UtcNow
        };
        _db.Tasks.Add(task);
        await _db.SaveChangesAsync();

        if (dto.TagIds?.Any() == true)
        {
            await _db.Entry(task).Collection(t => t.Tags).LoadAsync();
            var validTags = await _db.Tags
                .Where(t => t.WorkspaceId == dto.WorkspaceId && dto.TagIds.Contains(t.TagId))
                .ToListAsync();
            foreach (var tag in validTags)
            {
                if (!task.Tags.Any(t => t.TagId == tag.TagId))
                {
                    task.Tags.Add(tag);
                }
            }
            await _db.SaveChangesAsync();
        }

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
        if (dto.RecurrencePattern != null) task.RecurrencePattern = dto.RecurrencePattern;
        if (dto.RecurrenceEndDate.HasValue) task.RecurrenceEndDate = dto.RecurrenceEndDate.Value;
        if (dto.RecurrenceInterval.HasValue) task.RecurrenceInterval = dto.RecurrenceInterval.Value;
        task.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        if (dto.TagIds != null)
        {
            await _db.Entry(task).Collection(t => t.Tags).LoadAsync();
            var currentTagIds = task.Tags.Select(t => t.TagId).ToList();

            var tagsToAdd = dto.TagIds.Except(currentTagIds).ToList();
            var tagsToRemove = currentTagIds.Except(dto.TagIds).ToList();

            if (tagsToAdd.Any() || tagsToRemove.Any())
            {
                var tagsToAddEntities = await _db.Tags.Where(t => tagsToAdd.Contains(t.TagId) && t.WorkspaceId == task.WorkspaceId).ToListAsync();
                foreach (var tagEntity in tagsToAddEntities)
                {
                    if (!task.Tags.Any(t => t.TagId == tagEntity.TagId))
                    {
                        task.Tags.Add(tagEntity);
                    }
                }
                var tagsToRemoveEntities = task.Tags.Where(t => tagsToRemove.Contains(t.TagId)).ToList();
                foreach (var tagEntity in tagsToRemoveEntities)
                {
                    task.Tags.Remove(tagEntity);
                }
                await _db.SaveChangesAsync();
            }
        }

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
