using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;
using TaskManagementApp.Infrastructure.Data;
using TaskManagementApp.Domain.Entities;
using System;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace TaskManagementApp.RealTime;

[Authorize]
public class TaskHub : Hub
{
    private readonly TaskManagementAppContext _db;

    public TaskHub(TaskManagementAppContext db)
    {
        _db = db;
    }

    public System.Threading.Tasks.Task JoinTaskGroup(string taskId)
    {
        return Groups.AddToGroupAsync(Context.ConnectionId, $"task:{taskId}");
    }

    public System.Threading.Tasks.Task LeaveTaskGroup(string taskId)
    {
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, $"task:{taskId}");
    }

    public async System.Threading.Tasks.Task JoinWorkspace(string workspaceId)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId != null && Guid.TryParse(userId, out var uid) && Guid.TryParse(workspaceId, out var wid))
        {
            var isMember = await _db.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == wid && wm.UserId == uid);
            if (isMember)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"workspace:{workspaceId}");
            }
        }
    }

    public async System.Threading.Tasks.Task LeaveWorkspace(string workspaceId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"workspace:{workspaceId}");
    }

    public async System.Threading.Tasks.Task SendMessage(string workspaceId, string content)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId != null && Guid.TryParse(userId, out var uid) && Guid.TryParse(workspaceId, out var wid))
        {
            var isMember = await _db.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == wid && wm.UserId == uid);
            if (!isMember) return;

            var user = await _db.Users.FindAsync(uid);
            
            var msg = new ChatMessage
            {
                MessageId = Guid.NewGuid(),
                WorkspaceId = wid,
                SenderId = uid,
                Content = content,
                SentAt = DateTime.UtcNow
            };
            _db.ChatMessages.Add(msg);
            await _db.SaveChangesAsync();

            await Clients.Group($"workspace:{workspaceId}").SendAsync("ReceiveMessage", new
            {
                MessageId = msg.MessageId,
                SenderId = msg.SenderId,
                SenderName = user?.FullName ?? user?.Email,
                Content = msg.Content,
                SentAt = msg.SentAt
            });
        }
    }

    public async System.Threading.Tasks.Task SendDirectMessage(string receiverId, string content)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId != null && Guid.TryParse(userId, out var uid) && Guid.TryParse(receiverId, out var rid))
        {
            var user = await _db.Users.FindAsync(uid);
            var msg = new ChatMessage
            {
                MessageId = Guid.NewGuid(),
                WorkspaceId = null,
                ReceiverId = rid,
                SenderId = uid,
                Content = content,
                SentAt = DateTime.UtcNow
            };
            
            _db.ChatMessages.Add(msg);
            await _db.SaveChangesAsync();

            var messageData = new
            {
                MessageId = msg.MessageId,
                SenderId = msg.SenderId,
                SenderName = user?.FullName ?? user?.Email,
                Content = msg.Content,
                SentAt = msg.SentAt,
                ReceiverId = rid
            };

            await Clients.User(userId).SendAsync("ReceiveDirectMessage", messageData);
            if (userId != receiverId)
            {
                await Clients.User(receiverId).SendAsync("ReceiveDirectMessage", messageData);
            }
        }
    }
}


