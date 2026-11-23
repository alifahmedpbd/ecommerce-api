
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Cart, CartItem, CustomUser, Order, OrderItem, Product, Category, Review, Wishlist

User = get_user_model()

# Product List Serializer
class ProductListSerializer(serializers.ModelSerializer):
    category_slug = serializers.SlugRelatedField(
        source='category',
        slug_field='slug',
        read_only=True
    )

    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'image', 'price', 'category_slug']


# Product Detail Serializer
class ProductDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "image",
            "price",
            "stock",
        ]


# Category List Serializer
class CategoryListSerializer(serializers.ModelSerializer):

    class Meta:
        model = Category
        fields = ["id", "name", "image", "slug"]


# Category Detail Serializer
class CategoryDetailSerializer(serializers.ModelSerializer):

    products = ProductListSerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "image", "products"]


# Cart Item Serializer
class CartItemSerializer(serializers.ModelSerializer):

    product = ProductListSerializer(read_only=True)
    sub_total = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ["id", "product", "quantity", "sub_total"]

    def get_sub_total(self, cartitem):
        total = cartitem.product.price * cartitem.quantity
        return total


# Cart Serializer
class CartSerializer(serializers.ModelSerializer):

    cartitems = CartItemSerializer(many=True, read_only=True)
    cart_total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ["id", "cart_code", "cartitems", "cart_total"]

    def get_cart_total(self, cart):
        items = cart.cartitems.all()

        total = sum(
            item.quantity * item.product.price
            for item in items
        )

        return total


# Cart Stats Serializer
class CartStatSerializer(serializers.ModelSerializer):

    total_quantity = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ["id", "cart_code", "total_quantity"]

    def get_total_quantity(self, cart):
        items = cart.cartitems.all()

        total = sum(
            item.quantity
            for item in items
        )

        return total

class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            'id',
            'username',
            'first_name',
            'last_name',
            'email',
            'profile_picture',
            'is_staff',
            'is_superuser',
            'role',
        ]
        read_only_fields = [
            'is_staff',
            'is_superuser',
            'role',
        ]

    def get_role(self, obj):
        if obj.is_superuser:
            return 'admin'

        if obj.groups.filter(name='Staff').exists():
            return 'staff'

        return 'customer'
        

class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Review
        fields = ["id", "user", "rating", "review", "created", "updated"]


class WishlistSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    product = ProductListSerializer(read_only=True)
    class Meta:
        model = Wishlist
        fields = ["id", "user", "product", "created_at",]




class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name']

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
    

class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'quantity']



class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'stripe_checkout_id',
            'customer_email',
            'amount',
            'currency',
            'status',
            'created_at',
            'items'
        ]


class AdminProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "description",
            "slug",
            "image",
            "price",
            "featured",
            "category",
            "stock",
        ]


class AdminCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "slug",
            "image",
        ]


class StaffManagementSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "role",
        ]

    def get_role(self, obj):
        if obj.is_superuser:
            return "super_admin"

        if obj.groups.filter(name="Staff").exists():
            return "staff"

        return "customer"
