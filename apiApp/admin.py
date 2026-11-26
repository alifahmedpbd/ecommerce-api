from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Coupon, DeliveryCharge, Order, OrderItem, Product, Category, Cart, CartItem, Review, ProductRating, Wishlist
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
admin.site.register([Cart, CartItem, Review, ProductRating, Wishlist, OrderItem])

class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "tracking_id",
        "customer_name",
        "customer_email",
        "payment_method",
        "status",
        "created_at",
    )

    search_fields = ("tracking_id", "customer_name", "customer_email")
    list_filter = ("status", "payment_method", "created_at")
    readonly_fields = ("tracking_id",)


admin.site.register(Order, OrderAdmin)
admin.site.register(Coupon)
admin.site.register(DeliveryCharge)