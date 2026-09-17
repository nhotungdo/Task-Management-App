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
[Route("api/tasks/{taskId:guid}/attachments")]
[Authorize]
public class FileAttachmentsController : ControllerBase
{
    private readonly TaskManagementAppContext _db;
    private readonly IHubContext<TaskHub> _hub;
    private readonly IWebHostEnvironment _env;
    private const long MaxFileSizeBytes = 20 * 1024 * 1024;

    public FileAttachmentsController(TaskManagementAppContext db, IHubContext<TaskHub> hub, IWebHostEnvironment env)
    {
        _db = db;
        _hub = hub;
        _env = env;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private async Task<bool> IsMemberAsync(Guid taskId, Guid userId)
    {
        var task = await _db.Tasks.AsNoTracking().FirstOrDefaultAsync(t => t.TaskId == taskId);
        if (task == null) return false;
        return await _db.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == task.WorkspaceId && wm.UserId == userId)
               || await _db.Workspaces.AnyAsync(w => w.WorkspaceId == task.WorkspaceId && w.OwnerId == userId)
               || task.OwnerId == userId;
    }

    private async Task<Guid?> GetTaskWorkspaceAsync(Guid taskId)
    {
        var task = await _db.Tasks.AsNoTracking().FirstOrDefaultAsync(t => t.TaskId == taskId);
        return task?.WorkspaceId;
    }

    [HttpGet]
    public async Task<IActionResult> GetAttachments(Guid taskId)
    {
        var userId = GetUserId();
        if (!await IsMemberAsync(taskId, userId)) return Forbid();

        var attachments = await _db.TaskAttachments
            .AsNoTracking()
            .Include(a => a.User)
            .Where(a => a.TaskId == taskId)
            .OrderByDescending(a => a.UploadedAt)
            .Select(a => new {
                a.TaskAttachmentId,
                a.FileName,
                a.FileUrl,
                a.ContentType,
                a.FileSizeBytes,
                a.UploadedAt,
                UserId = a.UserId,
                UserName = a.User != null ? (a.User.FullName ?? a.User.Email) : "Thành viên"
            })
            .ToListAsync();

        return Ok(attachments);
    }

    [HttpPost]
    public async Task<IActionResult> UploadAttachment(Guid taskId, IFormFile file)
    {
        var userId = GetUserId();
        if (!await IsMemberAsync(taskId, userId)) return Forbid();

        if (file == null || file.Length == 0)
            return BadRequest("No file provided");

        if (file.Length > MaxFileSizeBytes)
            return BadRequest("File size exceeds 20 MB limit");

        var workspaceId = await GetTaskWorkspaceAsync(taskId);

        var uploadsDir = workspaceId.HasValue
            ? Path.Combine(_env.WebRootPath, "uploads", "tasks", workspaceId.Value.ToString())
            : Path.Combine(_env.WebRootPath, "uploads", "tasks");

        if (!Directory.Exists(uploadsDir))
            Directory.CreateDirectory(uploadsDir);

        var fileExtension = Path.GetExtension(file.FileName);
        var storedFileName = $"{Guid.NewGuid()}{fileExtension}";
        var storedPath = Path.Combine(uploadsDir, storedFileName);

        using (var stream = new FileStream(storedPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var fileUrl = $"/uploads/tasks/{workspaceId.HasValue}/{storedFileName}";

        var attachment = new TaskAttachment
        {
            TaskAttachmentId = Guid.NewGuid(),
            TaskId = taskId,
            UserId = userId,
            FileName = file.FileName,
            FileUrl = fileUrl,
            ContentType = file.ContentType,
            FileSizeBytes = file.Length,
            UploadedAt = DateTime.UtcNow
        };

        _db.TaskAttachments.Add(attachment);
        await _db.SaveChangesAsync();

        await _hub.Clients.Group($"workspace:{workspaceId}").SendAsync("AttachmentAdded", new {
            attachment.TaskAttachmentId,
            attachment.FileName,
            attachment.FileUrl,
            attachment.ContentType,
            attachment.FileSizeBytes,
            attachment.UploadedAt
        });

        return CreatedAtAction(nameof(GetAttachments), new { taskId, id = attachment.TaskAttachmentId }, attachment);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteAttachment(Guid taskId, Guid id)
    {
        var userId = GetUserId();
        if (!await IsMemberAsync(taskId, userId)) return Forbid();

        var attachment = await _db.TaskAttachments
            .Include(a => a.Task)
            .FirstOrDefaultAsync(a => a.TaskId == taskId && a.TaskAttachmentId == id);
        if (attachment == null) return NotFound();

        var workspaceId = attachment.Task?.WorkspaceId;

        if (!string.IsNullOrEmpty(attachment.FileUrl))
        {
            var filePath = Path.Combine(_env.WebRootPath, "uploads", "tasks", Path.GetFileName(attachment.FileUrl));
            if (System.IO.File.Exists(filePath))
            {
                try { System.IO.File.Delete(filePath); } catch { }
            }
        }

        _db.TaskAttachments.Remove(attachment);
        await _db.SaveChangesAsync();

        await _hub.Clients.Group($"workspace:{workspaceId}").SendAsync("AttachmentDeleted", new { TaskAttachmentId = id });
        return NoContent();
    }
}
