from email.mime import audio
from operator import mod
from tkinter import CASCADE
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MaxValueValidator, MinValueValidator


# Create your models here.


class User(AbstractUser):
    pass


class UserData(models.Model):

    # Please note that changing of defaults in boolean fields affects calculating of score
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    rotate = models.BooleanField(default=False, blank=True, null=True)
    rotation_speed = models.FloatField(default=0.2,
                                        validators=[MinValueValidator(-3.0), MaxValueValidator(3.0)])

    distraction = models.BooleanField(default=False, blank=True, null=True)
    nbacks = models.IntegerField(default=2, max_length=2,
                                validators=[MinValueValidator(1), MaxValueValidator(6)])

    colored_grid = models.BooleanField(default=False, blank=True, null=True)
    sequence_length = models.IntegerField(default=20,
                                        validators=[MinValueValidator(20), MaxValueValidator(40)])
    sounds = models.BooleanField(default=True, blank=True, null=True)
    rotate3d = models.BooleanField(default=False, blank=True, null=True)


    # Advanced settings
    
    box_interval = models.IntegerField(default=25)
    place_letter = models.CharField(default="A", max_length=1)
    sound_letter = models.CharField(default="L", max_length=1)
    distraction_interval = models.IntegerField(default=12)
    audio_volume = models.FloatField(default=1.0) 

    # Future implementations?
    # box_color = models.CharField(blank=True, null=True)

    def serializer(self):
        return {
            "rotate": self.rotate,
            "rotation_speed": self.rotation_speed,
            "distraction": self.distraction,
            "nbacks": self.nbacks,
            "colored_grid": self.colored_grid,
            "sequence_length": self.sequence_length,
            "sounds": self.sounds,
            "rotate3d": self.rotate3d}

    def adv_serializer(self):
        return {
            "box_interval": self.box_interval,
            "place_letter": self.place_letter,
            "sound_letter": self.sound_letter,
            "distraction_interval": self.distraction_interval,
            "audio_volume": self.audio_volume
        }

    def parse_default(self, field):
        return self._meta.get_field(field).get_default()


class Result(models.Model):
    difficulty_score = models.IntegerField(default=1, max_length=2)
    right_answers = models.IntegerField(default=0)
    total_nbacks = models.IntegerField(default=0)
    nbacks = models.IntegerField(default=2)
    timestamp = models.DateTimeField(auto_now_add=True)
    score = models.IntegerField(default=0)
    game_id = models.IntegerField(default=1)
    user = models.ForeignKey(UserData, on_delete=models.CASCADE, null=True)


