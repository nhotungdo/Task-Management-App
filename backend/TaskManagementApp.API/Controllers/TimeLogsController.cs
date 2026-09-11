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
public class TimeLogsController : ControllerBase
{
    private readonly TaskManagementAppContext _db;

    public TimeLogsController(TaskManagementAppContext db) => _db = db;

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    public record CreateTimeLogDto(
        Guid TaskId,
        decimal Hours,
        DateTime LogDate,
        string? Comment
    );

    /// <summary>
    /// Get time logs filtered by taskId, workspaceId, or userId.
    /// At least one filter is required.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetTimeLogs(
        [FromQuery] Guid? taskId,
        [FromQuery] Guid? workspaceId,
        [FromQuery] Guid? userId)
    {
        var currentUserId = GetUserId();

        var query = _db.TimeLogs.AsNoTracking().Include(tl => tl.User).Include(tl => tl.Task).AsQueryable();

        if (taskId.HasValue)
        {
            // Verify access to the task
            var task = await _db.Tasks.AsNoTracking().FirstOrDefaultAsync(t => t.TaskId == taskId.Value);
            if (task == null) return NotFound("Task not found.");
            var isMember = await _db.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == task.WorkspaceId && wm.UserId == currentUserId);
            if (!isMember) return Forbid();
            query = query.Where(tl => tl.TaskId == taskId.Value);
        }
        else if (workspaceId.HasValue)
        {
            var isMember = await _db.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == workspaceId.Value && wm.UserId == currentUserId);
            if (!isMember) return Forbid();
            query = query.Where(tl => tl.Task.WorkspaceId == workspaceId.Value);
        }
        else if (userId.HasValue)
        {
            // Only allow viewing own logs or if admin
            if (userId.Value != currentUserId) return Forbid();
            query = query.Where(tl => tl.UserId == userId.Value);
        }
        else
        {
            // Default: return current user's logs
            query = query.Where(tl => tl.UserId == currentUserId);
        }

        var logs = await query
            .OrderByDescending(tl => tl.LogDate)
            .Select(tl => new {
                tl.TimeLogId,
                tl.TaskId,
                TaskTitle = tl.Task.Title,
                tl.UserId,
                UserName = tl.User.FullName ?? tl.User.Email,
                tl.Hours,
                tl.LogDate,
                tl.Comment,
                tl.CreatedAt
            })
            .ToListAsync();

        var totalHours = logs.Sum(l => l.Hours);
        return Ok(new { totalHours, logs });
    }

    [HttpPost]
    public async Task<IActionResult> CreateTimeLog([FromBody] CreateTimeLogDto dto)
    {
        var userId = GetUserId();

        var task = await _db.Tasks.AsNoTracking().FirstOrDefaultAsync(t => t.TaskId == dto.TaskId);
        if (task == null) return NotFound("Task not found.");

        var isMember = await _db.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == task.WorkspaceId && wm.UserId == userId);
        if (!isMember) return Forbid();

        if (dto.Hours <= 0 || dto.Hours > 24) return BadRequest("Hours must be between 0 and 24.");

        var log = new TimeLog
        {
            TimeLogId = Guid.NewGuid(),
            TaskId = dto.TaskId,
            UserId = userId,
            Hours = dto.Hours,
            LogDate = dto.LogDate.Date,
            Comment = dto.Comment,
            CreatedAt = DateTime.UtcNow
        };

        _db.TimeLogs.Add(log);

        // Update ActualHours on the task
        var taskToUpdate = await _db.Tasks.FirstOrDefaultAsync(t => t.TaskId == dto.TaskId);
        if (taskToUpdate != null)
        {
            var totalActual = await _db.TimeLogs.Where(tl => tl.TaskId == dto.TaskId).SumAsync(tl => tl.Hours);
            taskToUpdate.ActualHours = totalActual + dto.Hours;
            taskToUpdate.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetTimeLogs), new { taskId = dto.TaskId }, log);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteTimeLog(Guid id)
    {
        var userId = GetUserId();
        var log = await _db.TimeLogs.Include(tl => tl.Task).FirstOrDefaultAsync(tl => tl.TimeLogId == id);
        if (log == null) return NotFound();

        var isMember = await _db.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == log.Task.WorkspaceId && wm.UserId == userId);
        if (!isMember) return Forbid();

        // Only the log owner can delete it
        if (log.UserId != userId) return Forbid();

        _db.TimeLogs.Remove(log);

        // Recalculate ActualHours
        var taskToUpdate = await _db.Tasks.FirstOrDefaultAsync(t => t.TaskId == log.TaskId);
        if (taskToUpdate != null)
        {
            var totalActual = await _db.TimeLogs
                .Where(tl => tl.TaskId == log.TaskId && tl.TimeLogId != id)
                .SumAsync(tl => tl.Hours);
            taskToUpdate.ActualHours = totalActual;
            taskToUpdate.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return NoContent();
    }
}
