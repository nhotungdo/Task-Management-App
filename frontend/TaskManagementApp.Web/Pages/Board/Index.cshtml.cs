using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using TaskManagementApp.Web.Models;
using System.Text.Json;

namespace TaskManagementApp.Web.Pages.Board;

public class IndexModel : PageModel
{
    private readonly ILogger<IndexModel> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    public List<TaskDto> ToDoTasks { get; set; } = new();
    public List<TaskDto> InProgressTasks { get; set; } = new();
    public List<TaskDto> ReviewTasks { get; set; } = new();
    public List<TaskDto> DoneTasks { get; set; } = new();

    public IndexModel(ILogger<IndexModel> logger, IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }

    public async Task OnGetAsync()
    {
        try
        {
            var client = _httpClientFactory.CreateClient("TaskApi");
            var dummyWorkspaceId = Guid.Empty;
            var response = await client.GetAsync($"api/Tasks?workspaceId={dummyWorkspaceId}");
            
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<PaginatedResult<TaskDto>>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                
                if (result != null && result.Items != null)
                {
                    var allTasks = result.Items;
                    ToDoTasks = allTasks.Where(t => t.Status == "To Do" || string.IsNullOrEmpty(t.Status)).ToList();
                    InProgressTasks = allTasks.Where(t => t.Status == "In Progress").ToList();
                    ReviewTasks = allTasks.Where(t => t.Status == "Review").ToList();
                    DoneTasks = allTasks.Where(t => t.Status == "Done").ToList();
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch tasks for Kanban board");
        }
    }
}
