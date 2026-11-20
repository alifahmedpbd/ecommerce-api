from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Product, Category, Cart, CartItem, Review, ProductRating, Wishlist
# Register your models here.

# Custom User Admin
class CustomUserAdmin(UserAdmin):
    list_display = ("username", "email", "first_name", "last_name")


admin.site.register(CustomUser, CustomUserAdmin)


# Product Admin
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "price", "featured")
    prepopulated_fields = {
        "slug": ("name",)
    }


admin.site.register(Product, ProductAdmin)


# Category Admin
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    prepopulated_fields = {
        "slug": ("name",)
    }


admin.site.register(Category, CategoryAdmin)
admin.site.register([Cart, CartItem, Review, ProductRating, Wishlist])