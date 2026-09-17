using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaskManagementApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Phase2_AddTags_Subtasks_CustomFields_Templates_Webhooks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "RecurrenceEndDate",
                table: "Tasks",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RecurrenceInterval",
                table: "Tasks",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<string>(
                name: "RecurrencePattern",
                table: "Tasks",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CustomFields",
                columns: table => new
                {
                    CustomFieldId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    WorkspaceId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    FieldType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Text"),
                    OptionsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsRequired = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomFields", x => x.CustomFieldId);
                    table.ForeignKey(
                        name: "FK_CustomFields_Workspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalTable: "Workspaces",
                        principalColumn: "WorkspaceId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProjectTemplates",
                columns: table => new
                {
                    ProjectTemplateId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    WorkspaceId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectTemplates", x => x.ProjectTemplateId);
                    table.ForeignKey(
                        name: "FK_ProjectTemplates_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProjectTemplates_Workspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalTable: "Workspaces",
                        principalColumn: "WorkspaceId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Subtasks",
                columns: table => new
                {
                    SubtaskId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    TaskId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    IsCompleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    AssignedToUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DueDate = table.Column<DateTime>(type: "datetime", nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Subtasks", x => x.SubtaskId);
                    table.ForeignKey(
                        name: "FK_Subtasks_Tasks_TaskId",
                        column: x => x.TaskId,
                        principalTable: "Tasks",
                        principalColumn: "TaskId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Subtasks_Users_AssignedToUserId",
                        column: x => x.AssignedToUserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Tags",
                columns: table => new
                {
                    TagId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    WorkspaceId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Color = table.Column<string>(type: "nvarchar(7)", maxLength: 7, nullable: false, defaultValue: "#6B7280"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tags", x => x.TagId);
                    table.ForeignKey(
                        name: "FK_Tags_Workspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalTable: "Workspaces",
                        principalColumn: "WorkspaceId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WebhookEndpoints",
                columns: table => new
                {
                    WebhookEndpointId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    WorkspaceId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Url = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    Secret = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Events = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WebhookEndpoints", x => x.WebhookEndpointId);
                    table.ForeignKey(
                        name: "FK_WebhookEndpoints_Workspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalTable: "Workspaces",
                        principalColumn: "WorkspaceId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TaskCustomFieldValues",
                columns: table => new
                {
                    TaskCustomFieldValueId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    TaskId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CustomFieldId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ValueText = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaskCustomFieldValues", x => x.TaskCustomFieldValueId);
                    table.ForeignKey(
                        name: "FK_TaskCustomFieldValues_CustomFields_CustomFieldId",
                        column: x => x.CustomFieldId,
                        principalTable: "CustomFields",
                        principalColumn: "CustomFieldId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TaskCustomFieldValues_Tasks_TaskId",
                        column: x => x.TaskId,
                        principalTable: "Tasks",
                        principalColumn: "TaskId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TemplateTasks",
                columns: table => new
                {
                    TemplateTaskId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    ProjectTemplateId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Priority = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Normal"),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "To Do"),
                    SortOrder = table.Column<int>(type: "int", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TemplateTasks", x => x.TemplateTaskId);
                    table.ForeignKey(
                        name: "FK_TemplateTasks_ProjectTemplates_ProjectTemplateId",
                        column: x => x.ProjectTemplateId,
                        principalTable: "ProjectTemplates",
                        principalColumn: "ProjectTemplateId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TaskTags",
                columns: table => new
                {
                    TagsTagId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TasksTaskId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaskTags", x => new { x.TagsTagId, x.TasksTaskId });
                    table.ForeignKey(
                        name: "FK_TaskTags_Tags_TagsTagId",
                        column: x => x.TagsTagId,
                        principalTable: "Tags",
                        principalColumn: "TagId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TaskTags_Tasks_TasksTaskId",
                        column: x => x.TasksTaskId,
                        principalTable: "Tasks",
                        principalColumn: "TaskId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WebhookEvents",
                columns: table => new
                {
                    WebhookEventId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    WebhookEndpointId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Payload = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Delivered = table.Column<bool>(type: "bit", nullable: false),
                    DeliveryAttempts = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())"),
                    DeliveredAt = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WebhookEvents", x => x.WebhookEventId);
                    table.ForeignKey(
                        name: "FK_WebhookEvents_WebhookEndpoints_WebhookEndpointId",
                        column: x => x.WebhookEndpointId,
                        principalTable: "WebhookEndpoints",
                        principalColumn: "WebhookEndpointId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CustomFields_WorkspaceId",
                table: "CustomFields",
                column: "WorkspaceId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectTemplates_CreatedByUserId",
                table: "ProjectTemplates",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectTemplates_WorkspaceId",
                table: "ProjectTemplates",
                column: "WorkspaceId");

            migrationBuilder.CreateIndex(
                name: "IX_Subtasks_AssignedToUserId",
                table: "Subtasks",
                column: "AssignedToUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Subtasks_TaskId",
                table: "Subtasks",
                column: "TaskId");

            migrationBuilder.CreateIndex(
                name: "IX_Tags_WorkspaceId",
                table: "Tags",
                column: "WorkspaceId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskCustomFieldValues_CustomFieldId",
                table: "TaskCustomFieldValues",
                column: "CustomFieldId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskCustomFieldValues_TaskId",
                table: "TaskCustomFieldValues",
                column: "TaskId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskTags_TasksTaskId",
                table: "TaskTags",
                column: "TasksTaskId");

            migrationBuilder.CreateIndex(
                name: "IX_TemplateTasks_ProjectTemplateId",
                table: "TemplateTasks",
                column: "ProjectTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_WebhookEndpoints_WorkspaceId",
                table: "WebhookEndpoints",
                column: "WorkspaceId");

            migrationBuilder.CreateIndex(
                name: "IX_WebhookEvents_WebhookEndpointId_Delivered_CreatedAt",
                table: "WebhookEvents",
                columns: new[] { "WebhookEndpointId", "Delivered", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Subtasks");

            migrationBuilder.DropTable(
                name: "TaskCustomFieldValues");

            migrationBuilder.DropTable(
                name: "TaskTags");

            migrationBuilder.DropTable(
                name: "TemplateTasks");

            migrationBuilder.DropTable(
                name: "WebhookEvents");

            migrationBuilder.DropTable(
                name: "CustomFields");

            migrationBuilder.DropTable(
                name: "Tags");

            migrationBuilder.DropTable(
                name: "ProjectTemplates");

            migrationBuilder.DropTable(
                name: "WebhookEndpoints");

            migrationBuilder.DropColumn(
                name: "RecurrenceEndDate",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "RecurrenceInterval",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "RecurrencePattern",
                table: "Tasks");
        }
    }
}
