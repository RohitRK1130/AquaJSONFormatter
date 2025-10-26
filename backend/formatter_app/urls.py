from django.urls import path
from .views import FormatJSONView

urlpatterns = [
    path('format/', FormatJSONView.as_view(), name='format-json'),
]
