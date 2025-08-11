using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace TaskManagementApp.RealTime;

[Authorize]
public class TaskHub : Hub
{
    public Task JoinTaskGroup(string taskId)
    {
        return Groups.AddToGroupAsync(Context.ConnectionId, $"task:{taskId}");
    }

    public Task LeaveTaskGroup(string taskId)
    {
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, $"task:{taskId}");
    }
}


