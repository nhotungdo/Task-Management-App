using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using TaskManagementApp.Web.Models;
using System.Text.Json;

namespace TaskManagementApp.Web.Pages.Dashboard;

public class IndexModel : PageModel
{
    private readonly ILogger<IndexModel> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    public int OpenTasks { get; set; } = 0;
    public int OverdueTasks { get; set; } = 0;
    public int CompletedThisWeek { get; set; } = 0;
    public List<TaskDto> TodayTasks { get; set; } = new();

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
            // NOTE: In a real app, you would attach the JWT token here
            // client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "YOUR_TOKEN");

            // For now, we will try to fetch tasks. If the API returns 401 Unauthorized, we handle it gracefully.
            // Using a dummy workspace ID for demonstration since workspace selection isn't built yet.
            var dummyWorkspaceId = Guid.Empty;
            var response = await client.GetAsync($"api/Tasks?workspaceId={dummyWorkspaceId}");
            
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<PaginatedResult<TaskDto>>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                
                if (result != null && result.Items != null)
                {
                    var allTasks = result.Items;
                    OpenTasks = allTasks.Count(t => t.Status != "Done");
                    OverdueTasks = allTasks.Count(t => t.DueDate < DateTime.UtcNow && t.Status != "Done");
                    CompletedThisWeek = allTasks.Count(t => t.Status == "Done" && t.CreatedAt >= DateTime.UtcNow.AddDays(-7)); // Assuming completed recently
                    TodayTasks = allTasks.Where(t => t.DueDate?.Date == DateTime.UtcNow.Date).ToList();
                }
            }
            else
            {
                _logger.LogWarning($"API call failed with status: {response.StatusCode}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch tasks from API");
        }
    }
}
