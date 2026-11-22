
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ecommerceApiProject.settings")
django.setup()

from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from apiApp.models import Product, Category, Order, OrderItem, Review

staff_group, created = Group.objects.get_or_create(name="Staff")

models_permissions = {
    Product: ["view_product"],
    Category: ["view_category"],
    Order: ["view_order", "change_order"],
    OrderItem: ["view_orderitem"],
    Review: ["view_review", "change_review", "delete_review"],
}

for model, codenames in models_permissions.items():
    content_type = ContentType.objects.get_for_model(model)

    for codename in codenames:
        permission = Permission.objects.get(
            content_type=content_type,
            codename=codename
        )
        staff_group.permissions.add(permission)

print("Staff Group and permissions created successfully!")
