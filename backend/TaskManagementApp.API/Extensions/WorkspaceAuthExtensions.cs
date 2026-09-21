using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TaskManagementApp.Infrastructure.Data;

namespace TaskManagementApp.API.Extensions;

public static class WorkspaceAuthExtensions
{
    /// <summary>
    /// Checks if the given user has one of the required roles in the specified workspace.
    /// </summary>
    public static async Task<bool> HasWorkspaceRoleAsync(
        this TaskManagementAppContext db, 
        Guid workspaceId, 
        Guid userId, 
        params string[] allowedRoles)
    {
        return await db.WorkspaceMembers
            .AnyAsync(wm => wm.WorkspaceId == workspaceId && 
                            wm.UserId == userId && 
                            allowedRoles.Contains(wm.Role));
    }
}
