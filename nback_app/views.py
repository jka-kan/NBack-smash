from sre_constants import SUCCESS
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from httplib2 import Http
from django.shortcuts import render
from django.shortcuts import HttpResponse, HttpResponseRedirect, render
from django.contrib.auth import authenticate, login, logout
from django.urls import reverse
from django import forms
from django.utils.translation import gettext_lazy as _

from .models import User, UserData, Result
from django.db import IntegrityError
from datetime import datetime
from django.core.exceptions import ValidationError


# Create your views here.


def index(request):

    # Initialize session for anonymous user
    if "settings" not in request.session:
        print("Making new settings.")
        request.session["settings"] = {}
    else:
        print("Session settings exist.")
    
    get_settings(request)
    
    return render(request, "nback_app/index.html", {
            "form": SettingsForm(initial=request.session["settings"])})


def get_settings(request):
    # Get user settings from database
    try:
        user_obj = User.objects.get(username=request.user)
        userdata = UserData.objects.get(user=user_obj).serializer() | UserData.objects.get(user=user_obj).adv_serializer()

    # If user not logged
    except (User.DoesNotExist, UserData.DoesNotExist):
        print("User does not exist.")

        # If settings not saved, take default settings and save them in session
        if not request.session["settings"]:

            # Merge settings and advanced settings to single dict
            userdata = UserData().serializer() | UserData().adv_serializer()
            print("Default settings applied.", request.session["settings"])

        # If settings already exist, retrieve those from session
        else:
            userdata = request.session["settings"]
            print("Userdata retrieved from session.", userdata)

    if request.method == "GET":
        request.session["settings"] = userdata
        request.session.modified = True
        return JsonResponse(userdata)

    else:
        print("ERROR")
        return JsonResponse({
            "error": "GET or PUT request required."
        }, status=400)


def save_settings(request, clean_data):

    # Saves settings data from either changesettings() or reset_defaults() to database and session
    if request.user.is_authenticated:
        user_obj = User.objects.get(username=request.user)
        userdata = UserData.objects.get(user=user_obj)
        
        # Feed every settings item in database instance
        # Letters need escape characters
        for key, value in clean_data.items():
            if type(value) == str:
                value = f"\042{value}\042"
            cmd = f"userdata.{key}={value}"
            exec(cmd)
        userdata.save()

    request.session["settings"].update(clean_data)
    request.session.modified = True
    return request


def changesettings(request, advanced=False, clean_data=None):
    if request.method == "POST":

        # Check if we are handling normal settings or advanced settings
        # Both settings use this function to process userdata
        if advanced:
            form = AdvancedSettingsForm(request.POST)
            source_page = "nback_app/advanced_settings.html"
        else:
            form = SettingsForm(request.POST)
            source_page = "nback_app/index.html"

        if form.is_valid():
            clean_data = form.cleaned_data
            save_settings(request, clean_data)
            return HttpResponseRedirect(reverse("nback:index"))
                
        else:

            # If the form is invalid, send error message to template.
            # Template (source_page) is either index or advanced_settings
            print("Form invalid !!!")
            content = {"form": form}
            return render(request, source_page, content)

    data = request.session["settings"]
    return render(request, "nback_app/index.html", {"form": SettingsForm(initial=data)})


def advanced_settings(request):
    if request.method == "POST":
        return changesettings(request, advanced=True)
        
    data = request.session["settings"]
    return render(request, "nback_app/advanced_settings.html", {"form": AdvancedSettingsForm(initial=data)})


def help(request):
    return render(request, "nback_app/help.html")


def reset_defaults(request):
    current_settings = request.session["settings"]
    
    # Make sure that reset affects only basic or advanced settings one at the time
    if request.GET.get("name") == "advanced":
        userdata = current_settings | UserData().adv_serializer()
        save_settings(request, userdata)
        return render(request, "nback_app/advanced_settings.html", {"form": AdvancedSettingsForm(initial=userdata)})  

    else:
        userdata = current_settings | UserData().serializer()
        save_settings(request, userdata)
        return index(request)


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("nback:index"))
        else:
            return render(request, "nback_app/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "nback_app/login.html")


def logout_view(request):
    request.session["settings"] = {}
    logout(request)
    return HttpResponseRedirect(reverse("nback:index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "nback_app/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username=username, password=password)
            user.save()
            data = UserData.objects.create(user=user)
            data.save()
        except IntegrityError as e:
            print(e)
            return render(request, "nback_app/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("nback:index"))
    else:
        return render(request, "nback_app/register.html")


def statistics(request):
    if not request.user.is_authenticated:
        return JsonResponse({
            "error": "User not authenticated and doesn't have statistics."}, status=401)
    return render(request, "nback_app/statistics.html")


def get_results(request):
    if request.method == "GET":
        if not request.user.is_authenticated:
            return JsonResponse({
                "error": "User not authenticated and doesn't have statistics."}, status=401)

        else:
            # Make score statistics data
            user_obj = User.objects.get(username=request.user)
            data_obj = UserData.objects.get(user=user_obj)
            result_objects = Result.objects.filter(user=data_obj)

            data = {"scores": [], "game_id": [], "right_answer_percent": []}
            for obj in result_objects:
                data["scores"].append(obj.score)
                data["game_id"].append(obj.game_id)
                data["right_answer_percent"].append((obj.right_answers / obj.total_nbacks * 100))
                print("RIGHT ANSWERS: ", obj.right_answers)
                print("TOTAL NBACKS: ", obj.total_nbacks)

    return JsonResponse(data)


def register_results(request):
    # User gets scores with following formula:
    # Right answers + ekstra difficulty score. If settings are easier than default, user get minus points from these.
    
    if not request.user.is_authenticated:
        return JsonResponse({
            "error": "User not authenticated and doesn't have statistics."}, status=401)
    
    if request.method == "POST":
        right_answers = int(request.POST["right_answers"]) - int(request.POST["wrong_answers"]) 
        if right_answers < 0:
            right_answers = 0

        answer_score = right_answers / int(request.POST["total_nbacks"]) * 100
        print("right", request.POST["right_answers"])
        print("total", request.POST["total_nbacks"])
        print("success score", answer_score)

        # Init a model to access defaults
        # This routine takes to account that developer can change defaults, except boolean variables
        data_obj = UserData()

        difficulty_score = 0
        
        # Give extra points if these are enabled:
        if request.POST["rotate"] == True:
            difficulty_score += 1
        if request.POST["distraction"] == True:
            difficulty_score += 1
        if request.POST["rotate3d"] == True:
            difficulty_score += 4

        # Speed is 0.X, convert to whole numbers
        default_rotation_speed = int(data_obj.parse_default("rotation_speed") * 10)
        current_rotation_speed = float(request.POST["rotation_speed"]) * 10


        # Speed can be negative (rotation counter-clockwise). We need absolute values to calculate distance to default value.
        if abs(current_rotation_speed) > default_rotation_speed:
            difficulty_score += current_rotation_speed - default_rotation_speed 

        elif abs(current_rotation_speed) < default_rotation_speed:
            difficulty_score -= ((abs(current_rotation_speed) - default_rotation_speed))

        # Give 3 points on each extra Nback because it makes game much more difficult
        default_nback = int(data_obj.parse_default("nbacks"))
        current_nback = int(request.POST["nback"])

        if current_nback >= default_nback:
            difficulty_score += (current_nback - default_nback) * 3
        else:
            difficulty_score -= (current_nback - default_nback) * 3

        # Give 1 point on increase of sequence length by 5
        default_seq_length = int(data_obj.parse_default("sequence_length"))
        current_seq_length = int(request.POST["sequence_length"])

        if current_seq_length > default_seq_length:
            difficulty_score += int((current_seq_length - default_seq_length) / 5)

        score = answer_score + difficulty_score

        print("Score: ", score)

        # Feed results to database
        if request.user.is_authenticated:
            user_obj = User.objects.get(username=request.user)
            data_obj = UserData.objects.get(user=user_obj)
            result_obj = Result(user=data_obj)

            # Find highest session number and add next, or make first
            try:
                game_id = Result.objects.filter(user=data_obj).order_by('-game_id')[0].game_id + 1
            except IndexError:
                game_id = 1

            result_obj.game_id = game_id
            result_obj.score = score
            result_obj.timestamp = datetime.now()
            result_obj.difficulty_score = difficulty_score
            result_obj.total_nbacks = request.POST["total_nbacks"]
            result_obj.nback = request.POST["nback"]
            result_obj.right_answers = right_answers
            result_obj.save()

    return HttpResponseRedirect(reverse("nback:index"))


class SettingsForm(forms.Form):
    rotate = forms.BooleanField(label="Rotation", required=False)
    rotate3d = forms.BooleanField(label="3D", required=False)
    distraction = forms.BooleanField(label="Distractions", required=False)
    colored_grid = forms.BooleanField(label="Colored grid", required=False)
    # sounds = forms.BooleanField(label="Sounds", required=False)
    rotation_speed = forms.FloatField(
                label="Rotation speed",
                max_value=3.0,
                min_value=-3.0,
                widget=forms.NumberInput(attrs={"id": "form_rotation_speed", "step": "0.1"}))
    nbacks = forms.IntegerField(label="NBacks", max_value=6, min_value=1)
    sequence_length = forms.IntegerField(label="Sequence length", min_value=20, max_value=40)


class AdvancedSettingsForm(forms.Form):
    box_interval = forms.IntegerField(label="Box Interval", min_value=10)
    place_letter = forms.CharField(label="Place Button Key", max_length=1)
    sound_letter = forms.CharField(label="Sound Button Key", max_length=1)
    distraction_interval = forms.IntegerField(label="Distraction Interval", min_value=1, max_value=40)
    audio_volume = forms.FloatField(
                label="Volume",
                max_value=1.0,
                min_value=0.0,
                widget=forms.NumberInput(attrs={"id": "form_audio_volume", "step": "0.1"}))

    def clean(self):
        # Validate user defined letters in advanced settings
        cleaned_data = super().clean()

        place_letter = str(cleaned_data.get("place_letter"))
        sound_letter = str(cleaned_data.get("sound_letter"))

        if not place_letter.isdigit() and not place_letter.isalpha():
            raise ValidationError(_("Invalid key. Please choose another key between A-Z or 0-9."))
        if not sound_letter.isdigit() and not sound_letter.isalpha():
            raise ValidationError(_("Invalid key. Please choose another key between A-Z or 0-9."))
        
        place_letter = place_letter.lower()
        sound_letter = sound_letter.lower()

        if place_letter == sound_letter:
            raise ValidationError(_("Place and sound buttons can't have the same key."))
            

