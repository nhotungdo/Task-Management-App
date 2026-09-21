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
                .AsNoTrackingWithIdentityResolution()
                .AsSplitQuery()
                .Include(t => t.Predecessors)
                .Include(t => t.Successors)
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

        var relatedTaskIds = (task.Predecessors ?? Enumerable.Empty<TaskDependency>()).Select(p => p.PredecessorTaskId)
            .Concat((task.Successors ?? Enumerable.Empty<TaskDependency>()).Select(s => s.SuccessorTaskId))
            .Distinct().ToList();
            
        var relatedTitles = await _db.Tasks
            .Where(t => relatedTaskIds.Contains(t.TaskId))
            .ToDictionaryAsync(t => t.TaskId, t => t.Title);

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
                PredecessorTitle = relatedTitles.ContainsKey(d.PredecessorTaskId) ? relatedTitles[d.PredecessorTaskId] : "N/A",
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
        var oldStatus = task.Status;
        if (dto.Title is not null) task.Title = dto.Title;
        if (dto.Description is not null) task.Description = dto.Description;
        if (dto.StartDate.HasValue) task.StartDate = dto.StartDate.Value;
        if (dto.DueDate.HasValue) task.DueDate = dto.DueDate.Value;
        if (!string.IsNullOrWhiteSpace(dto.Priority)) task.Priority = dto.Priority!;
        
        bool statusChanged = false;
        if (!string.IsNullOrWhiteSpace(dto.Status) && task.Status != dto.Status) 
        {
            task.Status = dto.Status!;
            statusChanged = true;
        }

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

        // Check if task was just completed and needs recurrence spawning
        bool isJustCompleted = dto.Status != null && dto.Status == "Done" && task.Status == "Done" && task.RecurrencePattern != null;
        // Wait, dto.Status is new status.
        if (dto.Status != null && dto.Status.Equals("Done", StringComparison.OrdinalIgnoreCase) && 
            !task.Status.Equals("Done", StringComparison.OrdinalIgnoreCase) && 
            !string.IsNullOrWhiteSpace(task.RecurrencePattern))
        {
            var nextDueDate = CalculateNextRecurrence(task.DueDate ?? DateTime.UtcNow, task.RecurrencePattern, task.RecurrenceInterval);
            if (task.RecurrenceEndDate == null || nextDueDate <= task.RecurrenceEndDate)
            {
                var clonedTask = new TaskManagementApp.Domain.Entities.Task
                {
                    TaskId = Guid.NewGuid(),
                    Title = task.Title,
                    Description = task.Description,
                    StartDate = task.StartDate.HasValue ? nextDueDate.Add(task.StartDate.Value - (task.DueDate ?? DateTime.UtcNow)) : null,
                    DueDate = nextDueDate,
                    Priority = task.Priority,
                    Status = "To Do",
                    Progress = 0,
                    EstimatedHours = task.EstimatedHours,
                    IsMilestone = task.IsMilestone,
                    RecurrencePattern = task.RecurrencePattern,
                    RecurrenceEndDate = task.RecurrenceEndDate,
                    RecurrenceInterval = task.RecurrenceInterval,
                    OwnerId = task.OwnerId,
                    WorkspaceId = task.WorkspaceId,
                    CreatedAt = DateTime.UtcNow
                };
                _db.Tasks.Add(clonedTask);
                // Also clone assignments
                await _db.Entry(task).Collection(t => t.TaskAssignments).LoadAsync();
                foreach(var assignment in task.TaskAssignments)
                {
                    _db.TaskAssignments.Add(new TaskAssignment 
                    {
                        TaskAssignmentId = Guid.NewGuid(),
                        TaskId = clonedTask.TaskId,
                        UserId = assignment.UserId,
                        AssignedAt = DateTime.UtcNow
                    });
                }
                // Clear recurrence on the current completed task so it doesn't spawn again if re-completed
                task.RecurrencePattern = null; 
            }
        }
        
        await _db.SaveChangesAsync(); // save again for the clone

        await _taskHub.Clients.Group($"workspace:{task.WorkspaceId}").SendAsync("TaskUpdated", task);

        if (statusChanged)
        {
            var emailService = HttpContext.RequestServices.GetService(typeof(IEmailService)) as IEmailService;
            if (emailService != null)
            {
                await _db.Entry(task).Collection(t => t.TaskAssignments).Query().Include(a => a.User).LoadAsync();
                var frontendUrl = _db.Workspaces.Any(w => w.WorkspaceId == task.WorkspaceId) ? $"http://localhost:3000/workspaces/{task.WorkspaceId}?tab=board" : "http://localhost:3000/tasks";
                foreach (var assignment in task.TaskAssignments)
                {
                    if (assignment.User != null && !string.IsNullOrEmpty(assignment.User.Email))
                    {
                        var htmlBody = EmailTemplateBuilder.BuildTaskStatusChangedTemplate(assignment.User.FullName ?? assignment.User.Email, task.Title, oldStatus, task.Status, frontendUrl);
                        _ = emailService.SendAsync(assignment.User.Email, $"Cập nhật trạng thái: {task.Title}", htmlBody);
                    }
                }
            }
        }

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

    private DateTime CalculateNextRecurrence(DateTime currentDueDate, string pattern, int interval)
    {
        return pattern.ToLower() switch
        {
            "daily" => currentDueDate.AddDays(interval),
            "weekly" => currentDueDate.AddDays(7 * interval),
            "monthly" => currentDueDate.AddMonths(interval),
            "yearly" => currentDueDate.AddYears(interval),
            _ => currentDueDate.AddDays(interval) // fallback to daily
        };
    }

    // ─── Task Approval Workflow ───
    
    public record RequestApprovalDto(Guid ApproverId);
    
    [HttpPost("{id:guid}/approvals")]
    public async Task<IActionResult> RequestApproval(Guid id, [FromBody] RequestApprovalDto dto)
    {
        var userId = GetUserId();
        var task = await _db.Tasks.FindAsync(id);
        if (task == null) return NotFound();

        var isMember = await _db.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == task.WorkspaceId && wm.UserId == userId);
        if (!isMember) return Forbid();

        var approval = new TaskApproval
        {
            TaskApprovalId = Guid.NewGuid(),
            TaskId = id,
            ApproverId = dto.ApproverId,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        _db.TaskApprovals.Add(approval);
        
        // Log activity
        _db.ActivityLogs.Add(new ActivityLog
        {
            LogId = Guid.NewGuid(),
            UserId = userId,
            Action = $"Yêu cầu {dto.ApproverId} duyệt công việc: {task.Title}",
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        
        var approver = await _db.Users.FindAsync(dto.ApproverId);
        if (approver != null)
        {
            var emailService = HttpContext.RequestServices.GetService(typeof(IEmailService)) as IEmailService;
            if (emailService != null)
            {
                var frontendUrl = $"http://localhost:3000/workspaces/{task.WorkspaceId}?tab=board";
                var htmlBody = EmailTemplateBuilder.BuildTaskStatusChangedTemplate(approver.FullName ?? approver.Email, task.Title, "Yêu cầu", "Chờ duyệt", frontendUrl);
                _ = emailService.SendAsync(approver.Email, $"Yêu cầu duyệt công việc: {task.Title}", htmlBody);
            }
        }

        return Ok(approval);
    }

    public record RespondApprovalDto(string Status, string? Comments);

    [HttpPut("{id:guid}/approvals/{approvalId:guid}")]
    public async Task<IActionResult> RespondApproval(Guid id, Guid approvalId, [FromBody] RespondApprovalDto dto)
    {
        var userId = GetUserId();
        var approval = await _db.TaskApprovals.Include(a => a.Task).FirstOrDefaultAsync(a => a.TaskApprovalId == approvalId && a.TaskId == id);
        
        if (approval == null) return NotFound();
        if (approval.ApproverId != userId) return Forbid(); // Only assigned approver can respond
        if (dto.Status != "Approved" && dto.Status != "Rejected") return BadRequest("Invalid status");

        approval.Status = dto.Status;
        approval.Comments = dto.Comments;
        approval.RespondedAt = DateTime.UtcNow;

        _db.ActivityLogs.Add(new ActivityLog
        {
            LogId = Guid.NewGuid(),
            UserId = userId,
            Action = $"Đã {dto.Status} công việc: {approval.Task?.Title}",
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return Ok(approval);
    }
}
