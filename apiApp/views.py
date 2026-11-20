from django.db.migrations import serializer
from django.contrib.auth import get_user_model
from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Cart, CartItem, Category, Order, OrderItem, Product, Review, Wishlist
from .serializers import (
    CartItemSerializer,
    CartSerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    CategoryListSerializer,
    CategoryDetailSerializer,
    ReviewSerializer,
    WishlistSerializer,
)
from django.db.models import Q
import stripe
from django.conf import settings

from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt

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
        success_url="http://localhost:3000/success",
        cancel_url="http://localhost:3000/cancel",
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