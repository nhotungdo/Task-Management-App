using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaskManagementApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixCascadeDelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaskCustomFieldValues_CustomFields_CustomFieldId",
                table: "TaskCustomFieldValues");

            migrationBuilder.AddForeignKey(
                name: "FK_TaskCustomFieldValues_CustomFields_CustomFieldId",
                table: "TaskCustomFieldValues",
                column: "CustomFieldId",
                principalTable: "CustomFields",
                principalColumn: "CustomFieldId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaskCustomFieldValues_CustomFields_CustomFieldId",
                table: "TaskCustomFieldValues");

            migrationBuilder.AddForeignKey(
                name: "FK_TaskCustomFieldValues_CustomFields_CustomFieldId",
                table: "TaskCustomFieldValues",
                column: "CustomFieldId",
                principalTable: "CustomFields",
                principalColumn: "CustomFieldId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
