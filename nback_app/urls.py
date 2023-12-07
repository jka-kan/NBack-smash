from django.urls import path, re_path
from . import views

app_name = "nback"
urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("admin/logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("userdata", views.get_settings, name="data"),
    path("changesettings", views.changesettings, name="changesettings"),
    path("advanced_settings", views.advanced_settings, name="advanced_settings"),
    path("statistics", views.statistics, name="statistics"),
    path("register_results", views.register_results, name="register_results"),
    path("get_results", views.get_results, name="get_results"),
    path("reset_defaults", views.reset_defaults, name="reset_defaults"),
    path("help", views.help, name="help")
    ]
