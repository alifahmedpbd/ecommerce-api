
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
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
from django.contrib.auth.models import Group

import secrets

from django.contrib.auth.hashers import make_password, check_password
from django.contrib.auth.password_validation import validate_password
from django.core.mail import send_mail
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

from .models import PendingRegistration, PasswordResetOTP
stripe.api_key = settings.STRIPE_SECRET_KEY
User = get_user_model()

# Create your views here.

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



@api_view(['POST'])
def create_checkout_session(request):
    cart_code = request.data.get("cart_code")
    email = request.data.get("email")
    name = request.data.get("name")
    phone = request.data.get("phone")
    address = request.data.get("address")
    payment_method = request.data.get("payment_method")

    if not all([cart_code, email, name, phone, address, payment_method]):
        return Response(
            {"error": "Please provide all checkout details."},
            status=400
        )

    if payment_method not in ["cod", "stripe"]:
        return Response({"error": "Invalid payment method."}, status=400)

    if len(address) > 500:
        return Response(
            {"error": "Address must be 500 characters or less."},
            status=400
        )

    cart = get_object_or_404(Cart, cart_code=cart_code)
    cartitems = cart.cartitems.select_related("product").all()

    if not cartitems.exists():
        return Response({"error": "Your cart is empty."}, status=400)

    total_amount = sum(
        (item.product.price * item.quantity for item in cartitems),
        Decimal("0.00")
    )

    # Cash on Delivery
    if payment_method == "cod":
        with transaction.atomic():
            order = Order.objects.create(
                amount=total_amount,
                currency="usd",
                customer_name=name,
                customer_email=email,
                customer_phone=phone,
                shipping_address=address,
                payment_method="cod",
                status="pending"
            )

            for item in cartitems:
                OrderItem.objects.create(
                    order=order,
                    product=item.product,
                    quantity=item.quantity
                )

            cart.cartitems.all().delete()

        send_order_email(order, "created")

        return Response({
            "message": "COD order placed successfully.",
            "order_id": order.id,
            "tracking_id": order.tracking_id,
            "status": order.status,
            "payment_method": order.payment_method
        }, status=201)

    # Stripe Online Payment
    try:
        checkout_session = stripe.checkout.Session.create(
            line_items=[
                {
                    "price_data": {
                        "currency": "usd",
                        "product_data": {
                            "name": item.product.name,
                        },
                        "unit_amount": int(item.product.price * 100),
                    },
                    "quantity": item.quantity,
                }
                for item in cartitems
            ],
            mode="payment",
            customer_email=email,
            metadata={
                "cart_code": cart_code,
                "customer_name": name,
                "customer_email": email,
                "customer_phone": phone,
                "shipping_address": address,
            },
            success_url=(
                "http://localhost:5173/success"
                "?session_id={CHECKOUT_SESSION_ID}"
            ),
            cancel_url="http://localhost:5173/cancel",
        )

        return Response({
            "message": "Stripe checkout session created.",
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id
        })

    except Exception as e:
        return Response(
            {"error": str(e)},
            status=400
        )



def send_order_email(order, event):
    subjects = {
        "created": "Your Order Has Been Placed",
        "shipped": "Your Order Has Been Shipped",
        "delivered": "Your Order Has Been Delivered",
        "cancelled": "Your Order Has Been Cancelled",
    }

    messages = {
        "created": "Thank you! Your order has been placed successfully.",
        "shipped": "Good news! Your order has been shipped.",
        "delivered": "Your order has been delivered successfully.",
        "cancelled": "Your order has been cancelled.",
    }

    subject = subjects.get(event)
    message = messages.get(event)

    if subject and message:
        send_mail(
            subject,
            (
                f"Hello {order.customer_name},\n\n"
                f"{message}\n\n"
                f"Order ID: {order.id}\n"
                f"Tracking ID: {order.tracking_id}\n"
                f"Amount: {order.amount} {order.currency.upper()}\n"
                f"Payment Method: {order.payment_method.upper()}\n"
                f"Order Status: {order.status.upper()}\n\n"
                "Please keep your Tracking ID safe to track your order.\n\n"
                "Thank you for shopping with us."
            ),
            settings.DEFAULT_FROM_EMAIL,
            [order.customer_email],
            fail_silently=True
        )



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
    except (ValueError, stripe.error.SignatureVerificationError):
        return HttpResponse(status=400)

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        session_data = session.to_dict()

        if session_data.get("payment_status") == "paid":
            cart_code = session_data.get("metadata", {}).get("cart_code")

            if cart_code:
                fulfil_checkout(session_data, cart_code)

    return HttpResponse(status=200)


def fulfil_checkout(session, cart_code):
    metadata = session.get("metadata", {})

    cart = Cart.objects.filter(cart_code=cart_code).first()
    if not cart:
        return

    with transaction.atomic():
        order, created = Order.objects.get_or_create(
            stripe_checkout_id=session["id"],
            defaults={
                "amount": Decimal(str(session["amount_total"])) / 100,
                "currency": session["currency"],
                "customer_name": metadata.get("customer_name", ""),
                "customer_email": metadata.get("customer_email", ""),
                "customer_phone": metadata.get("customer_phone", ""),
                "shipping_address": metadata.get("shipping_address", ""),
                "payment_method": "stripe",
                "status": "processing",
            }
        )

        if created:
            for item in cart.cartitems.select_related("product").all():
                OrderItem.objects.create(
                    order=order,
                    product=item.product,
                    quantity=item.quantity
                )

            cart.cartitems.all().delete()

    if created:
        send_order_email(order, "created")

class RegisterView(APIView):

    def post(self, request):
        username = request.data.get('username', '').strip()
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')

        if not username or not email or not password:
            return Response(
                {"message": "Username, email and password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {"message": "Username already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(email__iexact=email).exists():
            return Response(
                {"message": "Email already registered."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            validate_password(password)
        except ValidationError as error:
            return Response(
                {"password": list(error.messages)},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check pending registration conflicts
        pending = PendingRegistration.objects.filter(
            email=email
        ).first()

        username_pending = PendingRegistration.objects.filter(
            username=username
        ).first()

        if username_pending and username_pending.email != email:
            return Response(
                {"message": "Username is already being used for registration."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if pending and pending.username != username:
            return Response(
                {"message": "This email has a pending registration with another username."},
                status=status.HTTP_400_BAD_REQUEST
            )

        otp = str(secrets.randbelow(900000) + 100000)

        if pending:
            pending.username = username
            pending.first_name = first_name
            pending.last_name = last_name
            pending.password_hash = make_password(password)
            pending.otp_hash = make_password(otp)
            pending.expires_at = timezone.now() + timedelta(minutes=5)
            pending.attempts = 0
            pending.last_sent_at = timezone.now()
            pending.save()
        else:
            pending = PendingRegistration.objects.create(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                password_hash=make_password(password),
                otp_hash=make_password(otp),
                expires_at=timezone.now() + timedelta(minutes=5),
            )

        try:
            send_mail(
                subject="Your Ecommerce Registration OTP",
                message=(
                    f"Your OTP is: {otp}\n\n"
                    "This OTP will expire in 5 minutes."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception:
            return Response(
                {"message": "Unable to send OTP. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            {"message": "OTP sent successfully. Please verify your email."},
            status=status.HTTP_200_OK
        )


class VerifyRegistrationOTPView(APIView):

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        otp = str(request.data.get('otp', '')).strip()

        if not email or not otp:
            return Response(
                {"message": "Email and OTP are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        pending = PendingRegistration.objects.filter(
            email=email
        ).first()

        if not pending:
            return Response(
                {"message": "Registration request not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if pending.expires_at <= timezone.now():
            pending.delete()
            return Response(
                {"message": "OTP expired. Please register again."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if pending.attempts >= 5:
            pending.delete()
            return Response(
                {"message": "Too many incorrect attempts. Please register again."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not check_password(otp, pending.otp_hash):
            pending.attempts += 1
            pending.save(update_fields=['attempts'])

            return Response(
                {"message": "Invalid OTP."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                user = User.objects.create(
                    username=pending.username,
                    email=pending.email,
                    first_name=pending.first_name,
                    last_name=pending.last_name,
                    password=pending.password_hash,
                )

                token, created = Token.objects.get_or_create(user=user)

                user_data = UserSerializer(user).data

                pending.delete()

        except IntegrityError:
            return Response(
                {"message": "Username or email already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {
                "message": "Email verified and registration successful.",
                "user": user_data,
                "token": token.key,
            },
            status=status.HTTP_201_CREATED
        )


class ResendRegistrationOTPView(APIView):

    def post(self, request):
        email = request.data.get('email', '').strip().lower()

        if not email:
            return Response(
                {"message": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        pending = PendingRegistration.objects.filter(
            email=email
        ).first()

        if not pending:
            return Response(
                {"message": "Registration request not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if (timezone.now() - pending.last_sent_at).total_seconds() < 60:
            return Response(
                {"message": "Please wait 60 seconds before requesting another OTP."},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        otp = str(secrets.randbelow(900000) + 100000)

        pending.otp_hash = make_password(otp)
        pending.expires_at = timezone.now() + timedelta(minutes=5)
        pending.attempts = 0
        pending.last_sent_at = timezone.now()
        pending.save()

        try:
            send_mail(
                subject="Your New Ecommerce Registration OTP",
                message=f"Your new OTP is: {otp}\n\nThis OTP will expire in 5 minutes.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception:
            return Response(
                {"message": "Unable to send OTP. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            {"message": "A new OTP has been sent."},
            status=status.HTTP_200_OK
        )



class ForgotPasswordView(APIView):

    def post(self, request):
        email = request.data.get('email', '').strip().lower()

        if not email:
            return Response(
                {"message": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.filter(email__iexact=email).first()

        # Do not reveal whether an email is registered
        if not user:
            return Response(
                {"message": "If this email is registered, an OTP will be sent."},
                status=status.HTTP_200_OK
            )

        reset_otp, created = PasswordResetOTP.objects.get_or_create(
            user=user,
            defaults={
                'otp_hash': '',
                'expires_at': timezone.now(),
            }
        )

        # 60-second resend cooldown
        if not created and (
            timezone.now() - reset_otp.last_sent_at
        ).total_seconds() < 60:
            return Response(
                {"message": "Please wait 60 seconds before requesting another OTP."},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        otp = str(secrets.randbelow(900000) + 100000)

        reset_otp.otp_hash = make_password(otp)
        reset_otp.expires_at = timezone.now() + timedelta(minutes=5)
        reset_otp.attempts = 0
        reset_otp.verified_at = None
        reset_otp.reset_token_hash = ''
        reset_otp.last_sent_at = timezone.now()
        reset_otp.save()

        try:
            send_mail(
                subject="Ecommerce Password Reset OTP",
                message=(
                    f"Your password reset OTP is: {otp}\n\n"
                    "This OTP will expire in 5 minutes."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception:
            return Response(
                {"message": "Unable to send OTP. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            {"message": "If this email is registered, an OTP will be sent."},
            status=status.HTTP_200_OK
        )


class VerifyResetOTPView(APIView):

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        otp = str(request.data.get('otp', '')).strip()

        if not email or not otp:
            return Response(
                {"message": "Email and OTP are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        reset_otp = PasswordResetOTP.objects.filter(
            user__email__iexact=email
        ).select_related('user').first()

        if not reset_otp:
            return Response(
                {"message": "Invalid or expired OTP."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if reset_otp.verified_at:
            return Response(
                {"message": "OTP has already been verified."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if reset_otp.expires_at <= timezone.now():
            reset_otp.delete()
            return Response(
                {"message": "OTP expired. Please request a new OTP."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if reset_otp.attempts >= 5:
            reset_otp.delete()
            return Response(
                {"message": "Too many incorrect attempts. Request a new OTP."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not check_password(otp, reset_otp.otp_hash):
            reset_otp.attempts += 1
            reset_otp.save(update_fields=['attempts'])

            return Response(
                {"message": "Invalid OTP."},
                status=status.HTTP_400_BAD_REQUEST
            )

        reset_token = secrets.token_urlsafe(32)

        reset_otp.verified_at = timezone.now()
        reset_otp.expires_at = timezone.now() + timedelta(minutes=10)
        reset_otp.reset_token_hash = make_password(reset_token)
        reset_otp.save()

        return Response(
            {
                "message": "OTP verified successfully.",
                "reset_token": reset_token
            },
            status=status.HTTP_200_OK
        )


class ResetPasswordView(APIView):

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        reset_token = request.data.get('reset_token', '')
        new_password = request.data.get('new_password', '')

        if not email or not reset_token or not new_password:
            return Response(
                {"message": "Email, reset token and new password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        reset_otp = PasswordResetOTP.objects.filter(
            user__email__iexact=email
        ).select_related('user').first()

        if not reset_otp or not reset_otp.verified_at:
            return Response(
                {"message": "Please verify your OTP first."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if reset_otp.expires_at <= timezone.now():
            reset_otp.delete()
            return Response(
                {"message": "Reset session expired. Please start again."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not check_password(
            reset_token,
            reset_otp.reset_token_hash
        ):
            return Response(
                {"message": "Invalid reset token."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            validate_password(new_password, user=reset_otp.user)
        except ValidationError as error:
            return Response(
                {"new_password": list(error.messages)},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = reset_otp.user
        user.set_password(new_password)
        user.save(update_fields=['password'])

        # Invalidate the reset token and existing login token
        reset_otp.delete()
        Token.objects.filter(user=user).delete()

        return Response(
            {"message": "Password reset successfully. Please login again."},
            status=status.HTTP_200_OK
        )



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
                    status=403
                )

        order = get_object_or_404(Order, pk=pk)
        new_status = request.data.get("status")

        # Cancel: Staff/Admin can cancel any pending payment method.
        if new_status == "cancelled":
            if order.status != "pending":
                return Response(
                    {"error": "Only pending orders can be cancelled."},
                    status=400
                )

            order.status = "cancelled"
            order.save(update_fields=["status"])
            send_order_email(order, "cancelled")

            return Response({
                "message": "Order cancelled successfully.",
                "data": OrderSerializer(order).data
            })

        # Normal order status flow
        allowed_transitions = {
            "pending": ["processing"],
            "processing": ["shipped"],
            "shipped": ["delivered"],
        }

        if new_status not in allowed_transitions.get(order.status, []):
            return Response(
                {
                    "error": f"Cannot change order from {order.status} to {new_status}."
                },
                status=400
            )

        order.status = new_status
        order.save(update_fields=["status"])

        if new_status == "shipped":
            send_order_email(order, "shipped")
        elif new_status == "delivered":
            send_order_email(order, "delivered")

        return Response({
            "message": "Order status updated successfully.",
            "data": OrderSerializer(order).data
        })



@api_view(["POST"])
@permission_classes([IsAuthenticated])
def customer_cancel_order(request, pk):
    order = get_object_or_404(Order, pk=pk)

    # Verify order ownership using logged-in user's email
    if not request.user.email or order.customer_email.lower() != request.user.email.lower():
        return Response(
            {"error": "You do not have permission to cancel this order."},
            status=403
        )

    # Customer can cancel COD orders only
    if order.payment_method != "cod":
        return Response(
            {"error": "You can only cancel Cash on Delivery orders."},
            status=400
        )

    if order.status != "pending":
        return Response(
            {"error": "Only pending orders can be cancelled."},
            status=400
        )

    order.status = "cancelled"
    order.save(update_fields=["status"])

    send_order_email(order, "cancelled")

    return Response({
        "message": "Your order has been cancelled successfully.",
        "order_id": order.id,
        "tracking_id": order.tracking_id,
        "status": order.status
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


@api_view(['GET'])
def product_reviews(request, slug):
    product = Product.objects.get(slug=slug)

    reviews = Review.objects.filter(
        product=product
    ).select_related('user').order_by('-created')

    serializer = ReviewSerializer(reviews, many=True)

    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([AllowAny])
def track_order(request, tracking_id):
    phone_last4 = request.data.get("phone_last4", "")

    if not phone_last4.isdigit() or len(phone_last4) != 4:
        return Response(
            {"error": "Please enter the last 4 digits of your phone number."},
            status=400
        )

    order = get_object_or_404(
        Order,
        tracking_id=tracking_id
    )

    stored_phone = "".join(
        char for char in order.customer_phone if char.isdigit()
    )

    if not stored_phone.endswith(phone_last4):
        return Response(
            {"error": "Tracking ID or phone verification failed."},
            status=400
        )

    return Response({
        "tracking_id": order.tracking_id,
        "order_id": order.id,
        "customer_name": order.customer_name,
        "customer_email": order.customer_email,
        "customer_phone": order.customer_phone,
        "shipping_address": order.shipping_address,
        "amount": order.amount,
        "currency": order.currency,
        "payment_method": order.payment_method,
        "status": order.status,
        "created_at": order.created_at,
    })