using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagementApp.Domain.Entities;
using TaskManagementApp.Infrastructure.Data;

using Microsoft.AspNetCore.SignalR;
using TaskManagementApp.RealTime;

namespace TaskManagementApp.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly TaskManagementAppContext _db;
    private readonly IHubContext<ChatHub> _hubContext;

    public ChatController(TaskManagementAppContext db, IHubContext<ChatHub> hubContext)
    {
        _db = db;
        _hubContext = hubContext;
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

    public class SendMessageRequest
    {
        public Guid? WorkspaceId { get; set; }
        public Guid? ReceiverId { get; set; }
        public string Content { get; set; } = string.Empty;
    }

    [HttpPost("chat")]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Content)) return BadRequest("Message cannot be empty.");
        if (request.WorkspaceId == null && request.ReceiverId == null) return BadRequest("Must specify WorkspaceId or ReceiverId");
        
        var userId = GetUserId();

        if (request.WorkspaceId.HasValue)
        {
            var isMember = await _db.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == request.WorkspaceId.Value && wm.UserId == userId);
            if (!isMember) return Forbid();
        }
        
        var message = new ChatMessage
        {
            MessageId = Guid.NewGuid(),
            SenderId = userId,
            WorkspaceId = request.WorkspaceId,
            ReceiverId = request.ReceiverId,
            Content = request.Content.Trim(),
            SentAt = DateTime.UtcNow
        };

        _db.ChatMessages.Add(message);
        await _db.SaveChangesAsync();

        var sender = await _db.Users.FindAsync(userId);
        var broadcastMessage = new {
            message.MessageId,
            message.SenderId,
            SenderName = sender?.FullName ?? sender?.Email,
            message.Content,
            message.SentAt,
            message.ReceiverId
        };

        if (request.WorkspaceId.HasValue)
        {
            await _hubContext.Clients.Group(request.WorkspaceId.Value.ToString()).SendAsync("ReceiveMessage", broadcastMessage);
        }
        else if (request.ReceiverId.HasValue)
        {
            // Direct message could use UserId based grouping, but for now we just return
        }

        return Ok(message);
    }
}
