using System;

namespace TaskManagementApp.Domain.Entities;

/// <summary>
/// Represents a dependency relationship between two tasks.
/// PredecessorTask must finish (or start) before SuccessorTask can begin.
/// </summary>
public class TaskDependency
{
    public Guid TaskDependencyId { get; set; }

    /// <summary>The task that must complete/start first</summary>
    public Guid PredecessorTaskId { get; set; }

    /// <summary>The task that depends on the predecessor</summary>
    public Guid SuccessorTaskId { get; set; }

    /// <summary>
    /// Dependency type:
    /// FS = Finish-to-Start (default: successor starts after predecessor finishes)
    /// SS = Start-to-Start (successor starts when predecessor starts)
    /// FF = Finish-to-Finish (successor finishes when predecessor finishes)
    /// SF = Start-to-Finish
    /// </summary>
    public string Type { get; set; } = "FS";

    /// <summary>Lag days (positive = delay, negative = overlap)</summary>
    public int LagDays { get; set; } = 0;

    public DateTime CreatedAt { get; set; }

    public virtual Task PredecessorTask { get; set; } = null!;
    public virtual Task SuccessorTask { get; set; } = null!;
}
