from email.headerregistry import Group

from django.contrib.auth import get_user_model
from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Cart, CartItem, Category, Order, OrderItem, Product, Review, Wishlist
from .serializers import (
    AdminCategorySerializer,
    AdminProductSerializer,
    CartItemSerializer,
    CartSerializer,
    OrderSerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    CategoryListSerializer,
    CategoryDetailSerializer,
    ReviewSerializer,
    StaffManagementSerializer,
    UserSerializer,
    WishlistSerializer,
    RegisterSerializer,
)
from django.db.models import Q, Count, Sum
import stripe
from django.conf import settings

from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt

from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from django.shortcuts import get_object_or_404
from .permissions import IsStaffOrSuperAdmin, IsSuperAdmin

from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
# Create your views here.
User = get_user_model()

@api_view(['GET'])
def product_list(request):
    products = Product.objects.filter(featured=True)
    serializer = ProductListSerializer(products, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def product_detail(request, slug):
    product = Product.objects.get(slug=slug)
    serializer = ProductDetailSerializer(product)
    return Response(serializer.data)


@api_view(['GET'])
def category_list(request):
    categories = Category.objects.all()
    serializer = CategoryListSerializer(categories, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def category_detail(request, slug):
    category = Category.objects.get(slug=slug)
    serializer = CategoryDetailSerializer(category)
    return Response(serializer.data)


@api_view(["POST"])
def add_to_cart(request):
    cart_code = request.data.get("cart_code")
    product_id = request.data.get("product_id")

    cart, created = Cart.objects.get_or_create(
        cart_code=cart_code
    )

    product = Product.objects.get(id=product_id)

    cartitem, created = CartItem.objects.get_or_create(
        cart=cart,
        product=product
    )

    if not created:
        cartitem.quantity += 1
    else:
        cartitem.quantity = 1

    cartitem.save()

    serializer = CartSerializer(cart)
    return Response(serializer.data)

@api_view(["PUT"])
def update_cart_item(request):
    cartitem_id = request.data.get("item_id")
    quantity = request.data.get("quantity")

    quantity = int(quantity)

    cartitem = CartItem.objects.get(id=cartitem_id)
    cartitem.quantity = quantity
    cartitem.save()

    serializer = CartItemSerializer(cartitem)
    return Response({"data": serializer.data, "message": "Cart item updated successfully"})


@api_view(["POST"])
def add_review(request):

    product_id = request.data.get("product_id")
    email = request.data.get("email")
    rating = request.data.get("rating")
    review_text = request.data.get("review")

    product = Product.objects.get(id=product_id)
    user = User.objects.get(email=email)

    if Review.objects.filter(product=product, user=user).exists():
        return Response({"message": "You have already reviewed this product."})

    review = Review.objects.create(
        product=product,
        user=user,
        rating=rating,
        review=review_text
    )

    serializer = ReviewSerializer(review)

    return Response({
        "data": serializer.data,
        "message": "Review added successfully"
    })

@api_view(["PUT"])
def update_review(request, pk):
    review = Review.objects.get(id=pk)
    rating = request.data.get("rating")
    review_text = request.data.get("review")
    review.rating = rating
    review.review = review_text
    review.save()
    serializer = ReviewSerializer(review)
    return Response({
        "data": serializer.data,
        "message": "Review updated successfully"
    })


@api_view(["DELETE"])
def delete_review(request, pk):
    review = Review.objects.get(id=pk)
    review.delete()
    return Response({
        "message": "Review deleted successfully"
    })


@api_view(["DELETE"])
def delete_cartitem(request, pk):
    cartitem = CartItem.objects.get(id=pk)
    cartitem.delete()
    return Response({
        "message": "Cart item deleted successfully"
    })

@api_view(['POST'])
def add_to_wishlist(request):
    email = request.data.get("email")
    product_id = request.data.get("product_id")

    user = User.objects.get(email=email)
    product = Product.objects.get(id=product_id)

    wishlist = Wishlist.objects.filter(user=user, product=product)
    if wishlist:
        wishlist.delete()
        return Response("Wishlist item removed successfully.", status=200)

    new_wishlist = Wishlist.objects.create(user=user, product=product)
    serializer = WishlistSerializer(new_wishlist)
    return Response(serializer.data, status=201)


@api_view(['GET'])
def product_search(request):
    query = request.query_params.get("query")

    if not query:
        return Response("No Query provided.", status=400)

    products = Product.objects.filter(
        Q(name__icontains=query) |
        Q(description__icontains=query) |
        Q(category__name__icontains=query)
    )

    serializer = ProductListSerializer(products, many=True)
    return Response(serializer.data)


stripe.api_key = settings.STRIPE_SECRET_KEY


@api_view(['POST'])
def create_checkout_session(request):
    cart_code = request.data.get("cart_code")
    email = request.data.get("email")

    cart = Cart.objects.get(cart_code=cart_code)
    cartitems = cart.cartitems.all()

    if not cartitems.exists():
        return Response(
            {"error": "Your cart is empty."},
            status=400
        )

    line_items = []

    for item in cartitems:
        line_items.append({
            "price_data": {
                "currency": "usd",
                "product_data": {
                    "name": item.product.name,
                },
                "unit_amount": int(item.product.price * 100),
            },
            "quantity": item.quantity,
        })

    checkout_session = stripe.checkout.Session.create(
        line_items=line_items,
        mode="payment",
        customer_email=email,
        metadata={
            "cart_code": cart_code
        },
        success_url="http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url="http://localhost:5173/cancel",
    )

    return Response({
        "checkout_url": checkout_session.url
    })



@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")
    endpoint_secret = settings.STRIPE_WEBHOOK_SECRET

    try:
        event = stripe.Webhook.construct_event(
            payload,
            sig_header,
            endpoint_secret
        )

    except ValueError:
        return HttpResponse(status=400)

    except stripe.error.SignatureVerificationError:
        return HttpResponse(status=400)

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        session_data = session.to_dict()

        if session_data["payment_status"] == "paid":
            cart_code = session_data.get("metadata", {}).get("cart_code")

            if cart_code:
                fulfil_checkout(session_data, cart_code)
                print("Payment successful!")
                print("Cart Code:", cart_code)
                print("Session ID:", session_data["id"])
            else:
                print("Cart code not found in metadata")

    return HttpResponse(status=200)


def fulfil_checkout(session, cart_code):
    order = Order.objects.create(
        stripe_checkout_id=session["id"],
        amount=session["amount_total"] / 100,
        currency=session["currency"],
        customer_email=session["customer_email"],
        status="completed"
    )

    cart = Cart.objects.get(cart_code=cart_code)
    cartitems = cart.cartitems.all()

    for item in cartitems:
        OrderItem.objects.create(
            order=order,
            product=item.product,
            quantity=item.quantity
        )


class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()
            token, created = Token.objects.get_or_create(user=user)

            return Response({
                'user': serializer.data,
                'token': token.key
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        return response


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()

        return Response({
            'message': 'Successfully logged out.'
        }, status=status.HTTP_200_OK)


class OrderHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(
            customer_email=request.user.email
        ).order_by('-created_at')

        serializer = OrderSerializer(orders, many=True)

        return Response(serializer.data)


class WishlistListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wishlist = Wishlist.objects.filter(
            user=request.user
        )

        serializer = WishlistSerializer(
            wishlist,
            many=True
        )

        return Response(serializer.data)


class UserProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def patch(self, request):
        serializer = UserSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={'request': request}
        )

        if serializer.is_valid():
            serializer.save()

            return Response({
                'message': 'Profile updated successfully!',
                'user': UserSerializer(
                    request.user,
                    context={'request': request}
                ).data
            }, status=200)

        return Response(serializer.errors, status=400)

class CustomerReviewsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        reviews = Review.objects.filter(
            user=request.user
        ).order_by('-created')

        serializer = ReviewSerializer(reviews, many=True)

        return Response(serializer.data)



class StaffOrderListView(APIView):
    permission_classes = [IsStaffOrSuperAdmin]

    def get(self, request):
        if not request.user.is_superuser:
            app_label = Order._meta.app_label
            if not request.user.has_perm(f"{app_label}.view_order"):
                return Response(
                    {"error": "You do not have permission to view orders."},
                    status=status.HTTP_403_FORBIDDEN
                )

        orders = Order.objects.all().order_by("-created_at")
        serializer = OrderSerializer(orders, many=True)

        return Response(serializer.data)



class StaffOrderDetailView(APIView):
    permission_classes = [IsStaffOrSuperAdmin]

    def get(self, request, pk):
        if not request.user.is_superuser:
            app_label = Order._meta.app_label

            if not request.user.has_perm(f"{app_label}.view_order"):
                return Response(
                    {"error": "You do not have permission to view orders."},
                    status=status.HTTP_403_FORBIDDEN
                )

        order = get_object_or_404(Order, pk=pk)
        serializer = OrderSerializer(order)

        return Response(serializer.data)


class StaffOrderStatusUpdateView(APIView):
    permission_classes = [IsStaffOrSuperAdmin]

    def patch(self, request, pk):
        if not request.user.is_superuser:
            app_label = Order._meta.app_label
            if not request.user.has_perm(f"{app_label}.change_order"):
                return Response(
                    {"error": "You do not have permission to update orders."},
                    status=status.HTTP_403_FORBIDDEN
                )

        order = get_object_or_404(Order, pk=pk)

        new_status = request.data.get("status")

        valid_statuses = dict(
            Order._meta.get_field("status").choices
        )

        if new_status not in valid_statuses:
            return Response(
                {"error": "Invalid order status."},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.status = new_status
        order.save(update_fields=["status"])

        serializer = OrderSerializer(order)

        return Response({
            "message": "Order status updated successfully.",
            "data": serializer.data
        })


class AdminDashboardOverviewView(APIView):
    permission_classes = [IsStaffOrSuperAdmin]

    def get(self, request):
        # Staff must have the required read permissions
        if not request.user.is_superuser:
            required_permissions = [
                "apiApp.view_product",
                "apiApp.view_category",
                "apiApp.view_order",
                "apiApp.view_review",
            ]

            if not request.user.has_perms(required_permissions):
                return Response(
                    {"error": "Dashboard permissions are incomplete."},
                    status=status.HTTP_403_FORBIDDEN
                )

        total_products = Product.objects.count()
        total_categories = Category.objects.count()
        total_orders = Order.objects.count()

        total_customers = User.objects.filter(
            is_staff=False,
            is_superuser=False
        ).count()

        completed_revenue = Order.objects.filter(
            status="completed"
        ).aggregate(total=Sum("amount"))["total"] or 0

        pending_orders = Order.objects.filter(
            status="pending"
        ).count()

        low_stock_products = Product.objects.filter(stock__lte=5)

        recent_orders = Order.objects.order_by("-created_at")[:5]

        return Response({
            "total_products": total_products,
            "total_categories": total_categories,
            "total_orders": total_orders,
            "total_customers": total_customers,
            "total_revenue": completed_revenue,
            "pending_orders": pending_orders,
            "low_stock_count": low_stock_products.count(),
            "low_stock_products": AdminProductSerializer(
                low_stock_products,
                many=True
            ).data,
            "recent_orders": OrderSerializer(
                recent_orders,
                many=True
            ).data,
        })


class AdminLowStockProductsView(APIView):
    permission_classes = [IsStaffOrSuperAdmin]

    def get(self, request):
        products = Product.objects.filter(
            stock__lte=5
        ).order_by("stock")

        serializer = AdminProductSerializer(products, many=True)

        return Response(serializer.data)



class AdminProductListCreateView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        products = Product.objects.all().order_by("-id")
        serializer = AdminProductSerializer(products, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = AdminProductSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class AdminProductDetailView(APIView):
    permission_classes = [IsSuperAdmin]

    def get_object(self, pk):
        return get_object_or_404(Product, pk=pk)

    def get(self, request, pk):
        product = self.get_object(pk)
        serializer = AdminProductSerializer(product)
        return Response(serializer.data)

    def put(self, request, pk):
        product = self.get_object(pk)
        serializer = AdminProductSerializer(
            product,
            data=request.data
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def patch(self, request, pk):
        product = self.get_object(pk)
        serializer = AdminProductSerializer(
            product,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, pk):
        product = self.get_object(pk)
        product.delete()

        return Response(
            {"message": "Product deleted successfully."},
            status=status.HTTP_200_OK
        )



class AdminCategoryListCreateView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        categories = Category.objects.all().order_by("-id")
        serializer = AdminCategorySerializer(categories, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = AdminCategorySerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class AdminCategoryDetailView(APIView):
    permission_classes = [IsSuperAdmin]

    def get_object(self, pk):
        return get_object_or_404(Category, pk=pk)

    def get(self, request, pk):
        category = self.get_object(pk)
        serializer = AdminCategorySerializer(category)
        return Response(serializer.data)

    def put(self, request, pk):
        category = self.get_object(pk)
        serializer = AdminCategorySerializer(
            category,
            data=request.data
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def patch(self, request, pk):
        category = self.get_object(pk)
        serializer = AdminCategorySerializer(
            category,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, pk):
        category = self.get_object(pk)
        category.delete()

        return Response(
            {"message": "Category deleted successfully."},
            status=status.HTTP_200_OK
        )


class AdminStaffListCreateView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        staff_users = User.objects.filter(
            is_staff=True,
            is_superuser=False
        ).order_by("-id")

        serializer = StaffManagementSerializer(
            staff_users,
            many=True
        )

        return Response(serializer.data)

    def post(self, request):
        username = request.data.get("username")
        email = request.data.get("email")
        password = request.data.get("password")
        first_name = request.data.get("first_name", "")
        last_name = request.data.get("last_name", "")

        if not username or not email or not password:
            return Response(
                {"error": "Username, email and password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {"error": "Username already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(email=email).exists():
            return Response(
                {"error": "Email already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )

        staff_group, created = Group.objects.get_or_create(
            name="Staff"
        )

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            is_staff=True
        )

        user.groups.add(staff_group)

        serializer = StaffManagementSerializer(user)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )


class AdminStaffRoleUpdateView(APIView):
    permission_classes = [IsSuperAdmin]

    def patch(self, request, pk):
        user = get_object_or_404(User, pk=pk)

        if user.is_superuser:
            return Response(
                {"error": "Super Admin role cannot be changed here."},
                status=status.HTTP_403_FORBIDDEN
            )

        role = request.data.get("role")

        if role not in ["staff", "customer"]:
            return Response(
                {"error": "Role must be staff or customer."},
                status=status.HTTP_400_BAD_REQUEST
            )

        staff_group, created = Group.objects.get_or_create(
            name="Staff"
        )

        if role == "staff":
            user.is_staff = True
            user.groups.add(staff_group)
        else:
            user.groups.remove(staff_group)
            user.is_staff = False

        user.save()

        serializer = StaffManagementSerializer(user)

        return Response({
            "message": "User role updated successfully.",
            "data": serializer.data
        })


class AdminReviewListView(APIView):
    permission_classes = [IsStaffOrSuperAdmin]

    def get(self, request):
        if not request.user.is_superuser:
            if not request.user.has_perm("apiApp.view_review"):
                return Response(
                    {"error": "You do not have permission."},
                    status=status.HTTP_403_FORBIDDEN
                )

        reviews = Review.objects.all().order_by("-created")
        serializer = ReviewSerializer(reviews, many=True)

        return Response(serializer.data)


class AdminReviewDeleteView(APIView):
    permission_classes = [IsStaffOrSuperAdmin]

    def delete(self, request, pk):
        if not request.user.is_superuser:
            if not request.user.has_perm("apiApp.delete_review"):
                return Response(
                    {"error": "You do not have permission."},
                    status=status.HTTP_403_FORBIDDEN
                )

        review = get_object_or_404(Review, pk=pk)
        review.delete()

        return Response({
            "message": "Review deleted successfully."
        })



class AdminAnalyticsView(APIView):
    permission_classes = [IsStaffOrSuperAdmin]

    def get(self, request):
        if not request.user.is_superuser:
            required_permissions = [
                "apiApp.view_order",
                "apiApp.view_product",
            ]

            if not request.user.has_perms(required_permissions):
                return Response(
                    {"error": "Analytics permissions are incomplete."},
                    status=status.HTTP_403_FORBIDDEN
                )

        today = timezone.now()
        start_date = today - timedelta(days=365)

        monthly_data = (
            Order.objects.filter(
                created_at__gte=start_date,
                status="completed"
            )
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(
                revenue=Sum("amount"),
                total_orders=Count("id")
            )
            .order_by("month")
        )

        monthly_revenue = [
            {
                "month": item["month"].strftime("%Y-%m"),
                "revenue": item["revenue"],
            }
            for item in monthly_data
        ]

        order_status = (
            Order.objects.values("status")
            .annotate(total=Count("id"))
            .order_by("status")
        )

        top_products = (
            OrderItem.objects.filter(order__status="completed")
            .values("product_id", "product__name")
            .annotate(total_sold=Sum("quantity"))
            .order_by("-total_sold")[:5]
        )

        return Response({
            "monthly_revenue": monthly_revenue,
            "order_status": list(order_status),
            "top_products": list(top_products),
        })



@api_view(["GET"])
def get_cart(request, cart_code):
    cart = Cart.objects.filter(cart_code=cart_code).first()

    if not cart:
        return Response(
            {"error": "Cart not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = CartSerializer(cart)
    return Response(serializer.data, status=status.HTTP_200_OK)