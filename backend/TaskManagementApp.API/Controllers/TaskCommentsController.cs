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
[Route("api/Tasks/{taskId:guid}/comments")]
[Authorize]
public class TaskCommentsController : ControllerBase
{
    private readonly TaskManagementAppContext _db;

    public TaskCommentsController(TaskManagementAppContext db) => _db = db;

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    public record CreateCommentDto(string Content);
    public record UpdateCommentDto(string Content);

    [HttpGet]
    public async Task<IActionResult> GetComments(Guid taskId)
    {
        var userId = GetUserId();
        var task = await _db.Tasks.AsNoTracking().FirstOrDefaultAsync(t => t.TaskId == taskId);
        if (task == null) return NotFound();

        var isMember = await _db.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == task.WorkspaceId && wm.UserId == userId);
        if (!isMember) return Forbid();

        var comments = await _db.TaskComments
            .AsNoTracking()
            .Include(c => c.User)
            .Where(c => c.TaskId == taskId)
            .OrderBy(c => c.CreatedAt)
            .Select(c => new {
                c.TaskCommentId,
                c.Content,
                c.CreatedAt,
                c.UpdatedAt,
                c.UserId,
                UserName = c.User.FullName ?? c.User.Email,
                UserEmail = c.User.Email
            })
            .ToListAsync();

        return Ok(comments);
    }

    [HttpPost]
    public async Task<IActionResult> AddComment(Guid taskId, [FromBody] CreateCommentDto dto)
    {
        var userId = GetUserId();
        var task = await _db.Tasks.AsNoTracking().FirstOrDefaultAsync(t => t.TaskId == taskId);
        if (task == null) return NotFound();

        var isMember = await _db.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == task.WorkspaceId && wm.UserId == userId);
        if (!isMember) return Forbid();

        if (string.IsNullOrWhiteSpace(dto.Content)) return BadRequest("Comment content cannot be empty.");

        var comment = new TaskComment
        {
            TaskCommentId = Guid.NewGuid(),
            TaskId = taskId,
            UserId = userId,
            Content = dto.Content.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _db.TaskComments.Add(comment);
        await _db.SaveChangesAsync();

        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == userId);

        return CreatedAtAction(nameof(GetComments), new { taskId }, new {
            comment.TaskCommentId,
            comment.Content,
            comment.CreatedAt,
            comment.UpdatedAt,
            comment.UserId,
            UserName = user?.FullName ?? user?.Email,
            UserEmail = user?.Email
        });
    }

    [HttpPut("{commentId:guid}")]
    public async Task<IActionResult> UpdateComment(Guid taskId, Guid commentId, [FromBody] UpdateCommentDto dto)
    {
        var userId = GetUserId();
        var comment = await _db.TaskComments.FirstOrDefaultAsync(c => c.TaskCommentId == commentId && c.TaskId == taskId);
        if (comment == null) return NotFound();
        if (comment.UserId != userId) return Forbid();

        if (string.IsNullOrWhiteSpace(dto.Content)) return BadRequest("Comment content cannot be empty.");

        comment.Content = dto.Content.Trim();
        comment.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(comment);
    }

    [HttpDelete("{commentId:guid}")]
    public async Task<IActionResult> DeleteComment(Guid taskId, Guid commentId)
    {
        var userId = GetUserId();
        var comment = await _db.TaskComments.Include(c => c.Task).FirstOrDefaultAsync(c => c.TaskCommentId == commentId && c.TaskId == taskId);
        if (comment == null) return NotFound();

        // Allow: own comment OR workspace admin
        var isAdmin = await _db.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == comment.Task.WorkspaceId && wm.UserId == userId && wm.Role == "Admin");
        if (comment.UserId != userId && !isAdmin) return Forbid();

        _db.TaskComments.Remove(comment);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
