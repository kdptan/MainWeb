from django.contrib import admin
from .models import PetProfile


@admin.register(PetProfile)
class PetProfileAdmin(admin.ModelAdmin):
    list_display = ['pet_name', 'owner', 'breed', 'gender', 'age_display', 'created_at']
    search_fields = ['pet_name', 'breed', 'owner__username']
    list_filter = ['gender', 'age_unit']

    def age_display(self, obj):
        return f"{obj.age_value} {obj.age_unit}"
    age_display.short_description = 'Age'
