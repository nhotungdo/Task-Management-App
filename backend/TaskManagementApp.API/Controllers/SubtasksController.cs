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
[Route("api/tasks/{taskId:guid}/subtasks")]
[Authorize]
public class SubtasksController : ControllerBase
{
    private readonly TaskManagementAppContext _db;
    private readonly IHubContext<TaskHub> _hub;

    public SubtasksController(TaskManagementAppContext db, IHubContext<TaskHub> hub)
    {
        _db = db;
        _hub = hub;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    public record SubtaskCreateDto(string Title, Guid? AssignedToUserId = null, DateTime? DueDate = null, int SortOrder = 0);

    public record SubtaskUpdateDto(string? Title = null, bool? IsCompleted = null, Guid? AssignedToUserId = null, DateTime? DueDate = null, int? SortOrder = null);

    private async Task<bool> IsMemberAsync(Guid taskId, Guid userId)
    {
        var task = await _db.Tasks.AsNoTracking().FirstOrDefaultAsync(t => t.TaskId == taskId);
        if (task == null) return false;
        return await _db.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == task.WorkspaceId && wm.UserId == userId)
               || await _db.Workspaces.AnyAsync(w => w.WorkspaceId == task.WorkspaceId && w.OwnerId == userId)
               || task.OwnerId == userId;
    }

    [HttpGet]
    public async Task<IActionResult> GetSubtasks(Guid taskId)
    {
        var userId = GetUserId();
        if (!await IsMemberAsync(taskId, userId)) return Forbid();

        var subtasks = await _db.Subtasks
            .AsNoTracking()
            .Where(s => s.TaskId == taskId)
            .OrderBy(s => s.SortOrder)
            .Select(s => new {
                s.SubtaskId,
                s.TaskId,
                s.Title,
                s.IsCompleted,
                s.AssignedToUserId,
                AssignedToUserName = s.AssignedToUser != null ? (s.AssignedToUser.FullName ?? s.AssignedToUser.Email) : null,
                s.DueDate,
                s.SortOrder,
                s.CreatedAt
            })
            .ToListAsync();

        return Ok(subtasks);
    }

    [HttpPost]
    public async Task<IActionResult> CreateSubtask(Guid taskId, [FromBody] SubtaskCreateDto dto)
    {
        var userId = GetUserId();
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.TaskId == taskId);
        if (task == null) return NotFound();
        if (!await IsMemberAsync(taskId, userId)) return Forbid();

        var subtask = new Subtask
        {
            SubtaskId = Guid.NewGuid(),
            TaskId = taskId,
            Title = dto.Title,
            AssignedToUserId = dto.AssignedToUserId,
            DueDate = dto.DueDate,
            SortOrder = dto.SortOrder,
            IsCompleted = false,
            CreatedAt = DateTime.UtcNow
        };
        _db.Subtasks.Add(subtask);
        await _db.SaveChangesAsync();

        var subtaskWithUser = await _db.Subtasks
            .AsNoTracking()
            .Include(s => s.AssignedToUser)
            .FirstAsync(s => s.SubtaskId == subtask.SubtaskId);

        await _hub.Clients.Group($"workspace:{task.WorkspaceId}").SendAsync("SubtaskCreated", new {
            subtaskWithUser.SubtaskId,
            subtaskWithUser.TaskId,
            subtaskWithUser.Title,
            subtaskWithUser.IsCompleted,
            subtaskWithUser.AssignedToUserId,
            AssignedToUserName = subtaskWithUser.AssignedToUser != null ? (subtaskWithUser.AssignedToUser.FullName ?? subtaskWithUser.AssignedToUser.Email) : null,
            subtaskWithUser.DueDate,
            subtaskWithUser.SortOrder,
            subtaskWithUser.CreatedAt
        });
        return CreatedAtAction(nameof(GetSubtasks), new { taskId }, subtask);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateSubtask(Guid taskId, Guid id, [FromBody] SubtaskUpdateDto dto)
    {
        var userId = GetUserId();
        if (!await IsMemberAsync(taskId, userId)) return Forbid();

        var subtask = await _db.Subtasks.FirstOrDefaultAsync(s => s.SubtaskId == id && s.TaskId == taskId);
        if (subtask == null) return NotFound();

        if (dto.Title is not null) subtask.Title = dto.Title;
        if (dto.IsCompleted.HasValue) subtask.IsCompleted = dto.IsCompleted.Value;
        if (dto.AssignedToUserId.HasValue) subtask.AssignedToUserId = dto.AssignedToUserId;
        if (dto.DueDate.HasValue) subtask.DueDate = dto.DueDate.Value;
        if (dto.SortOrder.HasValue) subtask.SortOrder = dto.SortOrder.Value;

        await _db.SaveChangesAsync();
        var wsId = await _db.Tasks.Where(t => t.TaskId == subtask.TaskId).Select(t => t.WorkspaceId).FirstOrDefaultAsync();
        await _hub.Clients.Group($"workspace:{wsId}").SendAsync("SubtaskUpdated", new {
            subtask.SubtaskId,
            subtask.TaskId,
            subtask.Title,
            subtask.IsCompleted,
            subtask.AssignedToUserId,
            subtask.DueDate,
            subtask.SortOrder
        });
        return Ok(subtask);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteSubtask(Guid taskId, Guid id)
    {
        var userId = GetUserId();
        if (!await IsMemberAsync(taskId, userId)) return Forbid();

        var subtask = await _db.Subtasks.FirstOrDefaultAsync(s => s.SubtaskId == id && s.TaskId == taskId);
        if (subtask == null) return NotFound();

        _db.Subtasks.Remove(subtask);
        await _db.SaveChangesAsync();
        var wsId = await _db.Tasks.Where(t => t.TaskId == subtask.TaskId).Select(t => t.WorkspaceId).FirstOrDefaultAsync();
        await _hub.Clients.Group($"workspace:{wsId}").SendAsync("SubtaskDeleted", new { SubtaskId = id });
        return NoContent();
    }
}
