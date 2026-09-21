using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagementApp.API.Extensions;
using TaskManagementApp.Domain.Constants;
using TaskManagementApp.Infrastructure.Data;

namespace TaskManagementApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SearchController : ControllerBase
{
    private readonly TaskManagementAppContext _db;

    public SearchController(TaskManagementAppContext db)
    {
        _db = db;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GlobalSearch([FromQuery] Guid workspaceId, [FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
        {
            return BadRequest("Search query must be at least 2 characters long.");
        }

        var userId = GetUserId();
        
        // RBAC: Any role (Admin, Member, Guest) can search if they belong to the workspace
        var hasAccess = await _db.HasWorkspaceRoleAsync(workspaceId, userId, 
            WorkspaceRoles.Admin, WorkspaceRoles.Member, WorkspaceRoles.Guest);
            
        if (!hasAccess) return Forbid();

        var query = q.ToLower();

        // 1. Search Tasks (Title or Description)
        var tasks = await _db.Tasks
            .AsNoTracking()
            .Where(t => t.WorkspaceId == workspaceId && 
                        (t.Title.ToLower().Contains(query) || (t.Description != null && t.Description.ToLower().Contains(query))))
            .Select(t => new { 
                Type = "Task", 
                Id = t.TaskId, 
                t.Title, 
                Match = t.Title.ToLower().Contains(query) ? t.Title : (t.Description != null && t.Description.Length > 100 ? t.Description.Substring(0, 100) + "..." : t.Description),
                Url = $"/workspaces/{workspaceId}/tasks?taskId={t.TaskId}"
            })
            .Take(10)
            .ToListAsync();

        // 2. Search Comments
        var comments = await _db.TaskComments
            .AsNoTracking()
            .Include(c => c.Task)
            .Where(c => c.Task.WorkspaceId == workspaceId && c.Content.ToLower().Contains(query))
            .Select(c => new { 
                Type = "Comment", 
                Id = c.TaskCommentId, 
                Title = $"Bình luận trong task: {c.Task.Title}", 
                Match = c.Content.Length > 100 ? c.Content.Substring(0, 100) + "..." : c.Content,
                Url = $"/workspaces/{workspaceId}/tasks?taskId={c.TaskId}"
            })
            .Take(10)
            .ToListAsync();

        // 3. Search Chat Messages (if applicable to workspace or general channel)
        var messages = await _db.ChatMessages
            .AsNoTracking()
            .Where(m => m.WorkspaceId == workspaceId && m.Content.ToLower().Contains(query))
            .Select(m => new { 
                Type = "Message", 
                Id = m.MessageId, 
                Title = "Tin nhắn trong Chat", 
                Match = m.Content.Length > 100 ? m.Content.Substring(0, 100) + "..." : m.Content,
                Url = $"/workspaces/{workspaceId}/messages"
            })
            .Take(10)
            .ToListAsync();

        var results = tasks.Cast<object>().Concat(comments).Concat(messages);
        
        return Ok(results);
    }
}
