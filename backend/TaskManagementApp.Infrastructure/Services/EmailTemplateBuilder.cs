using System;
using System.Text;

namespace TaskManagementApp.Infrastructure.Services;

public static class EmailTemplateBuilder
{
    private const string BaseTemplate = @"
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='utf-8'>
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #334155; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }}
            .header {{ background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 24px; text-align: center; color: #ffffff; }}
            .header h1 {{ margin: 0; font-size: 24px; font-weight: 700; }}
            .content {{ padding: 32px; }}
            .task-box {{ background: #f1f5f9; border-left: 4px solid #6366f1; padding: 16px; margin: 20px 0; border-radius: 4px; }}
            .task-title {{ font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 8px; }}
            .btn {{ display: inline-block; background: #6366f1; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin-top: 20px; }}
            .footer {{ padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }}
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>DoneIt Workspace</h1>
            </div>
            <div class='content'>
                {CONTENT}
            </div>
            <div class='footer'>
                <p>Bạn nhận được email này vì bạn là thành viên của hệ thống DoneIt.</p>
                <p>&copy; {YEAR} DoneIt. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>";

    public static string BuildTaskAssignedTemplate(string userName, string taskTitle, string taskUrl)
    {
        var content = $@"
            <p>Xin chào <strong>{userName}</strong>,</p>
            <p>Bạn vừa được phân công vào một công việc mới trên hệ thống.</p>
            <div class='task-box'>
                <div class='task-title'>{taskTitle}</div>
            </div>
            <p>Vui lòng kiểm tra và cập nhật tiến độ công việc trên hệ thống.</p>
            <center><a href='{taskUrl}' class='btn'>Xem Công Việc</a></center>";

        return BaseTemplate
            .Replace("{CONTENT}", content)
            .Replace("{YEAR}", DateTime.Now.Year.ToString());
    }

    public static string BuildTaskStatusChangedTemplate(string userName, string taskTitle, string oldStatus, string newStatus, string taskUrl)
    {
        var content = $@"
            <p>Xin chào <strong>{userName}</strong>,</p>
            <p>Một công việc bạn đang theo dõi vừa được cập nhật trạng thái.</p>
            <div class='task-box'>
                <div class='task-title'>{taskTitle}</div>
                <p>Trạng thái: <del style='color: #ef4444;'>{oldStatus}</del> &rarr; <strong style='color: #10b981;'>{newStatus}</strong></p>
            </div>
            <center><a href='{taskUrl}' class='btn'>Xem Chi Tiết</a></center>";

        return BaseTemplate
            .Replace("{CONTENT}", content)
            .Replace("{YEAR}", DateTime.Now.Year.ToString());
    }
}
