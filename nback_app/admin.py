from django.contrib import admin
from .models import User, UserData, Result


class ResultInline(admin.TabularInline):
    model = UserData

class ResultAdmin(admin.ModelAdmin):
    def get_user(self, obj):
        a = obj.user.obj
        return a

class UserAdmin(admin.ModelAdmin):
    inlines = [ResultInline,]

class UserDataInline(admin.TabularInline):
    model = Result

class UserDataAdmin(admin.ModelAdmin):
    list_display = ("get_user",)
    inlines = [UserDataInline,]

    def get_user(self, obj):
        return obj.user

# Register your models here.
admin.site.register(User, UserAdmin)
admin.site.register(UserData, UserDataAdmin)
admin.site.register(Result)
