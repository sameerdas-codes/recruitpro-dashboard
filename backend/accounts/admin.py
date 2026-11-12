from django.contrib import admin

from .models import SupportRequest


@admin.register(SupportRequest)
class SupportRequestAdmin(admin.ModelAdmin):
    list_display = ("created_at", "name", "email", "topic", "status")
    list_filter = ("status", "topic", "created_at")
    search_fields = ("name", "email", "message")
    readonly_fields = ("name", "email", "topic", "message", "created_at")
    list_editable = ("status",)
