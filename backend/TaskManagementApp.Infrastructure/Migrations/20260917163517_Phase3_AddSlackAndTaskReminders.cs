using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaskManagementApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Phase3_AddSlackAndTaskReminders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LastReminderSent",
                table: "Tasks",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ReminderEnabled",
                table: "Tasks",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "ReminderSent",
                table: "Tasks",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "SlackInstallations",
                columns: table => new
                {
                    SlackInstallationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    WorkspaceId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    SlackWorkspaceId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    SlackWorkspaceName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    SlackUserId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    AccessToken = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Scope = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())"),
                    RevokedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SlackInstallations", x => x.SlackInstallationId);
                    table.ForeignKey(
                        name: "FK_SlackInstallations_Workspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalTable: "Workspaces",
                        principalColumn: "WorkspaceId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SlackInstallations_WorkspaceId",
                table: "SlackInstallations",
                column: "WorkspaceId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SlackInstallations");

            migrationBuilder.DropColumn(
                name: "LastReminderSent",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "ReminderEnabled",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "ReminderSent",
                table: "Tasks");
        }
    }
}
