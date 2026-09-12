using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

using TaskManagementApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System;

namespace TaskManagementApp.RealTime;

[Authorize]
public class ChatHub : Hub
{
    private readonly TaskManagementAppContext _db;

    public ChatHub(TaskManagementAppContext db)
    {
        _db = db;
    }

    public async Task JoinWorkspace(string workspaceId)
    {
        var userIdString = Context.UserIdentifier;
        if (Guid.TryParse(userIdString, out Guid userId) && Guid.TryParse(workspaceId, out Guid wsId))
        {
            var isMember = await _db.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == wsId && wm.UserId == userId);
            if (isMember)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, workspaceId);
                return;
            }
        }
        
        throw new HubException("Unauthorized to join this workspace chat.");
    }

    public async Task LeaveWorkspace(string workspaceId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, workspaceId);
    }
}
