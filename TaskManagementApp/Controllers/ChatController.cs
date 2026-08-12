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
[Route("api")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly TaskManagementAppContext _db;

    public ChatController(TaskManagementAppContext db)
    {
        _db = db;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("workspaces/{workspaceId:guid}/chat")]
    public async Task<IActionResult> GetWorkspaceMessages(Guid workspaceId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var userId = GetUserId();
        
        // Verify caller is a member of this workspace
        var isMember = await _db.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == workspaceId && wm.UserId == userId);
        if (!isMember) return Forbid();

        var messages = await _db.ChatMessages
            .Include(m => m.Sender)
            .Where(m => m.WorkspaceId == workspaceId)
            .OrderByDescending(m => m.SentAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new {
                m.MessageId,
                m.SenderId,
                SenderName = m.Sender.FullName ?? m.Sender.Email,
                m.Content,
                m.SentAt
            })
            .ToListAsync();
            
        // Return in chronological order
        messages.Reverse();

        return Ok(messages);
    }

    [HttpGet("chat/direct/{receiverId:guid}")]
    public async Task<IActionResult> GetDirectMessages(Guid receiverId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var userId = GetUserId();
        
        var messages = await _db.ChatMessages
            .Include(m => m.Sender)
            .Where(m => m.WorkspaceId == null && 
                       ((m.SenderId == userId && m.ReceiverId == receiverId) || 
                        (m.SenderId == receiverId && m.ReceiverId == userId)))
            .OrderByDescending(m => m.SentAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new {
                m.MessageId,
                m.SenderId,
                SenderName = m.Sender.FullName ?? m.Sender.Email,
                m.Content,
                m.SentAt,
                m.ReceiverId
            })
            .ToListAsync();
            
        messages.Reverse();

        return Ok(messages);
    }
}
