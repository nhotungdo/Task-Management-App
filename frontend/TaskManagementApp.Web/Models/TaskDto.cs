using System;

namespace TaskManagementApp.Web.Models
{
    public class TaskDto
    {
        public Guid TaskId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public DateTime? DueDate { get; set; }
        public Guid OwnerId { get; set; }
        public Guid WorkspaceId { get; set; }
        public DateTime CreatedAt { get; set; }
    }
    
    public class PaginatedResult<T>
    {
        public int Total { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public List<T> Items { get; set; } = new();
    }
}
