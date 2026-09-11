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
[Route("api/Tasks/{taskId:guid}/dependencies")]
[Authorize]
public class TaskDependenciesController : ControllerBase
{
    private readonly TaskManagementAppContext _db;

    public TaskDependenciesController(TaskManagementAppContext db) => _db = db;

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    public record CreateDependencyDto(Guid PredecessorTaskId, string Type = "FS", int LagDays = 0);

    /// <summary>Get all dependencies for a task (predecessors that block it)</summary>
    [HttpGet]
    public async Task<IActionResult> GetDependencies(Guid taskId)
    {
        var userId = GetUserId();
        var task = await _db.Tasks.AsNoTracking().FirstOrDefaultAsync(t => t.TaskId == taskId);
        if (task == null) return NotFound();

        var isMember = await _db.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == task.WorkspaceId && wm.UserId == userId);
        if (!isMember) return Forbid();

        var deps = await _db.TaskDependencies
            .AsNoTracking()
            .Include(d => d.PredecessorTask)
            .Include(d => d.SuccessorTask)
            .Where(d => d.SuccessorTaskId == taskId || d.PredecessorTaskId == taskId)
            .Select(d => new {
                d.TaskDependencyId,
                d.PredecessorTaskId,
                PredecessorTitle = d.PredecessorTask.Title,
                d.SuccessorTaskId,
                SuccessorTitle = d.SuccessorTask.Title,
                d.Type,
                d.LagDays
            })
            .ToListAsync();

        return Ok(deps);
    }

    /// <summary>Create a dependency: make taskId depend on a predecessor</summary>
    [HttpPost]
    public async Task<IActionResult> CreateDependency(Guid taskId, [FromBody] CreateDependencyDto dto)
    {
        var userId = GetUserId();

        // Validate both tasks exist and belong to same workspace
        var successorTask = await _db.Tasks.AsNoTracking().FirstOrDefaultAsync(t => t.TaskId == taskId);
        var predecessorTask = await _db.Tasks.AsNoTracking().FirstOrDefaultAsync(t => t.TaskId == dto.PredecessorTaskId);

        if (successorTask == null || predecessorTask == null) return NotFound("One or both tasks not found.");
        if (successorTask.WorkspaceId != predecessorTask.WorkspaceId)
            return BadRequest("Tasks must be in the same workspace.");
        if (taskId == dto.PredecessorTaskId)
            return BadRequest("A task cannot depend on itself.");

        var isMember = await _db.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == successorTask.WorkspaceId && wm.UserId == userId);
        if (!isMember) return Forbid();

        // Check for circular dependency (simple check: predecessor must not already depend on successor)
        var wouldCreateCycle = await WouldCreateCycle(taskId, dto.PredecessorTaskId);
        if (wouldCreateCycle) return BadRequest("This dependency would create a circular loop.");

        // Check duplicate
        var exists = await _db.TaskDependencies.AnyAsync(d =>
            d.PredecessorTaskId == dto.PredecessorTaskId && d.SuccessorTaskId == taskId);
        if (exists) return Conflict("This dependency already exists.");

        var dep = new TaskDependency
        {
            TaskDependencyId = Guid.NewGuid(),
            PredecessorTaskId = dto.PredecessorTaskId,
            SuccessorTaskId = taskId,
            Type = dto.Type ?? "FS",
            LagDays = dto.LagDays,
            CreatedAt = DateTime.UtcNow
        };

        _db.TaskDependencies.Add(dep);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetDependencies), new { taskId }, dep);
    }

    [HttpDelete("{depId:guid}")]
    public async Task<IActionResult> DeleteDependency(Guid taskId, Guid depId)
    {
        var userId = GetUserId();
        var dep = await _db.TaskDependencies.FirstOrDefaultAsync(d => d.TaskDependencyId == depId);
        if (dep == null) return NotFound();

        var task = await _db.Tasks.AsNoTracking().FirstOrDefaultAsync(t => t.TaskId == taskId);
        if (task == null) return NotFound();

        var isMember = await _db.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == task.WorkspaceId && wm.UserId == userId);
        if (!isMember) return Forbid();

        _db.TaskDependencies.Remove(dep);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>
    /// Checks whether adding PredecessorTaskId → SuccessorTaskId would create a cycle.
    /// Uses BFS/DFS traversal upstream from the proposed predecessor.
    /// </summary>
    private async Task<bool> WouldCreateCycle(Guid successorId, Guid proposedPredecessorId)
    {
        // If the proposedPredecessor is already a successor of our successorId, it's a cycle
        var visited = new System.Collections.Generic.HashSet<Guid>();
        var queue = new System.Collections.Generic.Queue<Guid>();
        queue.Enqueue(successorId);

        while (queue.Count > 0)
        {
            var current = queue.Dequeue();
            if (current == proposedPredecessorId) return true;
            if (!visited.Add(current)) continue;

            // Get successors of current (tasks that depend on current)
            var successors = await _db.TaskDependencies
                .AsNoTracking()
                .Where(d => d.PredecessorTaskId == current)
                .Select(d => d.SuccessorTaskId)
                .ToListAsync();

            foreach (var s in successors)
                queue.Enqueue(s);
        }

        return false;
    }
}
