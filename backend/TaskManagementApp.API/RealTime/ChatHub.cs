using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace TaskManagementApp.RealTime;

[Authorize]
public class ChatHub : Hub
{
    public async Task JoinWorkspace(string workspaceId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, workspaceId);
    }

    public async Task LeaveWorkspace(string workspaceId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, workspaceId);
    }
}
